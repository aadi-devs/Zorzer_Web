import { useState, useEffect } from "react";
import { Check, Zap, Rocket, Star, Crown, ArrowRight, Loader2 } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";

const PLAN_ICONS = {
  Basic: Zap,
  Elite: Rocket,
  Adv:   Star,
  God:   Crown,
};

// Comparison rows derived from all plans' feature sets
const COMPARE_ROWS = [
  { label: "Layer 4 access",    key: (p) => p.access_layers?.includes("L4") },
  { label: "Layer 7 access",    key: (p) => p.access_layers?.includes("L7") },
  { label: "UDP-NORMAL",        key: (p) => p.methods?.includes("UDP-NORMAL") },
  { label: "UDP-BYPASS",        key: (p) => p.methods?.includes("UDP-BYPASS") },
  { label: "ICMP",              key: (p) => p.methods?.includes("ICMP") },
  { label: "HTTP GET flood",    key: (p) => p.methods?.includes("httpget") },
  { label: "HTTP flood",        key: (p) => p.methods?.includes("httpflood") },
  { label: "API flood",         key: (p) => p.methods?.includes("apiflood") },
  { label: "Rapid Reset",       key: (p) => p.methods?.includes("rapidreset") },
  { label: "Max duration",      key: (p) => `${p.max_duration}s` },
  { label: "Daily attacks",     key: (p) => p.max_daily_runs === 0 ? "Unlimited" : String(p.max_daily_runs) },
  { label: "Concurrent slots",  key: (p) => String(p.concurrent_slots) },
];

export default function Pricing() {
  const [billing, setBilling] = useState("monthly");
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .order("price")
      .then(({ data }) => {
        if (data) setPlans(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3.5 w-3.5" /> Plans
          </div>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Compare plans for peak power
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Pick the plan that matches your load. Upgrade or downgrade anytime.
          </p>

          <div className="mt-6 inline-flex items-center rounded-full border border-white/[0.08] bg-black/40 p-1">
            {["monthly", "lifetime"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                  billing === b ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </header>

        {/* Plan cards */}
        <section className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const Icon = PLAN_ICONS[p.name] || Zap;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-sm transition-colors ${
                  p.highlight
                    ? "border-white/25 bg-zinc-900/80 ring-1 ring-white/10"
                    : "border-white/[0.08] bg-zinc-900/60 hover:border-white/[0.16]"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                    Popular
                  </span>
                )}
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                    <Icon className="h-4 w-4 text-zinc-300" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.tagline}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-end gap-1">
                  <span className="font-heading text-4xl font-semibold tracking-tight">
                    {p.price === 0 ? "Free" : `$${p.price}`}
                  </span>
                  {p.price > 0 && (
                    <span className="mb-1 text-sm text-muted-foreground">/mo</span>
                  )}
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {(p.features || []).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium transition-colors ${
                    p.highlight
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "border border-white/[0.1] bg-white/[0.03] text-foreground hover:bg-white/[0.08]"
                  }`}
                >
                  Choose plan
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </section>

        {/* Comparison table */}
        {plans.length > 0 && (
          <section className="mt-16">
            <h2 className="text-center font-heading text-2xl font-semibold tracking-tight">
              Full comparison
            </h2>
            <div className="mx-auto mt-6 max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Feature
                    </th>
                    {plans.map((p) => (
                      <th key={p.id} className="px-5 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 text-zinc-300">{row.label}</td>
                      {plans.map((p) => {
                        const v = row.key(p);
                        return (
                          <td key={p.id} className="px-5 py-3.5 text-center font-mono">
                            {v === true  ? <Check className="mx-auto h-4 w-4 text-zinc-300" /> :
                             v === false ? <span className="text-muted-foreground/40">—</span> :
                             v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
      <div className="mt-16">
        <SiteFooter />
      </div>
    </div>
  );
}
