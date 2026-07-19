import { Check, UserCircle, Crown, Zap, Rocket, Star } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { useAuth } from "@/lib/AuthContext";

const PLAN_ICONS = {
  Basic: Zap,
  Elite: Rocket,
  Adv:   Star,
  God:   Crown,
};

export default function Profile() {
  const { user, profile } = useAuth();
  const plan = profile?.plan || null;
  const PlanIcon = plan ? (PLAN_ICONS[plan.name] || Crown) : Crown;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <UserCircle className="h-3.5 w-3.5" /> Profile
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Your profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your account details and active plan perks.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Account card */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 pb-5 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-white/25 via-zinc-500/40 to-white/15 text-xl font-semibold ring-2 ring-white/10">
                  {initials}
                </span>
                <div>
                  <p className="font-heading text-lg font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              {/* Plan badge */}
              <div className="border-t border-white/[0.06] pt-5">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Current plan
                </p>
                {plan ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                      <PlanIcon className="h-4 w-4 text-zinc-300" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="text-[11px] text-muted-foreground">{plan.tagline}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                    <p className="text-xs text-amber-300">No plan assigned. Contact your admin.</p>
                  </div>
                )}
              </div>

              {/* Quick stats */}
              {plan && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Stat label="Max duration" value={`${plan.max_duration}s`} />
                  <Stat label="Daily attacks" value={plan.max_daily_runs === 0 ? "∞" : String(plan.max_daily_runs)} />
                  <Stat label="Slots" value={String(plan.concurrent_slots)} />
                  <Stat
                    label="Layers"
                    value={(plan.access_layers || []).join(" + ") || "—"}
                  />
                </div>
              )}
            </div>
          </aside>

          {/* Plan perks */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Plan perks</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Everything included in your {plan ? plan.name : "current"} plan.
                </p>
              </div>

              {plan ? (
                <div className="p-5 space-y-6">
                  {/* Feature list */}
                  <ul className="space-y-3">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-center gap-3">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
                          <Check className="h-3 w-3 text-zinc-300" />
                        </span>
                        <span className="text-sm text-zinc-200">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Methods */}
                  {plan.methods?.length > 0 && (
                    <div>
                      <p className="mb-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Available methods
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {plan.methods.map((m) => (
                          <span
                            key={m}
                            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-zinc-300"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Crown className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No plan assigned yet.</p>
                  <p className="text-xs text-muted-foreground/60">
                    Ask your admin to assign a plan to unlock the panel.
                  </p>
                </div>
              )}
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

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-medium">{value}</p>
    </div>
  );
}
