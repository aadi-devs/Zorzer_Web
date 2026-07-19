// paste your Settings.jsx content here
import { useState } from "react";
import { Settings as SettingsIcon, User, Lock, Palette, Check } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";

const SECTIONS = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "preferences", label: "Display", icon: Palette },
];

export default function Settings() {
  const [section, setSection] = useState("account");
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({ compact: false, animations: true, mono: true });

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
            <SettingsIcon className="h-3.5 w-3.5" /> Settings
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Account settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Update your account information, change your password, and configure display preferences.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Section nav */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-2 backdrop-blur-sm">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    section === s.id
                      ? "bg-white/[0.06] text-foreground ring-1 ring-white/10"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Section content */}
          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              {section === "account" && (
                <FormCard title="Account information" desc="Update your display name and contact email.">
                  <form onSubmit={save} className="space-y-4">
                    <Field label="Full name">
                      <input
                        defaultValue="Operator"
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </Field>
                    <Field label="Email address">
                      <input
                        type="email"
                        defaultValue="operator@returnstress.io"
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </Field>
                    <SubmitButton saved={saved} label="Save changes" />
                  </form>
                </FormCard>
              )}

              {section === "security" && (
                <FormCard title="Change password" desc="Choose a strong, unique password for your account.">
                  <form onSubmit={save} className="space-y-4">
                    <Field label="Current password">
                      <input type="password" placeholder="••••••••" className="input-base" />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="New password">
                        <input type="password" placeholder="••••••••" className="input-base" />
                      </Field>
                      <Field label="Confirm password">
                        <input type="password" placeholder="••••••••" className="input-base" />
                      </Field>
                    </div>
                    <SubmitButton saved={saved} label="Update password" />
                  </form>
                </FormCard>
              )}

              {section === "preferences" && (
                <FormCard title="Display preferences" desc="Customize how the console looks and feels.">
                  <div className="space-y-3">
                    <Toggle
                      label="Compact layout"
                      desc="Reduce spacing between cards and rows."
                      on={prefs.compact}
                      onToggle={() => setPrefs((p) => ({ ...p, compact: !p.compact }))}
                    />
                    <Toggle
                      label="Animations"
                      desc="Enable background motion and transitions."
                      on={prefs.animations}
                      onToggle={() => setPrefs((p) => ({ ...p, animations: !p.animations }))}
                    />
                    <Toggle
                      label="Monospace numerics"
                      desc="Render figures in JetBrains Mono."
                      on={prefs.mono}
                      onToggle={() => setPrefs((p) => ({ ...p, mono: !p.mono }))}
                    />
                  </div>
                </FormCard>
              )}
            </div>
          </section>
        </div>
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>

      <style>{`.input-base{width:100%;border-radius:0.5rem;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.4);padding:0.625rem 0.75rem;font-size:0.875rem;outline:none}.input-base:focus{border-color:rgba(255,255,255,0.2);box-shadow:0 0 0 1px rgba(255,255,255,0.1)}`}</style>
    </div>
  );
}

function FormCard({ title, desc, children }) {
  return (
    <>
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="p-5">{children}</div>
    </>
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

function SubmitButton({ saved, label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200"
      >
        {saved ? <Check className="h-3.5 w-3.5" /> : null}
        {saved ? "Saved" : label}
      </button>
    </div>
  );
}

function Toggle({ label, desc, on, onToggle }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-white" : "bg-white/15"}`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-zinc-900 transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}