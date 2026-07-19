// paste your Dashboard.jsx content here
import { Link } from "react-router-dom";
import {
  Activity,
  Gauge,
  Layers,
  Server,
  ArrowUpRight,
  Crosshair,
  CreditCard,
  Bell } from
"lucide-react";
import SiteFooter from "@/components/return/SiteFooter";

const STATS = [
{ label: "Concurrent Usage", value: "1 / 1", sub: "Slot active", icon: Activity },
{ label: "Plan Duration", value: "600s", sub: "Per run", icon: Gauge },
{ label: "Plan Layer", value: "L4 / L7", sub: "Active layers", icon: Layers },
{ label: "Network Uptime", value: "99.98%", sub: "Last 30d", icon: Server }];


const NEWS = [
{ date: "Jul 18", tag: "Update", title: "Panel methods refreshed", body: "Method options across L4 and L7 have been updated." },
{ date: "Jul 15", tag: "Network", title: "Capacity expanded across EU nodes", body: "Additional capacity brought online in Frankfurt and Amsterdam." },
{ date: "Jul 12", tag: "Security", title: "Session security hardened", body: "Account sessions now rotate automatically for safer access." },
{ date: "Jul 09", tag: "Status", title: "Resolved: elevated latency on US-East", body: "All systems nominal after capacity rebalancing." }];


const QUICK = [
{ to: "/panel", label: "Open Panel", desc: "Launch & monitor runs", icon: Crosshair },
{ to: "/pricing", label: "Upgrade Plan", desc: "Unlock more methods", icon: CreditCard }];


const TAG_STYLES = {
  Update: "border-white/15 text-zinc-300",
  Network: "border-white/15 text-zinc-300",
  Security: "border-white/15 text-zinc-300",
  Status: "border-white/15 text-zinc-300"
};

export default function Dashboard() {
  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Bell className="h-3.5 w-3.5" /> Dashboard
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">The Best And Most Powerful Layer 4 And Layer 7 Stress Tester Available In The Market Till Date

          </p>
        </header>

        {/* Stat cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) =>
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 ring-1 ring-white/[0.03] backdrop-blur-sm transition-colors hover:border-white/[0.14]">

              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                  <s.icon className="h-4 w-4 text-zinc-400" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="mt-4 font-mono text-2xl font-medium tracking-tight">{s.value}</p>
              <p className="mt-1 text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          )}
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* News feed */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Platform news</h2>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Latest
                </span>
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {NEWS.map((n) =>
                <li key={n.title} className="flex gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]">
                    <div className="flex w-12 shrink-0 flex-col items-center">
                      <span className="font-mono text-xs text-muted-foreground">{n.date}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${TAG_STYLES[n.tag]}`}>

                          {n.tag}
                        </span>
                        <h3 className="truncate text-sm font-medium">{n.title}</h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </section>

          {/* Plan snapshot + quick paths */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Plan snapshot
              </span>
              <p className="mt-2 font-heading text-2xl font-semibold">Stresser</p>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Concurrent" value="1 slot" />
                <Row label="Max duration" value="600s" />
                <Row label="Methods" value="L4 + L7" />
                <Row label="Renews" value="Aug 18" />
              </div>
              <Link
                to="/pricing"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200">

                Upgrade plan
              </Link>
            </div>

            <div className="space-y-2">
              {QUICK.map((q) =>
              <Link
                key={q.label}
                to={q.to}
                className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-4 transition-colors hover:border-white/[0.14] hover:bg-zinc-900/80">

                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                    <q.icon className="h-4 w-4 text-zinc-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{q.label}</p>
                    <p className="text-xs text-muted-foreground">{q.desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>
    </div>);

}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>);

}