import { motion } from "framer-motion";
import { UserCircle, Crown, Zap, Rocket, Star } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { useAuth } from "@/lib/AuthContext";
import { fadeUp, staggerContainer, scaleIn, fadeIn } from "@/lib/motion";

const PLAN_ICONS = { Basic: Zap, Elite: Rocket, Adv: Star, God: Crown };

export default function Profile() {
  const { user, profile } = useAuth();
  const plan     = profile?.plan || null;
  const PlanIcon = plan ? (PLAN_ICONS[plan.name] || Crown) : Crown;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <motion.header
          className="mb-8"
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeIn} className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <UserCircle className="h-3.5 w-3.5" /> Profile
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Your profile
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your account details and active plan perks.
          </motion.p>
        </motion.header>

        <motion.div
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          variants={staggerContainer(0.1, 0.15)}
          initial="hidden"
          animate="visible"
        >
          {/* Account card */}
          <motion.aside variants={scaleIn} className="lg:col-span-1">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 pb-5 text-center">
                <motion.span
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-white/25 via-zinc-500/40 to-white/15 text-xl font-semibold ring-2 ring-white/10"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                >
                  {initials}
                </motion.span>
                <div>
                  <p className="font-heading text-lg font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-5">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Current plan</p>
                {plan ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                      <PlanIcon className="h-4 w-4 text-zinc-300" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="text-[11px] text-muted-foreground">{plan.access_layers?.join(" + ")}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No plan assigned.</p>
                )}
              </div>
            </div>
          </motion.aside>

          {/* Plan details */}
          <motion.section variants={fadeUp} className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              <p className="mb-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Plan perks</p>
              {plan ? (
                <motion.ul
                  className="space-y-3"
                  variants={staggerContainer(0.06)}
                  initial="hidden"
                  animate="visible"
                >
                  {[
                    { label: "Plan name",     value: plan.name },
                    { label: "Layers",        value: (plan.access_layers || []).join(" + ") || "—" },
                    { label: "Methods",       value: (plan.methods || []).join(", ") || "—" },
                    { label: "Max duration",  value: plan.max_duration ? `${plan.max_duration}s` : "Unlimited" },
                    { label: "Daily runs",    value: plan.max_daily_runs === 0 ? "Unlimited" : `${plan.max_daily_runs} / day` },
                  ].map(({ label, value }) => (
                    <motion.li
                      key={label}
                      variants={fadeUp}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="font-mono text-sm">{value}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <p className="text-sm text-muted-foreground">No plan features to display.</p>
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
