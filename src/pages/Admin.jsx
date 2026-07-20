import { useState, useEffect, useCallback } from "react";
import {
  Shield, Users, Newspaper, CreditCard,
  Plus, Trash2, Save, Loader2,
  Eye, EyeOff, UserPlus, RefreshCw, AlertTriangle, X,
} from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const TABS = [
  { id: "users",  label: "Users",  icon: Users },
  { id: "news",   label: "News",   icon: Newspaper },
  { id: "plans",  label: "Plans",  icon: CreditCard },
];

const TAG_OPTIONS = ["Update", "Network", "Security", "Status"];

// ─── helpers ────────────────────────────────────────────────────────────────
function Flash({ msg, type = "success" }) {
  if (!msg) return null;
  const cls = type === "error"
    ? "bg-red-500/10 border-red-500/20 text-red-300"
    : "bg-white/[0.06] border-white/10 text-zinc-200";
  return <div className={`mb-4 rounded-lg border px-4 py-2.5 text-xs ${cls}`}>{msg}</div>;
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

const inputCls = "w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm outline-none transition focus:border-white/20 focus:ring-1 focus:ring-white/10 placeholder:text-muted-foreground";

// ── Proxy helper ─────────────────────────────────────────────────────────────
async function adminFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return json;
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onCancel} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06]">
          <X className="h-4 w-4" />
        </button>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </span>
          <p className="text-sm font-medium">Are you sure?</p>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-600 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/[0.1] py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users tab ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [form, setForm]         = useState({ email: "", password: "", full_name: "", plan_id: "" });
  const [showPw, setShowPw]     = useState(false);
  const [plans, setPlans]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [saving, setSaving]     = useState(false);
  const [flash, setFlash]       = useState({ msg: "", type: "success" });
  const [confirm, setConfirm]   = useState(null); // { id, email }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadUsers = useCallback(async () => {
    try {
      const json = await adminFetch("/proxy/admin/users");
      setUsers(json.users || []);
    } catch (err) {
      console.error("loadUsers:", err.message);
    }
  }, []);

  useEffect(() => {
    supabase.from("plans").select("id,name,price").order("price").then(({ data }) => {
      if (data) { setPlans(data); set("plan_id", data[0]?.id || ""); }
    });
    loadUsers();
  }, [loadUsers]);

  async function createUser(e) {
    e.preventDefault();
    setSaving(true);
    setFlash({ msg: "", type: "success" });
    try {
      await adminFetch("/proxy/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email:     form.email,
          password:  form.password,
          full_name: form.full_name,
          plan_id:   form.plan_id || null,
        }),
      });
      setFlash({ msg: `Account created for ${form.email}`, type: "success" });
      setForm({ email: "", password: "", full_name: "", plan_id: plans[0]?.id || "" });
      loadUsers();
    } catch (err) {
      setFlash({ msg: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id) {
    try {
      await adminFetch(`/proxy/admin/users/${id}`, { method: "DELETE" });
      setUsers(u => u.filter(x => x.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      {confirm && (
        <ConfirmModal
          message={`Delete ${confirm.email} permanently? This cannot be undone.`}
          onConfirm={() => deleteUser(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Create form */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold">Create account</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Manually provision login credentials for a new user.</p>
        </div>
        <form onSubmit={createUser} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Flash msg={flash.msg} type={flash.type} />
          </div>
          <Field label="Full name">
            <input value={form.full_name} onChange={e => set("full_name", e.target.value)}
              placeholder="John Doe" className={inputCls} />
          </Field>
          <Field label="Email address">
            <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="user@example.com" className={inputCls} />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input required type={showPw ? "text" : "password"} value={form.password}
                onChange={e => set("password", e.target.value)} placeholder="min. 8 characters"
                minLength={8} className={inputCls + " pr-10"} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Assign plan">
            <select value={form.plan_id} onChange={e => set("plan_id", e.target.value)} className={inputCls}>
              <option value="">— No plan —</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} (₹{p.price}/mo)</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {saving ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>

      {/* Users list */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold">All accounts ({users.length})</h2>
          <button onClick={loadUsers} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {users.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-muted-foreground">No users yet.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {users.map(u => (
              <li key={u.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium ring-1 ring-white/10">
                  {(u.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {u.user_metadata?.full_name || "No name"} · joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] ${
                  u.email_confirmed_at ? "border-white/10 text-zinc-400" : "border-amber-500/20 text-amber-400"
                }`}>
                  {u.email_confirmed_at ? "active" : "unconfirmed"}
                </span>
                <button
                  onClick={() => setConfirm({ id: u.id, email: u.email })}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── News tab ───────────────────────────────────────────────────────────────
function NewsTab() {
  const [form, setForm]     = useState({ title: "", body: "", tag: "Update" });
  const [news, setNews]     = useState([]);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash]   = useState({ msg: "", type: "success" });
  const [confirm, setConfirm] = useState(null); // news id

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setNews(data);
  }

  async function postNews(e) {
    e.preventDefault();
    setSaving(true);
    setFlash({ msg: "", type: "success" });
    const { error } = await supabase.from("news").insert({ title: form.title, body: form.body, tag: form.tag });
    setSaving(false);
    if (error) {
      setFlash({ msg: error.message, type: "error" });
    } else {
      setFlash({ msg: "Announcement posted.", type: "success" });
      setForm({ title: "", body: "", tag: "Update" });
      loadNews();
    }
  }

  async function deleteNews(id) {
    await supabase.from("news").delete().eq("id", id);
    setNews(n => n.filter(x => x.id !== id));
    setConfirm(null);
  }

  const TAG_CLS = {
    Update:   "border-blue-500/20 text-blue-300",
    Network:  "border-purple-500/20 text-purple-300",
    Security: "border-amber-500/20 text-amber-300",
    Status:   "border-green-500/20 text-green-300",
  };

  return (
    <div className="space-y-6">
      {confirm && (
        <ConfirmModal
          message="Delete this announcement permanently?"
          onConfirm={() => deleteNews(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold">Post announcement</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Appears on the Dashboard news feed for all users.</p>
        </div>
        <form onSubmit={postNews} className="space-y-4 p-5">
          <Flash msg={flash.msg} type={flash.type} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Title">
                <input required value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="What's new?" className={inputCls} />
              </Field>
            </div>
            <Field label="Tag">
              <select value={form.tag} onChange={e => set("tag", e.target.value)} className={inputCls}>
                {TAG_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Body">
            <textarea required rows={4} value={form.body} onChange={e => set("body", e.target.value)}
              placeholder="Describe the update…" className={inputCls + " resize-none"} />
          </Field>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Posting…" : "Post announcement"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold">Posted announcements</h2>
        </div>
        {news.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-muted-foreground">No announcements yet.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {news.map(n => (
              <li key={n.id} className="flex items-start gap-4 px-5 py-4">
                <span className={`mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${TAG_CLS[n.tag] || "border-white/10 text-zinc-400"}`}>
                  {n.tag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setConfirm(n.id)}
                  className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Plans tab ──────────────────────────────────────────────────────────────
function PlansTab() {
  const [plans, setPlans]   = useState([]);
  const [saving, setSaving] = useState(null);
  const [flash, setFlash]   = useState({});

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    const { data } = await supabase.from("plans").select("*").order("price");
    if (data) setPlans(data);
  }

  const updatePlan = (id, key, val) =>
    setPlans(ps => ps.map(p => p.id === id ? { ...p, [key]: val } : p));

  // Keep raw string in a separate display state to avoid comma corruption while typing
  const updateArray = (id, key, raw) => {
    // Store the raw string for display; parse on save
    setPlans(ps => ps.map(p => p.id === id ? { ...p, [`${key}_raw`]: raw, [key]: raw.split(",").map(s => s.trim()).filter(Boolean) } : p));
  };

  async function savePlan(plan) {
    setSaving(plan.id);
    setFlash(f => ({ ...f, [plan.id]: { msg: "", type: "success" } }));
    const { error } = await supabase.from("plans").update({
      name:             plan.name,
      price:            Number(plan.price),
      billing_period:   plan.billing_period,
      concurrent_slots: Number(plan.concurrent_slots),
      max_duration:     Number(plan.max_duration),
      access_layers:    plan.access_layers,
      methods:          plan.methods,
      tagline:          plan.tagline,
      features:         plan.features,
      highlight:        plan.highlight,
    }).eq("id", plan.id);
    setSaving(null);
    setFlash(f => ({
      ...f,
      [plan.id]: error
        ? { msg: error.message, type: "error" }
        : { msg: "Saved.",      type: "success" },
    }));
  }

  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/[0.08] bg-zinc-900/70 py-16 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">No plans found. Run the schema SQL first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {plans.map(plan => (
        <div key={plan.id} className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-semibold">{plan.name}</h2>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <span>Featured</span>
              <button
                type="button"
                onClick={() => updatePlan(plan.id, "highlight", !plan.highlight)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${plan.highlight ? "bg-white" : "bg-white/[0.1]"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${plan.highlight ? "translate-x-4.5 bg-black" : "translate-x-0.5 bg-zinc-400"}`} />
              </button>
            </label>
          </div>
          <div className="space-y-3 p-5">
            {flash[plan.id]?.msg && <Flash msg={flash[plan.id].msg} type={flash[plan.id].type} />}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <input value={plan.name} onChange={e => updatePlan(plan.id, "name", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Price (₹/mo)">
                <input type="number" value={plan.price} onChange={e => updatePlan(plan.id, "price", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Concurrent slots">
                <input type="number" value={plan.concurrent_slots} onChange={e => updatePlan(plan.id, "concurrent_slots", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Max duration (s)">
                <input type="number" value={plan.max_duration} onChange={e => updatePlan(plan.id, "max_duration", e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="Tagline">
              <input value={plan.tagline || ""} onChange={e => updatePlan(plan.id, "tagline", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Access layers (comma-separated)">
              <input
                value={plan.access_layers_raw ?? (plan.access_layers || []).join(", ")}
                onChange={e => updateArray(plan.id, "access_layers", e.target.value)}
                placeholder="L4, L7"
                className={inputCls}
              />
            </Field>
            <Field label="Methods (comma-separated)">
              <input
                value={plan.methods_raw ?? (plan.methods || []).join(", ")}
                onChange={e => updateArray(plan.id, "methods", e.target.value)}
                placeholder="UDP-NORMAL, HTTP-GET"
                className={inputCls}
              />
            </Field>
            <Field label="Features (comma-separated)">
              <input
                value={plan.features_raw ?? (plan.features || []).join(", ")}
                onChange={e => updateArray(plan.id, "features", e.target.value)}
                className={inputCls}
              />
            </Field>
            <button
              onClick={() => savePlan(plan)}
              disabled={saving === plan.id}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-2 text-xs font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-60"
            >
              {saving === plan.id
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                : <><Save className="h-3.5 w-3.5" /> Save plan</>
              }
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Admin page ─────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState("users");

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> Admin
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Admin panel
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage users, post announcements, and configure plans.
          </p>
        </header>

        <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.08] bg-black/30 p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-white/[0.08] text-foreground ring-1 ring-white/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "users" && <UsersTab />}
        {tab === "news"  && <NewsTab />}
        {tab === "plans" && <PlansTab />}
      </div>
      <div className="mt-12">
        <SiteFooter />
      </div>
    </div>
  );
}
