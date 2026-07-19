import { MessageCircle, Users, Shield, Zap, ExternalLink, Copy, Check } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { useState } from "react";

const OWNER_USERNAME = "victusxnaruto";
const DISCORD_INVITE = "https://discord.gg/returnstress"; // update with real invite link when ready

const PERKS = [
  {
    icon: Shield,
    title: "Support & Help",
    desc: "Get help from staff and the community for any issues with your account or attacks.",
  },
  {
    icon: Zap,
    title: "Status Updates",
    desc: "Be the first to know about new methods, downtime notices, and platform updates.",
  },
  {
    icon: Users,
    title: "Community",
    desc: "Connect with other users, share strategies, and stay up to date with the network.",
  },
];

export default function Discord() {
  const [copied, setCopied] = useState(false);

  const copyUsername = () => {
    navigator.clipboard.writeText(OWNER_USERNAME);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" /> Community
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Join our Discord
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Get support, stay updated, and connect with the ReturnStress community.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Join card */}
          <section className="lg:col-span-2">
            {/* Hero */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="relative flex flex-col items-center justify-center gap-4 overflow-hidden px-8 py-14 text-center">
                {/* Glow */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-56 w-56 rounded-full bg-indigo-600/10 blur-3xl" />
                </div>

                {/* Discord logo-ish icon */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10 ring-1 ring-indigo-500/20">
                  <MessageCircle className="h-8 w-8 text-indigo-400" />
                </div>

                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight">
                    ReturnStress Discord
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Our official server for support, announcements, and community chat.
                    Click below to join — it's free.
                  </p>
                </div>

                <a
                  href={DISCORD_INVITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white ring-1 ring-indigo-500/50 transition-colors hover:bg-indigo-500"
                >
                  <ExternalLink className="h-4 w-4" />
                  Join Server
                </a>
              </div>

              {/* Perks */}
              <div className="grid divide-y divide-white/[0.05] border-t border-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {PERKS.map((p) => (
                  <div key={p.title} className="flex flex-col gap-2 px-5 py-5">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                      <p.icon className="h-4 w-4 text-zinc-300" />
                    </span>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Owner card */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              <p className="mb-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Server Owner
              </p>

              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-indigo-400/30 via-indigo-600/20 to-indigo-400/10 text-sm font-semibold ring-2 ring-indigo-500/20">
                  {OWNER_USERNAME.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold">{OWNER_USERNAME}</p>
                  <p className="text-[11px] text-muted-foreground">Owner · ReturnStress</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2.5">
                <span className="font-mono text-xs text-zinc-300">{OWNER_USERNAME}</span>
                <button
                  onClick={copyUsername}
                  className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  title="Copy username"
                >
                  {copied
                    ? <Check className="h-3.5 w-3.5 text-zinc-300" />
                    : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                DM the owner on Discord for VIP plans, partnerships, or urgent support.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              <p className="mb-1 text-sm font-medium">Need help?</p>
              <p className="text-xs text-muted-foreground">
                Join the server and open a support ticket, or DM{" "}
                <span className="font-mono text-zinc-300">{OWNER_USERNAME}</span> directly on Discord.
              </p>
            </div>
          </aside>
        </div>
      </div>
      <div className="mt-16">
        <SiteFooter />
      </div>
    </div>
  );
}
