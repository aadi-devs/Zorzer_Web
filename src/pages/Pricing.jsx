import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Rocket, Crown, Shield, ArrowRight, X, MessageCircle, Ticket } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { fadeUp, staggerContainer, scaleIn, fadeIn } from "@/lib/motion";

const PLANS = [
  {
    name: "Basic", icon: Zap, price: "₹600", period: "/mo", tagline: "L4 Starter", highlight: false,
    features: ["Layer 4 access", "UDP-NORMAL method", "120s max duration", "10 runs / day", "Community support"],
  },
  {
    name: "Elite", icon: Rocket, price: "₹800", period: "/mo", tagline: "L4 All Methods", highlight: true,
    features: ["Layer 4 access", "UDP-NORMAL, UDP-BYPASS, ICMP", "600s max duration", "20 runs / day", "Priority routing", "Discord support"],
  },
  {
    name: "Adv", icon: Shield, price: "₹800", period: "/mo", tagline: "L7 Specialist", highlight: false,
    features: ["Layer 7 access", "HTTP-GET, HTTP-POST, API-FLOOD, RAPID-RESET", "600s max duration", "15 runs / day", "Priority routing", "Discord support"],
  },
  {
    name: "God", icon: Crown, price: "₹1400", period: "/mo", tagline: "L4 + L7 Full Access", highlight: false,
    features: ["Layer 4 + Layer 7 access", "All 7 methods unlocked", "1200s max duration", "60 runs / day (30 L4 + 30 L7)", "Priority routing", "Discord support"],
  },
];

const COMPARISON = [
  { label: "Layer 4 access",  values: [true,  true,  false, true]   },
  { label: "Layer 7 access",  values: [false, false, true,  true]   },
  { label: "UDP-NORMAL",      values: [true,  true,  false, true]   },
  { label: "UDP-BYPASS",      values: [false, true,  false, true]   },
  { label: "ICMP",            values: [false, true,  false, true]   },
  { label: "HTTP-GET",        values: [false, false, true,  true]   },
  { label: "HTTP-POST",       values: [false, false, true,  true]   },
  { label: "API-FLOOD",       values: [false, false, true,  true]   },
  { label: "RAPID-RESET",     values: [false, false, true,  true]   },
  { label: "Max duration",    values: ["120s","600s","600s","1200s"] },
  { label: "Daily run limit", values: ["10",  "20",  "15",  "60"]   },
  { label: "Discord support", values: [false, true,  true,  true]   },
];

export default function Pricing() {
  const [billing,   setBilling]   = useState("monthly");
  const [modalPlan, setModalPlan] = useState(null);

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <motion.header
          className="mx-auto max-w-2xl text-center"
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeIn} className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3.5 w-3.5" /> Plans
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Compare plans for peak power
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 text-sm text-muted-foreground">
            Pick the plan that matches your load. Upgrade, downgrade, or cancel anytime.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 inline-flex items-center rounded-full border border-white/[0.08] bg-black/40 p-1">
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
          </motion.div>
        </motion.header>

        {/* Plan cards */}
        <motion.section
          className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          variants={staggerContainer(0.09, 0.15)}
          initial="hidden"
          animate="visible"
        >
          {PLANS.map((p) => (
            <motion.div
              key={p.name}
              variants={scaleIn}
              whileHover={{ y: -5, transition: { duration: 0.22 } }}
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
                <motion.span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <p.icon className="h-4 w-4 text-zinc-300" />
                </motion.span>
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
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setModalPlan(p)}
                className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium transition-colors ${
                  p.highlight
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "border border-white/[0.1] bg-white/[0.03] text-foreground hover:bg-white/[0.08]"
                }`}
              >
                Choose plan <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </motion.section>

        {/* Comparison table */}
        <motion.section
          className="mt-16"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-center font-heading text-2xl font-semibold tracking-tight">Full comparison</h2>
          <div className="mx-auto mt-6 max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.name} className="px-5 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {COMPARISON.map((row) => (
                  <tr key={row.label} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 text-zinc-300">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-5 py-3.5 text-center font-mono">
                        {v === true  ? <Check className="mx-auto h-4 w-4 text-zinc-300" /> :
                         v === false ? <span className="text-muted-foreground/40">—</span> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      <div className="mt-16">
        <SiteFooter />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalPlan && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalPlan(null)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-zinc-900 shadow-2xl"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalPlan(null)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="border-b border-white/[0.06] px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                    <Ticket className="h-5 w-5 text-indigo-400" />
                  </span>
                  <div>
                    <p className="font-semibold">Get the {modalPlan.name} plan</p>
                    <p className="text-xs text-muted-foreground">
                      {modalPlan.price}{modalPlan.period && `/${modalPlan.period.replace("/", "")}`} · {modalPlan.tagline}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 px-6 py-6">
                <p className="text-sm leading-relaxed text-zinc-300">
                  To purchase a plan, open a ticket in our Discord server. A staff member will assist you within minutes.
                </p>
                <ol className="space-y-3">
                  {[
                    "Join our Discord server using the button below",
                    "Head to the #open-ticket channel",
                    'Click "Open Ticket" and select Plan Purchase',
                    `Tell us you want the ${modalPlan.name} plan and complete payment`,
                    "Your account will be upgraded instantly after confirmation",
                  ].map((step, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.1 }}
                      className="flex items-start gap-3 text-sm text-zinc-400"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[10px] font-semibold text-zinc-300">
                        {i + 1}
                      </span>
                      {step}
                    </motion.li>
                  ))}
                </ol>
              </div>
              <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4">
                <a
                  href="/discord"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  <MessageCircle className="h-4 w-4" /> Open Discord
                </a>
                <button
                  onClick={() => setModalPlan(null)}
                  className="rounded-full border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
