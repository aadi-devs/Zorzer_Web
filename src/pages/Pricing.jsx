// paste your Pricing.jsx content here
import { useState } from "react";
import { Check, Zap, Rocket, Crown, ArrowRight } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";

const PLANS = [
{
  name: "Basic",
  icon: Zap,
  price: "₹500",
  period: "/mo",
  tagline: "L4 Starter",
  highlight: false,
  features: [
  "Layer 4 access",
  "Method A only",
  "1 concurrent run",
  "600s max duration",
  "Community support"]

},
{
  name: "Elite",
  icon: Rocket,
  price: "₹800",
  period: "/mo",
  tagline: "L4 All methods",
  highlight: true,
  features: [
  "Layer 4 access",
  "Method A, B & C",
  "1 concurrent run",
  "600s max duration",
  "Priority routing",
  "Discord support"]

},
{
  name: "God",
  icon: Crown,
  price: "₹600",
  period: "/mo",
  tagline: "L7\xA0 + L4 access",
  highlight: false,
  features: [
  "Layer 7 access",
  "Method A, B, C & D",
  "1 concurrent run",
  "600s max duration",
  "Priority routing",
  "Discord support"]

}];


const COMPARISON = [
{ label: "Layer 4 access", values: [true, true, false] },
{ label: "Layer 7 access", values: [false, false, true] },
{ label: "Method A", values: [true, true, true] },
{ label: "Method B", values: [false, true, true] },
{ label: "Method C", values: [false, true, true] },
{ label: "Method D", values: [false, false, true] },
{ label: "Max duration", values: ["600s", "600s", "600s"] },
{ label: "Concurrent runs", values: ["1", "1", "1"] },
{ label: "Priority support", values: [false, true, true] }];


export default function Pricing() {
  const [billing, setBilling] = useState("monthly");

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
            Pick the plan that matches your load. Upgrade, downgrade, or cancel anytime.
          </p>

          <div className="mt-6 inline-flex items-center rounded-full border border-white/[0.08] bg-black/40 p-1">
            {["monthly", "lifetime"].map((b) =>
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              billing === b ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"}`
              }>

                {b}
              </button>
            )}
          </div>
        </header>

        {/* Plan cards */}
        <section className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((p) =>
          <div
            key={p.name}
            className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-sm transition-colors ${
            p.highlight ?
            "border-white/25 bg-zinc-900/80 ring-1 ring-white/10" :
            "border-white/[0.08] bg-zinc-900/60 hover:border-white/[0.16]"}`
            }>

              {p.highlight &&
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                  Popular
                </span>
            }
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                  <p.icon className="h-4 w-4 text-zinc-300" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.tagline}</p>
                </div>
              </div>

              <div className="mt-5 flex items-end gap-1">
                <span className="font-heading text-4xl font-semibold tracking-tight">{p.price}</span>
                {p.period && <span className="mb-1 text-sm text-muted-foreground">{p.period}</span>}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) =>
              <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    {f}
                  </li>
              )}
              </ul>

              <button
              className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium transition-colors ${
              p.highlight ?
              "bg-white text-black hover:bg-zinc-200" :
              "border border-white/[0.1] bg-white/[0.03] text-foreground hover:bg-white/[0.08]"}`
              }>

                Choose plan
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* Comparison table */}
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
                  {PLANS.map((p) =>
                  <th key={p.name} className="px-5 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {p.name}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {COMPARISON.map((row) =>
                <tr key={row.label} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 text-zinc-300">{row.label}</td>
                    {row.values.map((v, i) =>
                  <td key={i} className="px-5 py-3.5 text-center font-mono">
                        {v === true ?
                    <Check className="mx-auto h-4 w-4 text-zinc-300" /> :
                    v === false ?
                    <span className="text-muted-foreground/40">—</span> :

                    v
                    }
                      </td>
                  )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <div className="mt-16">
        <SiteFooter />
      </div>
    </div>);

}