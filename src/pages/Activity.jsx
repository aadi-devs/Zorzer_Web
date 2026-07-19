// paste your Activity.jsx content here
import { useState } from "react";
import { History, Filter, CheckCircle2, Clock3, XCircle, Loader2 } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";

const EVENTS = [
  { id: "#E91A4", action: "Run started", layer: "L4", target: "203.0.113.10", method: "Method A", time: "2026-07-18 14:02", status: "success" },
  { id: "#E91A3", action: "Plan upgraded", layer: "—", target: "Pro", method: "—", time: "2026-07-18 11:38", status: "success" },
  { id: "#E91A2", action: "Run started", layer: "L7", target: "app.example.dev", method: "Method B", time: "2026-07-18 09:14", status: "running" },
  { id: "#E91A1", action: "Password changed", layer: "—", target: "—", method: "—", time: "2026-07-17 22:50", status: "success" },
  { id: "#E91A0", action: "Run started", layer: "L4", target: "198.51.100.7", method: "Method C", time: "2026-07-17 18:21", status: "failed" },
  { id: "#E919Z", action: "Login", layer: "—", target: "—", method: "—", time: "2026-07-17 08:03", status: "success" },
  { id: "#E919Y", action: "Run queued", layer: "L4", target: "203.0.113.44", method: "Method A", time: "2026-07-16 23:47", status: "queued" },
  { id: "#E919X", action: "Profile updated", layer: "—", target: "—", method: "—", time: "2026-07-16 15:12", status: "success" },
];

const FILTERS = ["All", "Success", "Running", "Failed"];

const STATUS_MAP = {
  success: { icon: CheckCircle2, label: "success", cls: "bg-zinc-100/10 text-zinc-200 ring-white/10" },
  running: { icon: Loader2, label: "running", cls: "bg-white/[0.04] text-zinc-300 ring-white/[0.08]", spin: true },
  failed: { icon: XCircle, label: "failed", cls: "bg-red-500/10 text-red-300 ring-red-500/20" },
  queued: { icon: Clock3, label: "queued", cls: "bg-white/[0.04] text-muted-foreground ring-white/[0.06]" },
};

export default function Activity() {
  const [filter, setFilter] = useState("All");

  const filtered = EVENTS.filter((e) => {
    if (filter === "All") return true;
    return e.status === filter.toLowerCase();
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
        <div className="mb-5 flex items-center gap-2">
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
          <ul className="divide-y divide-white/[0.05]">
            {filtered.map((e) => {
              const S = STATUS_MAP[e.status];
              return (
                <li key={e.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]">
                  <span className="hidden w-24 shrink-0 font-mono text-xs text-muted-foreground sm:block">
                    {e.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{e.id}</span>
                      <h3 className="truncate text-sm font-medium">{e.action}</h3>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {e.layer !== "—" && (
                        <span className="rounded border border-white/10 px-1.5 py-0.5">{e.layer}</span>
                      )}
                      {e.method !== "—" && <span>{e.method}</span>}
                      {e.target !== "—" && <span className="font-mono">{e.target}</span>}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground sm:hidden">{e.time.split(" ")[1]}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 ${S.cls}`}>
                    <S.icon className={`h-3 w-3 ${S.spin ? "animate-spin" : ""}`} />
                    {S.label}
                  </span>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">No events match this filter.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>
    </div>
  );
}