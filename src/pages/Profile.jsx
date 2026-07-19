// paste your Profile.jsx content here
import { useState } from "react";
import { UserCircle, Mail, Crown, Check, Shield } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";

const PLAN_FEATURES = [
  "Layer 4 access",
  "Method A, B & C",
  "1 concurrent run",
  "600s max duration",
  "Priority routing",
];

export default function Profile() {
  const [email, setEmail] = useState("operator@returnstress.io");
  const [saved, setSaved] = useState(false);

  const save = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
            View your plan status, update your email, and manage account preferences.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Plan status */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                  <Crown className="h-4 w-4 text-zinc-300" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current plan</p>
                  <p className="font-heading text-xl font-semibold">Pro · L4</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Concurrent" value="1 slot" />
                <Row label="Max duration" value="600s" />
                <Row label="Layers" value="L4 / L7" />
                <Row label="Renews" value="Aug 18" />
              </div>
              <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-5">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-zinc-300" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Email + preferences */}
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Contact email</h2>
                <p className="mt-1 text-xs text-muted-foreground">Used for sign-in and account notices.</p>
              </div>
              <form onSubmit={save} className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.08] bg-black/40 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200"
                >
                  {saved ? <Check className="h-3.5 w-3.5" /> : null}
                  {saved ? "Saved" : "Update email"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Account preferences</h2>
                <p className="mt-1 text-xs text-muted-foreground">Manage how your account behaves.</p>
              </div>
              <div className="divide-y divide-white/[0.05]">
                <PrefRow icon={Shield} title="Two-factor authentication" desc="Add an extra layer of security at sign-in." action="Enable" />
                <PrefRow icon={Mail} title="Email notifications" desc="Receive product and status updates by email." action="Manage" />
                <PrefRow icon={Crown} title="Plan auto-renew" desc="Keep your plan active when it expires." action="On" />
              </div>
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

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function PrefRow({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
        <Icon className="h-4 w-4 text-zinc-400" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button className="rounded-full border border-white/[0.08] px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground">
        {action}
      </button>
    </div>
  );
}