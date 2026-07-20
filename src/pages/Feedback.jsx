import { useState } from "react";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const TOPICS = ["General", "Bug report", "Feature request", "Account", "Billing"];

const INIT = { name: "", email: "", topic: "General", message: "" };

export default function Feedback() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    ...INIT,
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedMsg = form.message.trim();
    if (trimmedMsg.length < 10) {
      setError("Message must be at least 10 characters.");
      return;
    }
    if (trimmedMsg.length > 2000) {
      setError("Message must be under 2000 characters.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.from("feedback").insert({
      user_id: user?.id || null,
      name:    form.name.trim(),
      email:   form.email.trim(),
      topic:   form.topic,
      message: trimmedMsg,
    });
    setLoading(false);
    if (err) {
      setError("Failed to send feedback. Please try again.");
    } else {
      setSent(true);
      // Don't auto-reset — user reads the confirmation and resubmits manually if needed
    }
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
            Report bugs, request features, or reach out directly. We read every message.
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
                    placeholder="Describe your issue or idea…"
                    className="input-base resize-none"
                  />
                </Field>

                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}

                {sent ? (
                  <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Message sent — we'll get back to you soon
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? "Sending…" : "Send feedback"}
                  </button>
                )}
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
                <Channel label="Discord" value="victusxnaruto" />
                <Channel label="Platform" value="Zorzer Stresser" />
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
