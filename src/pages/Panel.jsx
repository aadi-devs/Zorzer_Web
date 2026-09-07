import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Layers,
  Play,
  Square,
  Lock,
  AlertTriangle,
} from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { fadeUp, fadeIn, staggerContainer, scaleIn } from "@/lib/motion";

// Which methods belong to each layer
const L4_METHOD_SET = new Set(["UDP-NORMAL", "UDP-BYPASS", "ICMP"]);
const L7_METHOD_SET = new Set([
  "HTTP-GET",
  "HTTP-POST",
  "API-FLOOD",
  "RAPID-RESET",
]);

// All available durations; filtered per plan max
const ALL_DURATIONS = [30, 60, 120, 180, 300, 600, 1200, 3600];

const ALL_L4_METHODS = ["UDP-NORMAL", "UDP-BYPASS", "ICMP"];
const ALL_L7_METHODS = ["HTTP-GET", "HTTP-POST", "API-FLOOD", "RAPID-RESET"];

const ATTACK_FORM_STORAGE_KEY = "zorzer:last-attack-inputs";

function readLastAttackInputs(userId) {
  if (typeof window === "undefined" || !userId) return {};
  try {
    const raw = window.localStorage.getItem(
      `${ATTACK_FORM_STORAGE_KEY}:${userId}`,
    );
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default function Panel() {
  const { user, profile, isAdmin } = useAuth();
  const plan = profile?.plan || null;

  // Admins bypass all plan restrictions — full access to everything
  const allowedLayers = isAdmin ? ["L4", "L7"] : plan?.access_layers || [];
  const allowedMethods = isAdmin
    ? new Set([...ALL_L4_METHODS, ...ALL_L7_METHODS])
    : new Set(plan?.methods || []);
  const maxDuration = isAdmin ? 0 : plan?.max_duration || 0; // 0 = unlimited
  const maxDailyRuns = isAdmin ? 0 : plan?.max_daily_runs || 0; // 0 = unlimited

  const l4Methods = [...allowedMethods].filter((m) => L4_METHOD_SET.has(m));
  const l7Methods = [...allowedMethods].filter((m) => L7_METHOD_SET.has(m));

  const hasL4 = allowedLayers.includes("L4") && l4Methods.length > 0;
  const hasL7 = allowedLayers.includes("L7") && l7Methods.length > 0;

  const defaultLayer = hasL4 ? "L4" : hasL7 ? "L7" : null;
  const defaultMethod = hasL4 ? l4Methods[0] : hasL7 ? l7Methods[0] : null;

  const [layer, setLayer] = useState(defaultLayer);
  const [method, setMethod] = useState(defaultMethod);
  const [target, setTarget] = useState("");
  const [domain, setDomain] = useState("");
  const [port, setPort] = useState("");
  const [duration, setDuration] = useState(null);
  const [hydratedStorageUserId, setHydratedStorageUserId] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState("");
  const [launchInfo, setLaunchInfo] = useState("");
  const [runs, setRuns] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [l4Busy, setL4Busy] = useState(false);
  const [l7Busy, setL7Busy] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [allocationPreview, setAllocationPreview] = useState(null);
  const [previewingAllocation, setPreviewingAllocation] = useState(false);
  const [allocationError, setAllocationError] = useState("");

  const currentMethods = layer === "L4" ? l4Methods : l7Methods;
  const durations = ALL_DURATIONS.filter(
    (d) => maxDuration === 0 || d <= maxDuration,
  );

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

  // Restore only after the authenticated user and current plan are available.
  // This prevents the initial empty render from overwriting saved inputs.
  useEffect(() => {
    if (!user?.id || (!isAdmin && !profile)) return;

    setHydratedStorageUserId(null);
    const saved = readLastAttackInputs(user.id);
    const restoredLayer = allowedLayers.includes(saved.layer)
      ? saved.layer
      : defaultLayer;
    const restoredMethods = restoredLayer === "L4" ? l4Methods : l7Methods;
    const restoredMethod = restoredMethods.includes(saved.method)
      ? saved.method
      : restoredMethods[0] || null;
    const parsedDuration = Number(saved.duration);
    const restoredDuration =
      saved.duration != null &&
      Number.isFinite(parsedDuration) &&
      (maxDuration === 0 || parsedDuration <= maxDuration) &&
      ALL_DURATIONS.includes(parsedDuration)
        ? parsedDuration
        : null;

    setLayer(restoredLayer);
    setMethod(restoredMethod);
    setTarget(typeof saved.target === "string" ? saved.target : "");
    setDomain(typeof saved.domain === "string" ? saved.domain : "");
    setPort(typeof saved.port === "string" ? saved.port : "");
    setDuration(restoredDuration);
    setHydratedStorageUserId(user.id);
  }, [user?.id, profile?.plan_id, isAdmin]);

  // Keep the latest form values in this browser for the current account.
  useEffect(() => {
    if (!user?.id || hydratedStorageUserId !== user.id) return;
    try {
      window.localStorage.setItem(
        `${ATTACK_FORM_STORAGE_KEY}:${user.id}`,
        JSON.stringify({ layer, method, target, domain, port, duration }),
      );
    } catch {
      // Browser storage can be unavailable in private or restricted contexts.
    }
  }, [
    user?.id,
    hydratedStorageUserId,
    layer,
    method,
    target,
    domain,
    port,
    duration,
  ]);

  // Keep method in sync when switching layers
  const selectLayer = (l) => {
    setLayer(l);
    const methods = l === "L4" ? l4Methods : l7Methods;
    setMethod(methods[0] || null);
    setTarget("");
    setPort("");
    setLaunchInfo("");
    setLaunchError("");
  };

  async function checkL4Busy() {
    const { data } = await supabase.rpc("is_l4_busy");
    setL4Busy(!!data);
  }

  async function checkL7Busy() {
    const { data } = await supabase.rpc("is_l7_busy");
    setL7Busy(!!data);
  }

  async function checkBusy() {
    await Promise.all([checkL4Busy(), checkL7Busy()]);
  }

  useEffect(() => {
    if (!user) return;
    fetchRuns();
    fetchTodayCount();
    checkBusy();
    // Poll every 5 s — refresh both active runs list and busy state
    const timer = setInterval(() => {
      fetchRuns();
      checkBusy();
    }, 5000);
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
      ...(l4Data || []).map((r) => ({ ...r, layer: "L4", _table: "l4_runs" })),
      ...(l7Data || []).map((r) => ({ ...r, layer: "L7", _table: "l7_runs" })),
    ];

    // Auto-expire runs whose duration window has passed.
    // For "running" runs: use started_at + duration.
    // For "queued" runs (API never responded): use created_at + duration + 30s grace.
    const expired = all.filter((r) => {
      if (r.started_at) {
        return new Date(r.started_at).getTime() + r.duration * 1000 <= now;
      } else {
        // queued with no started_at — expire after duration + 30 s grace period
        return (
          new Date(r.created_at).getTime() + (r.duration + 30) * 1000 <= now
        );
      }
    });

    if (expired.length > 0) {
      await Promise.all(
        expired.map((r) =>
          supabase
            .from(r._table)
            .update({ status: "success", stopped_at: new Date().toISOString() })
            .eq("id", r.id),
        ),
      );
      checkBusy();
    }

    const expiredIds = new Set(expired.map((r) => r.id));
    const active = all
      .filter((r) => !expiredIds.has(r.id))
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

  const dailyLimitReached =
    !isAdmin && maxDailyRuns > 0 && todayCount >= maxDailyRuns;
  const noPlan = !isAdmin && !plan;
  // UDP-NORMAL (method 1) needs a port; UDP-BYPASS (method 2) does not
  const needsPort = layer === "L4" && method === "UDP-NORMAL";
  const l4Blocked = layer === "L4" && l4Busy;
  const l7Blocked = layer === "L7" && l7Busy;
  const layerBlocked = l4Blocked || l7Blocked;

  function dbg(level, msg, detail = null) {
    const entry = { ts: new Date().toISOString(), level, msg, detail };
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `[Panel][${level.toUpperCase()}] ${msg}`,
      detail ?? "",
    );
    setDebugLogs((prev) => [entry, ...prev].slice(0, 200));
  }

  async function previewAllocation() {
    const targets = [
      ...new Set(
        target
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];
    if (!targets.length) {
      setAllocationError("Enter one or more IP addresses first.");
      setAllocationPreview(null);
      return;
    }

    setAllocationError("");
    setAllocationPreview(null);
    setPreviewingAllocation(true);
    dbg(
      "info",
      `Allocation preview requested for ${targets.length} IP${targets.length === 1 ? "" : "s"}`,
    );

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch("/proxy/l4/allocation-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ targets }),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json?.error ?? `HTTP ${response.status}`);

      setAllocationPreview(json);
      dbg(
        "info",
        `Health check complete — ${json.onlineNodeCount}/${json.configuredNodeCount} node(s) online; only online nodes divided across ${json.targetCount} IP(s)`,
      );
      (json.nodeStatuses || [])
        .filter((node) => !node.online)
        .forEach((node) => {
          dbg(
            "warn",
            `${node.id} excluded as offline${node.error ? ` (${node.error})` : ""}`,
          );
        });
      json.assignments.forEach(
        ({ target: assignedTarget, nodes: assignedNodes }) => {
          if (!assignedNodes.length) {
            dbg("warn", `${assignedTarget} → no node assigned`);
            return;
          }
          assignedNodes.forEach((node) =>
            dbg("info", `${node.id} → ${assignedTarget}`),
          );
        },
      );
    } catch (err) {
      setAllocationError(err.message);
      dbg("error", `Allocation preview failed: ${err.message}`);
    } finally {
      setPreviewingAllocation(false);
    }
  }

  async function launch(e) {
    e.preventDefault();
    if (!target.trim() || !method || !layer || !duration) return;
    if (needsPort && !port.trim()) return;
    if (dailyLimitReached) {
      setLaunchError(
        `Daily limit reached (${maxDailyRuns} attacks/day). Resets at midnight.`,
      );
      return;
    }
    // Parse and validate targets
    const targets = target
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!targets.length) {
      setLaunchError("Enter at least one target");
      return;
    }

    setLaunchError("");
    setLaunchInfo("");
    setLaunching(true);
    setShowDebug(true);
    setDebugLogs([]);

    const startedAt = new Date().toISOString();
    dbg(
      "info",
      `Launch started — layer=${layer} method=${method} target=${target.trim()} duration=${duration}s`,
    );

    const table = layer === "L4" ? "l4_runs" : "l7_runs";

    // ── 1. Insert run record as "queued" BEFORE firing any proxy calls.
    //    This ensures the run is always tracked even if the browser closes mid-flight.
    dbg("info", `Inserting run into ${table} (status=queued)…`);
    const { data: insertedRun, error: insertErr } = await supabase
      .from(table)
      .insert({
        user_id: user.id,
        target: target.trim(),
        ...(layer === "L4" && domain.trim() ? { domain: domain.trim() } : {}),
        method,
        duration,
        status: "queued",
      })
      .select("id")
      .single();

    if (insertErr) {
      dbg("error", "DB insert failed", insertErr.message);
      setLaunchError("Failed to save run: " + insertErr.message);
      setLaunching(false);
      return;
    }
    dbg("info", `Run queued → id=${insertedRun?.id}`);

    // ── 2. Fire API calls through server-side proxy ────────────────────────
    let nodesOnline = 0;
    let nodesTotal = 0;
    let proxyOk = false;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const authToken = session?.access_token ?? "";
    const proxyHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    // Fetch a single-use token — this binds the request to this browser session.
    // A token copied from DevTools is dead after first use.
    dbg("info", "Requesting single-use launch token…");
    let launchToken;
    try {
      const tokenRes = await fetch("/proxy/launch-token", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok)
        throw new Error(tokenJson?.error ?? `HTTP ${tokenRes.status}`);
      launchToken = tokenJson.token;
      dbg("info", "Launch token obtained");
    } catch (err) {
      dbg("error", `Failed to obtain launch token: ${err.message}`);
      setLaunchError("Could not start: " + err.message);
      await supabase
        .from(table)
        .update({ status: "failed", stopped_at: new Date().toISOString() })
        .eq("id", insertedRun.id);
      setLaunching(false);
      return;
    }

    if (layer === "L4") {
      dbg("info", `Dispatching L4 attack (${method}) via proxy…`);
      try {
        const r = await fetch("/proxy/l4/start", {
          method: "POST",
          headers: proxyHeaders,
          body: JSON.stringify({
            target: target.trim(),
            port,
            method,
            duration,
            launch_token: launchToken,
          }),
        });
        const json = await r.json();
        if (!r.ok) throw new Error(json?.error ?? `HTTP ${r.status}`);

        if (json.totalTargets > 1) {
          setLaunchInfo(
            `${json.successfulTargets}/${json.totalTargets} targets attacked · ` +
              `${json.onlineNodes}/${json.totalNodes} nodes online`,
          );
          dbg(
            "info",
            `Multi-target attack: ${json.successfulTargets}/${json.totalTargets} successful`,
          );
          json.assignments.forEach(
            ({ target: assignedTarget, nodeCount, nodes }) => {
              dbg("info", `${assignedTarget} → ${nodeCount} node(s)`);
            },
          );
          proxyOk = true;
        } else {
          nodesTotal = json.totalNodes;
          nodesOnline = json.onlineNodes;
          proxyOk = true;
          setLaunchInfo(
            nodesTotal === 0
              ? "No API nodes registered"
              : `${nodesOnline}/${nodesTotal} node(s) online`,
          );
        }
      } catch (err) {
        dbg("error", `L4 proxy error: ${err.message}`);
        setLaunchError(err.message);
      }
    }

    // ── 3. Update run status based on proxy result ─────────────────────────
    if (proxyOk) {
      await supabase
        .from(table)
        .update({ status: "running", started_at: startedAt })
        .eq("id", insertedRun.id);
      dbg("info", `Run ${insertedRun.id} → status=running`);
    } else {
      // Proxy call failed — mark as failed so it doesn't lock the busy state
      await supabase
        .from(table)
        .update({ status: "failed", stopped_at: new Date().toISOString() })
        .eq("id", insertedRun.id);
      dbg("warn", `Run ${insertedRun.id} → status=failed (proxy error)`);
    }

    setTarget("");
    setPort("");
    setDomain("");
    fetchRuns();
    fetchTodayCount();
    checkBusy();
    setLaunching(false);
  }

  async function stopRun(id, _table) {
    const runLayer = _table === "l4_runs" ? "L4" : "L7";

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const authToken = session?.access_token ?? "";
    const proxyHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    const endpoint = runLayer === "L4" ? "/proxy/l4/stop" : "/proxy/l7/stop";
    try {
      await fetch(endpoint, { method: "POST", headers: proxyHeaders });
    } catch (_) {}

    await supabase
      .from(_table)
      .update({ status: "success", stopped_at: new Date().toISOString() })
      .eq("id", id);
    fetchRuns();
    checkBusy();
  }

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <motion.header
          className="mb-8"
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeIn}
            className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"
          >
            <Crosshair className="h-3.5 w-3.5" /> Panel
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Launch Panel
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-2 max-w-2xl text-sm text-muted-foreground"
          >
            Configure and launch stress test runs. Methods and limits are set by
            your plan.
          </motion.p>
        </motion.header>

        <AnimatePresence>
          {noPlan && (
            <motion.div
              key="noplan"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-300">
                No plan assigned.{" "}
                <Link
                  to="/pricing"
                  className="underline underline-offset-2 hover:text-amber-200 transition-colors"
                >
                  View plans
                </Link>{" "}
                or contact your admin on Discord to get access.
              </p>
            </motion.div>
          )}
          {l4Busy && (
            <motion.div
              key="l4busy"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3"
            >
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-400" />
              <p className="text-sm text-red-300">
                An L4 attack is currently running. New L4 attacks are locked
                until it finishes.
              </p>
            </motion.div>
          )}
          {l7Busy && (
            <motion.div
              key="l7busy"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3"
            >
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-orange-400" />
              <p className="text-sm text-orange-300">
                An L7 attack is currently running. New L7 attacks are locked
                until it finishes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="grid grid-cols-1 gap-6 lg:grid-cols-5"
          variants={staggerContainer(0.1, 0.2)}
          initial="hidden"
          animate="visible"
        >
          {/* Config card */}
          <motion.section variants={scaleIn} className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">New run</h2>
                {plan && (
                  <span className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {plan.name} plan ·{" "}
                    {maxDailyRuns === 0 ? "∞" : `${todayCount}/${maxDailyRuns}`}{" "}
                    today
                  </span>
                )}
              </div>

              {noPlan ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Lock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">
                    No plan assigned to your account.
                  </p>
                </div>
              ) : (
                <form onSubmit={launch} className="space-y-5 p-5">
                  {/* Layer toggle — only show if plan has both layers */}
                  {hasL4 && hasL7 && (
                    <Field label="Layer">
                      <div className="inline-flex rounded-lg border border-white/[0.08] bg-black/40 p-1">
                        {[hasL4 && "L4", hasL7 && "L7"]
                          .filter(Boolean)
                          .map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => selectLayer(l)}
                              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                                layer === l
                                  ? "bg-white text-black"
                                  : "text-muted-foreground hover:text-foreground"
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
                  <Field
                    label={
                      layer === "L4"
                        ? "Target IP(s) — allocation preview"
                        : "Target URL"
                    }
                  >
                    <input
                      required
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder={
                        layer === "L4"
                          ? "203.0.113.10, 203.0.113.11"
                          : "https://example.com"
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10"
                    />
                    {layer === "L4" && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] text-muted-foreground">
                          Enter comma-separated IPs to preview node assignment.
                          No traffic is sent.
                        </p>
                        <button
                          type="button"
                          onClick={previewAllocation}
                          disabled={previewingAllocation}
                          className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-[11px] font-medium text-cyan-200 transition-colors hover:bg-cyan-400/15 disabled:opacity-50"
                        >
                          {previewingAllocation
                            ? "Previewing…"
                            : "Preview allocation"}
                        </button>
                      </div>
                    )}
                    {allocationError && layer === "L4" && (
                      <p className="mt-2 text-xs text-red-400">
                        {allocationError}
                      </p>
                    )}
                    {allocationPreview && layer === "L4" && (
                      <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-medium text-cyan-100">
                            Dry-run allocation
                          </span>
                          <span className="font-mono text-cyan-200/70">
                            {allocationPreview.onlineNodeCount} online /{" "}
                            {allocationPreview.configuredNodeCount} configured ·{" "}
                            {allocationPreview.targetCount} IP(s)
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {allocationPreview.assignments.map(
                            ({
                              target: assignedTarget,
                              nodes: assignedNodes,
                            }) => (
                              <div
                                key={assignedTarget}
                                className="flex flex-col gap-1 rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-2 sm:flex-row sm:items-start sm:gap-3"
                              >
                                <span className="shrink-0 font-mono text-xs text-zinc-200">
                                  {assignedTarget}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {assignedNodes.length
                                    ? assignedNodes
                                        .map((node) => node.id)
                                        .join(", ")
                                    : "no node assigned"}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                        {allocationPreview.offlineNodeCount > 0 && (
                          <p className="mt-2 text-[10px] text-amber-200/75">
                            {allocationPreview.offlineNodeCount} offline node(s)
                            excluded from the assignment.
                          </p>
                        )}
                        <p className="mt-2 text-[10px] text-cyan-200/60">
                          Health checks only — no attack or traffic endpoint was
                          contacted.
                        </p>
                      </div>
                    )}
                  </Field>

                  {/* Domain — L4 only, mandatory, stored for record-keeping */}
                  {layer === "L4" && (
                    <Field label="Domain">
                      <input
                        required
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="example.com"
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10"
                      />
                    </Field>
                  )}

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
                        Daily limit reached ({maxDailyRuns} attacks/day). Resets
                        at midnight.
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
                    disabled={
                      launching || dailyLimitReached || !method || layerBlocked
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    {launching
                      ? "Firing APIs…"
                      : layerBlocked
                        ? `${layer} locked — attack in progress`
                        : "Launch run"}
                  </button>
                </form>
              )}

              {/* ── Debug panel — admin only ──────────────────────────── */}
              {isAdmin && debugLogs.length > 0 && (
                <div className="border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowDebug((v) => !v)}
                    className="flex w-full items-center justify-between px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Debug log ({debugLogs.length} entries)</span>
                    <span>{showDebug ? "▲ hide" : "▼ show"}</span>
                  </button>
                  {showDebug && (
                    <div className="mx-5 mb-4 max-h-64 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/60 p-3 font-mono text-[10px] leading-relaxed">
                      {[...debugLogs].reverse().map((e, i) => (
                        <div
                          key={i}
                          className={`flex gap-2 ${
                            e.level === "error"
                              ? "text-red-400"
                              : e.level === "warn"
                                ? "text-amber-400"
                                : "text-zinc-400"
                          }`}
                        >
                          <span className="shrink-0 text-zinc-600">
                            {e.ts.slice(11, 23)}
                          </span>
                          <span
                            className={`shrink-0 w-8 ${
                              e.level === "error"
                                ? "text-red-500"
                                : e.level === "warn"
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                            }`}
                          >
                            {e.level === "error"
                              ? "ERR"
                              : e.level === "warn"
                                ? "WRN"
                                : "INF"}
                          </span>
                          <span className="break-all">
                            {e.msg}
                            {e.detail != null && (
                              <span className="ml-1 text-zinc-500">
                                {typeof e.detail === "object"
                                  ? JSON.stringify(e.detail)
                                  : String(e.detail)}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>

          {/* Active runs */}
          <motion.section variants={fadeUp} className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Active runs</h2>
                <div className="flex items-center gap-2">
                  {/* Real-time concurrent indicators */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] ${l4Busy ? "border-red-500/20 text-red-300" : "border-white/[0.06] text-muted-foreground"}`}
                  >
                    L4 {l4Busy ? "1/1" : "0/1"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] ${l7Busy ? "border-orange-500/20 text-orange-300" : "border-white/[0.06] text-muted-foreground"}`}
                  >
                    L7 {l7Busy ? "1/1" : "0/1"}
                  </span>
                </div>
              </div>
              {runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Crosshair className="mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">
                    No active runs
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {runs.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-medium">
                          {r.target}
                        </p>
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
          </motion.section>
        </motion.div>
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
    queued: "bg-white/[0.04] text-muted-foreground ring-white/[0.06]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map[status] || map.queued}`}
    >
      {status === "running" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300" />
      )}
      {status}
    </span>
  );
}
