import { useState, useEffect } from "react";
import { History, Filter, CheckCircle2, Clock3, XCircle, Loader2 } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const FILTERS = ["All", "Success", "Running", "Failed", "Queued"];

const STATUS_MAP = {
  success: { icon: CheckCircle2, label: "success", cls: "bg-zinc-100/10 text-zinc-200 ring-white/10" },
  running: { icon: Loader2,      label: "running", cls: "bg-white/[0.04] text-zinc-300 ring-white/[0.08]", spin: true },
  failed:  { icon: XCircle,      label: "failed",  cls: "bg-red-500/10 text-red-300 ring-red-500/20" },
  queued:  { icon: Clock3,       label: "queued",  cls: "bg-white/[0.04] text-muted-foreground ring-white/[0.06]" },
};

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export default function Activity() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchRuns() {
      setLoading(true);
      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setRuns(data);
      setLoading(false);
    }
    fetchRuns();
  }, [user]);

  const filtered = runs.filter((r) => {
    if (filter === "All") return true;
    return r.status === filter.toLowerCase();
  });

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Activity
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Activity history
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A log of recent actions, timestamps, and status updates on your account.
          </p>
        </header>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-white text-black"
                  : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
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
                Your runs will appear here after you launch one from the Panel.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {filtered.map((r) => {
                const S = STATUS_MAP[r.status] || STATUS_MAP.queued;
                const Icon = S.icon;
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="hidden w-36 shrink-0 font-mono text-xs text-muted-foreground sm:block">
                      {formatTime(r.created_at)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {r.layer !== "—" ? `Run started` : "Account action"}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {[r.layer, r.target, r.method]
                          .filter((x) => x && x !== "—")
                          .join(" · ")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ${S.cls}`}
                    >
                      <Icon className={`h-3 w-3 ${S.spin ? "animate-spin" : ""}`} />
                      {S.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>
    </div>
  );
}
