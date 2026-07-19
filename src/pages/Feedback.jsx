// paste your Feedback.jsx content here
import { useState } from "react";
import { MessageSquare, Send, Check } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";

const TOPICS = ["General", "Bug report", "Feature request", "Account", "Billing"];

export default function Feedback() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: "General", message: "" });

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", topic: "General", message: "" });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> Feedback
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Send feedback
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Have a thought, bug, or feature request? Drop us a line — we read every message.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Contact form</h2>
              </div>
              <form onSubmit={submit} className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="input-base"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="input-base"
                    />
                  </Field>
                </div>
                <Field label="Topic">
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, topic: t })}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          form.topic === t
                            ? "bg-white text-black"
                            : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Message">
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us what's on your mind…"
                    className="input-base resize-none"
                  />
                </Field>
                <button
                  type="submit"
                  className="group relative inline-flex p-px rounded-full bg-gradient-to-b from-white/25 via-zinc-500/40 to-white/15 transition-[box-shadow] duration-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_24px_rgba(255,255,255,0.08)]"
                >
                  <span className="relative z-10 flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-xs font-medium text-white ring-1 ring-white/10">
                    {sent ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                    {sent ? "Message sent" : "Send feedback"}
                  </span>
                </button>
              </form>
            </div>
          </section>

          <aside className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold">Other channels</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Prefer a real-time chat? Reach us on Discord or browse the docs.
              </p>
              <div className="mt-4 space-y-2">
                <Channel label="Discord" value="ReturnStress#0001" />
                <Channel label="Status" value="status.returnstress.io" />
                <Channel label="Response time" value="~24 hours" />
              </div>
            </div>
          </aside>
        </div>
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>

      <style>{`.input-base{width:100%;border-radius:0.5rem;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.4);padding:0.625rem 0.75rem;font-size:0.875rem;outline:none;color:inherit}.input-base:focus{border-color:rgba(255,255,255,0.2);box-shadow:0 0 0 1px rgba(255,255,255,0.1)}.input-base::placeholder{color:hsl(var(--muted-foreground))}`}</style>
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

function Channel({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}