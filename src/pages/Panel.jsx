// paste your Panel.jsx content here
import { useState } from "react";
import { Crosshair, Clock, Layers, Play, ChevronDown } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";

const L4_METHODS = ["Method A", "Method B", "Method C"];
const L7_METHODS = ["Method A", "Method B", "Method C", "Method D"];

const RUNNING = [
  { id: "#A4F2", target: "203.0.113.10", layer: "L4", method: "Method A", time: "312s", status: "running" },
  { id: "#B91C", target: "app.example.dev", layer: "L7", method: "Method B", time: "118s", status: "running" },
  { id: "#C7E0", target: "198.51.100.7", layer: "L4", method: "Method C", time: "00s", status: "queued" },
];

export default function Panel() {
  const [layer, setLayer] = useState("L4");
  const [method, setMethod] = useState("Method A");
  const methods = layer === "L4" ? L4_METHODS : L7_METHODS;

  const selectLayer = (l) => {
    setLayer(l);
    setMethod(l === "L4" ? L4_METHODS[0] : L7_METHODS[0]);
  };

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
            Configure a run across Layer 4 &amp; Layer 7. Design template — controls are
            non-functional.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Config card */}
          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">New run</h2>
              </div>
              <div className="space-y-5 p-5">
                {/* Layer toggle */}
                <Field label="Layer">
                  <div className="inline-flex rounded-lg border border-white/[0.08] bg-black/40 p-1">
                    {["L4", "L7"].map((l) => (
                      <button
                        key={l}
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

                {/* Inputs differ by layer */}
                {layer === "L4" ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Server IP">
                      <input
                        type="text"
                        placeholder="203.0.113.10"
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10"
                      />
                    </Field>
                    <Field label="Domain">
                      <input
                        type="text"
                        placeholder="example.com"
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10"
                      />
                    </Field>
                  </div>
                ) : (
                  <Field label="IP address">
                    <input
                      type="text"
                      placeholder="203.0.113.10"
                      className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10"
                    />
                  </Field>
                )}

                {/* Duration + Method */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Duration (s)">
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        defaultValue="600"
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 py-2.5 pl-9 pr-3 font-mono text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </div>
                  </Field>
                  <Field label="Method">
                    <div className="relative">
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 pr-9 font-mono text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      >
                        {methods.map((m) => (
                          <option key={m} value={m} className="bg-zinc-900">
                            {m}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </Field>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button className="group relative inline-flex p-px rounded-full bg-gradient-to-b from-white/25 via-zinc-500/40 to-white/15 transition-[box-shadow] duration-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_24px_rgba(255,255,255,0.08)]">
                    <span className="relative z-10 flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-xs font-medium text-white ring-1 ring-white/10">
                      <Play className="h-3.5 w-3.5" /> Start
                    </span>
                  </button>

                </div>
              </div>
            </div>
          </section>

          {/* Live snapshot */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Live status</h2>
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" /> 2 active
                </span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
                <Snap label="Active" value="2" />
                <Snap label="Queued" value="1" />
                <Snap label="Today" value="14" />
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {RUNNING.map((r) => (
                  <li key={r.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="mt-1 truncate font-mono text-sm">{r.target}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded border border-white/10 px-1.5 py-0.5">{r.layer}</span>
                      <span>{r.method}</span>
                      <span>·</span>
                      <span>{r.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
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

function Snap({ label, value }) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="font-mono text-xl font-medium">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map[status]}`}
    >
      {status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300" />}
      {status}
    </span>
  );
}