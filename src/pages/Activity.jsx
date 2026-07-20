import { useState, useEffect } from "react";
import { History, Filter, CheckCircle2, Clock3, XCircle, Loader2, Shield } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";

const STATUS_FILTERS = ["All", "Success", "Running", "Failed", "Queued"];
const LAYER_FILTERS  = ["All Layers", "L4 Only", "L7 Only"];

const STATUS_MAP = {
  success: { icon: CheckCircle2, label: "success", cls: "bg-zinc-100/10 text-zinc-200 ring-white/10" },
  running: { icon: Loader2,      label: "running", cls: "bg-white/[0.04] text-zinc-300 ring-white/[0.08]", spin: true },
  failed:  { icon: XCircle,      label: "failed",  cls: "bg-red-500/10 text-red-300 ring-red-500/20" },
  queued:  { icon: Clock3,       label: "queued",  cls: "bg-white/[0.04] text-muted-foreground ring-white/[0.06]" },
};

const LAYER_CLS = {
  L4: "border-blue-500/20 text-blue-300",
  L7: "border-purple-500/20 text-purple-300",
};

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export default function Activity() {
  const { user, isAdmin, isLoadingAuth } = useAuth();
  const [statusFilter, setStatusFilter] = useState("All");
  const [layerFilter,  setLayerFilter]  = useState("All Layers");
  const [runs,    setRuns]    = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-admins
  if (!isLoadingAuth && !isAdmin) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    if (!user || !isAdmin) return;
    async function fetchRuns() {
      setLoading(true);
      // Admin: fetch all users' runs, joined with profiles for display name
      const [{ data: l4Data }, { data: l7Data }] = await Promise.all([
        supabase
          .from("l4_runs")
          .select("*, profile:profiles(full_name, email)")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("l7_runs")
          .select("*, profile:profiles(full_name, email)")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      const combined = [
        ...(l4Data || []).map(r => ({ ...r, layer: "L4" })),
        ...(l7Data || []).map(r => ({ ...r, layer: "L7" })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRuns(combined);
      setLoading(false);
    }
    fetchRuns();
  }, [user, isAdmin]);

  const filtered = runs.filter((r) => {
    const layerOk =
      layerFilter === "All Layers" ||
      (layerFilter === "L4 Only" && r.layer === "L4") ||
      (layerFilter === "L7 Only" && r.layer === "L7");
    const statusOk =
      statusFilter === "All" || r.status === statusFilter.toLowerCase();
    return layerOk && statusOk;
  });

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-400">Admin</span>
            <span className="text-muted-foreground/40">·</span>
            <History className="h-3.5 w-3.5" /> Activity
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            All Attack Activity
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Full log of every Layer 4 and Layer 7 run across all users.
          </p>
        </header>

        {/* Layer filter */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {LAYER_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setLayerFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                layerFilter === f
                  ? "bg-white text-black"
                  : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f
                  ? "bg-white text-black"
                  : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Runs will appear here after users launch from the Panel.
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden grid-cols-[7rem_3rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem_3.5rem_5.5rem] gap-3 border-b border-white/[0.06] px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:grid">
                <span>Time</span>
                <span>Layer</span>
                <span>User</span>
                <span>Target / Domain</span>
                <span>Method</span>
                <span className="text-right">Dur.</span>
                <span className="text-right">Status</span>
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {filtered.map((r) => {
                  const S = STATUS_MAP[r.status] || STATUS_MAP.queued;
                  const Icon = S.icon;
                  const userLabel = r.profile?.full_name || r.profile?.email || r.user_id?.slice(0, 8) + "…";
                  return (
                    <li
                      key={`${r.layer}-${r.id}`}
                      className="grid grid-cols-1 gap-1 px-5 py-3.5 transition-colors hover:bg-white/[0.02] sm:grid-cols-[7rem_3rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem_3.5rem_5.5rem] sm:items-center sm:gap-3"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatTime(r.created_at)}
                      </span>
                      <span className={`w-fit rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${LAYER_CLS[r.layer]}`}>
                        {r.layer}
                      </span>
                      {/* User */}
                      <span className="truncate text-xs text-zinc-400" title={r.profile?.email}>
                        {userLabel}
                      </span>
                      {/* Target + domain (L4 only) */}
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-xs font-medium">{r.target}</span>
                        {r.layer === "L4" && r.domain && (
                          <span className="block truncate font-mono text-[10px] text-muted-foreground">{r.domain}</span>
                        )}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">{r.method}</span>
                      <span className="text-right font-mono text-xs text-muted-foreground sm:pr-1">
                        {r.duration}s
                      </span>
                      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 sm:ml-auto ${S.cls}`}>
                        <Icon className={`h-3 w-3 ${S.spin ? "animate-spin" : ""}`} />
                        {S.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Summary cards */}
        {!loading && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "L4 Total",   value: runs.filter(r => r.layer === "L4").length,         cls: "text-blue-300" },
              { label: "L7 Total",   value: runs.filter(r => r.layer === "L7").length,         cls: "text-purple-300" },
              { label: "Successful", value: runs.filter(r => r.status === "success").length,   cls: "text-zinc-200" },
              { label: "Failed",     value: runs.filter(r => r.status === "failed").length,    cls: "text-red-300" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className={`mt-1 font-heading text-2xl font-semibold ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>
    </div>
  );
}
