import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Lock, Palette, Check } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const SECTIONS = [
  { id: "account",     label: "Account",     icon: User },
  { id: "security",    label: "Security",    icon: Lock },
  { id: "preferences", label: "Display",     icon: Palette },
];

export default function Settings() {
  const { user } = useAuth();
  const [section, setSection]   = useState("account");
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // Account fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");

  // Display prefs
  const [prefs, setPrefs] = useState({ compact: false, animations: true, mono: true });

  // Load profile on mount
  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, compact_layout, animations_enabled, monospace_numerics")
        .eq("id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name || "");
        setPrefs({
          compact:    data.compact_layout,
          animations: data.animations_enabled,
          mono:       data.monospace_numerics,
        });
      }
    }
    loadProfile();
  }, [user]);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (err) setError(err.message);
    else flash();
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setError("");
    const newPw = e.target.newPassword.value;
    const confirm = e.target.confirmPassword.value;
    if (newPw !== confirm) { setError("Passwords do not match."); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (err) setError(err.message);
    else { flash(); e.target.reset(); }
  };

  const savePrefs = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        compact_layout:      prefs.compact,
        animations_enabled:  prefs.animations,
        monospace_numerics:  prefs.mono,
        updated_at:          new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (err) setError(err.message);
    else flash();
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
                  onClick={() => { setSection(s.id); setError(""); }}
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
              {/* Account */}
              {section === "account" && (
                <FormCard title="Account information" desc="Update your display name.">
                  <form onSubmit={saveAccount} className="space-y-4">
                    <Field label="Full name">
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </Field>
                    <Field label="Email address">
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm text-muted-foreground outline-none"
                      />
                    </Field>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <SubmitButton saved={saved} saving={saving} label="Save changes" />
                  </form>
                </FormCard>
              )}

              {/* Security */}
              {section === "security" && (
                <FormCard title="Change password" desc="Choose a strong, unique password for your account.">
                  <form onSubmit={savePassword} className="space-y-4">
                    <Field label="New password">
                      <input
                        name="newPassword"
                        type="password"
                        required
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </Field>
                    <Field label="Confirm new password">
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </Field>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <SubmitButton saved={saved} saving={saving} label="Update password" />
                  </form>
                </FormCard>
              )}

              {/* Preferences */}
              {section === "preferences" && (
                <FormCard title="Display preferences" desc="Adjust how the interface looks and behaves.">
                  <form onSubmit={savePrefs} className="space-y-5">
                    <Toggle
                      label="Compact layout"
                      desc="Reduce spacing to fit more content on screen."
                      checked={prefs.compact}
                      onChange={(v) => setPrefs({ ...prefs, compact: v })}
                    />
                    <Toggle
                      label="Animations"
                      desc="Enable motion effects and transitions."
                      checked={prefs.animations}
                      onChange={(v) => setPrefs({ ...prefs, animations: v })}
                    />
                    <Toggle
                      label="Monospace numerics"
                      desc="Use monospace font for numbers and IDs."
                      checked={prefs.mono}
                      onChange={(v) => setPrefs({ ...prefs, mono: v })}
                    />
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <SubmitButton saved={saved} saving={saving} label="Save preferences" />
                  </form>
                </FormCard>
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

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-white" : "bg-white/[0.1]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
            checked ? "translate-x-6 bg-black" : "translate-x-1 bg-zinc-400"
          }`}
        />
      </button>
    </div>
  );
}

function SubmitButton({ saved, saving, label }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-60"
    >
      {saved ? <Check className="h-3.5 w-3.5" /> : null}
      {saved ? "Saved" : saving ? "Saving…" : label}
    </button>
  );
}
