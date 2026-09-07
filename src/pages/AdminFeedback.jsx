import { useState, useEffect } from "react";
import { Inbox, Send, CheckCircle2, Circle, ChevronDown, ChevronUp, User } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";

const TOPIC_COLORS = {
  "General":         "border-zinc-500/30 text-zinc-400",
  "Bug report":      "border-red-500/30 text-red-400",
  "Feature request": "border-blue-500/30 text-blue-400",
  "Account":         "border-amber-500/30 text-amber-400",
  "Billing":         "border-emerald-500/30 text-emerald-400",
};

const STATUS_OPTIONS = ["open", "replied", "closed"];

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminFeedback() {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTopic,  setFilterTopic]  = useState("all");
  const [expanded,     setExpanded]     = useState(null); // id of open card
  const [replyText,    setReplyText]    = useState({});   // { [id]: string }
  const [saving,       setSaving]       = useState({});   // { [id]: bool }
  const [saveMsg,      setSaveMsg]      = useState({});   // { [id]: string }

  async function fetchFeedback() {
    setLoading(true);
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  }

  useEffect(() => { fetchFeedback(); }, []);

  async function saveReply(item) {
    const reply = (replyText[item.id] ?? item.admin_reply ?? "").trim();
    if (!reply) return;
    setSaving(s => ({ ...s, [item.id]: true }));
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("feedback")
      .update({
        admin_reply: reply,
        replied_at:  now,
        status:      "replied",
      })
      .eq("id", item.id);
    setSaving(s => ({ ...s, [item.id]: false }));
    if (error) {
      setSaveMsg(m => ({ ...m, [item.id]: "Failed to save." }));
    } else {
      setSaveMsg(m => ({ ...m, [item.id]: "Reply saved ✓" }));
      setTimeout(() => setSaveMsg(m => ({ ...m, [item.id]: "" })), 3000);
      // Update local state instead of refetching the whole list
      setItems(prev => prev.map(i =>
        i.id === item.id
          ? { ...i, admin_reply: reply, replied_at: now, status: "replied" }
          : i
      ));
    }
  }

  async function setStatus(id, status) {
    const { error } = await supabase.from("feedback").update({ status }).eq("id", id);
    if (!error) {
      // Update local state instead of refetching the whole list
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    }
  }

  const topics  = ["all", ...new Set(items.map(i => i.topic))];
  const visible = items.filter(i => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterTopic  !== "all" && i.topic  !== filterTopic)  return false;
    return true;
  });

  const counts = {
    open:    items.filter(i => i.status === "open").length,
    replied: items.filter(i => i.status === "replied").length,
    closed:  items.filter(i => i.status === "closed").length,
  };

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Inbox className="h-3.5 w-3.5" /> Admin
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Feedback inbox
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Read and reply to every message users have sent.
          </p>
        </header>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Open",    count: counts.open,    color: "text-amber-400",   dot: "bg-amber-400"   },
            { label: "Replied", count: counts.replied, color: "text-blue-400",    dot: "bg-blue-400"    },
            { label: "Closed",  count: counts.closed,  color: "text-emerald-400", dot: "bg-emerald-400" },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => setFilterStatus(filterStatus === s.label.toLowerCase() ? "all" : s.label.toLowerCase())}
              className={`rounded-2xl border bg-zinc-900/70 p-4 text-left transition-colors backdrop-blur-sm ${
                filterStatus === s.label.toLowerCase()
                  ? "border-white/20"
                  : "border-white/[0.08] hover:border-white/[0.14]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className={`mt-1 font-mono text-2xl font-semibold ${s.color}`}>{s.count}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter by topic:</span>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setFilterTopic(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterTopic === t
                  ? "bg-white text-black"
                  : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "All topics" : t}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Inbox className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No messages match the current filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(item => {
              const isOpen = expanded === item.id;
              const draft  = replyText[item.id] ?? item.admin_reply ?? "";
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-zinc-900/70 backdrop-blur-sm transition-colors ${
                    item.status === "open"
                      ? "border-amber-500/20"
                      : item.status === "replied"
                      ? "border-blue-500/15"
                      : "border-white/[0.06]"
                  }`}
                >
                  {/* Row summary */}
                  <button
                    className="flex w-full items-start gap-4 p-5 text-left"
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                  >
                    {/* Avatar */}
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10 text-xs font-semibold uppercase">
                      {item.name?.slice(0, 2) || <User className="h-3.5 w-3.5 text-muted-foreground" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.email}</span>
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${TOPIC_COLORS[item.topic] || TOPIC_COLORS["General"]}`}>
                          {item.topic}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">{formatDate(item.created_at)}</p>
                    </div>

                    <span className="mt-1 shrink-0 text-muted-foreground">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>

                  {/* Expanded detail + reply */}
                  {isOpen && (
                    <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">

                      {/* Full message */}
                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Message</p>
                        <p className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                          {item.message}
                        </p>
                      </div>

                      {/* Existing reply preview */}
                      {item.admin_reply && (
                        <div>
                          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-blue-400">
                            Previous reply · {item.replied_at ? formatDate(item.replied_at) : ""}
                          </p>
                          <p className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-blue-200">
                            {item.admin_reply}
                          </p>
                        </div>
                      )}

                      {/* Reply box */}
                      <div>
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {item.admin_reply ? "Edit reply" : "Write a reply"}
                        </p>
                        <textarea
                          rows={4}
                          value={draft}
                          onChange={e => setReplyText(r => ({ ...r, [item.id]: e.target.value }))}
                          placeholder="Type your reply to this user…"
                          className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10 placeholder:text-muted-foreground"
                        />
                      </div>

                      {/* Actions row */}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => saveReply(item)}
                          disabled={saving[item.id] || !draft.trim()}
                          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {saving[item.id] ? "Saving…" : "Save reply"}
                        </button>

                        {/* Status buttons */}
                        {STATUS_OPTIONS.filter(s => s !== item.status).map(s => (
                          <button
                            key={s}
                            onClick={() => setStatus(item.id, s)}
                            className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground capitalize"
                          >
                            Mark as {s}
                          </button>
                        ))}

                        {saveMsg[item.id] && (
                          <span className="ml-auto text-xs text-emerald-400">{saveMsg[item.id]}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-12">
        <SiteFooter />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    open:    { icon: Circle,       color: "text-amber-400",   label: "Open"    },
    replied: { icon: Send,         color: "text-blue-400",    label: "Replied" },
    closed:  { icon: CheckCircle2, color: "text-emerald-400", label: "Closed"  },
  };
  const { icon: Icon, color, label } = map[status] || map.open;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
