import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Gauge,
  Layers,
  Server,
  ArrowUpRight,
  Crosshair,
  CreditCard,
  Bell,
} from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { fadeUp, fadeIn, staggerContainer, scaleIn } from "@/lib/motion";

const TAG_STYLES = {
  Update:   "border-white/15 text-zinc-300",
  Network:  "border-white/15 text-zinc-300",
  Security: "border-white/15 text-zinc-300",
  Status:   "border-white/15 text-zinc-300",
};

const QUICK = [
  { to: "/panel",   label: "Open Panel",   desc: "Launch & monitor runs",  icon: Crosshair  },
  { to: "/pricing", label: "Upgrade Plan", desc: "Unlock more methods",    icon: CreditCard },
];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const plan = profile?.plan || null;

  const [news,        setNews]        = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [l4Busy,      setL4Busy]      = useState(false);
  const [l7Busy,      setL7Busy]      = useState(false);

  useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (!error && data) setNews(data);
      setLoadingNews(false);
    }
    fetchNews();
  }, []);

  useEffect(() => {
    async function checkConcurrent() {
      const [l4, l7] = await Promise.all([
        supabase.rpc("is_l4_busy"),
        supabase.rpc("is_l7_busy"),
      ]);
      if (!l4.error) setL4Busy(!!l4.data);
      if (!l7.error) setL7Busy(!!l7.data);
    }
    checkConcurrent();
    const timer = setInterval(checkConcurrent, 5000);
    return () => clearInterval(timer);
  }, []);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Operator";

  const STATS = [
    { label: "L4 Concurrent", value: l4Busy ? "1 / 1" : "0 / 1", sub: l4Busy ? "Attack running" : "Slot free", icon: Activity, live: l4Busy },
    { label: "L7 Concurrent", value: l7Busy ? "1 / 1" : "0 / 1", sub: l7Busy ? "Attack running" : "Slot free", icon: Layers,   live: l7Busy },
    { label: "Plan Duration",  value: plan ? (plan.max_duration ? `${plan.max_duration}s` : "∞") : "—", sub: "Max per run", icon: Gauge },
    { label: "Network Uptime", value: "99.98%", sub: "Last 30d", icon: Server },
  ];

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
            <Bell className="h-3.5 w-3.5" /> Dashboard
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The Best And Most Powerful Layer 4 And Layer 7 Stress Tester Available In The Market Till Date
          </motion.p>
        </motion.header>

        {/* Stat cards */}
        <motion.section
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer(0.08, 0.1)}
          initial="hidden"
          animate="visible"
        >
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={scaleIn}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`group relative overflow-hidden rounded-2xl border bg-zinc-900/70 p-5 ring-1 backdrop-blur-sm transition-colors ${
                s.live
                  ? "border-red-500/20 ring-red-500/5 hover:border-red-500/30"
                  : "border-white/[0.08] ring-white/[0.03] hover:border-white/[0.14]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                  <s.icon className={`h-4 w-4 ${s.live ? "text-red-400" : "text-zinc-400"}`} />
                </span>
                {s.live && <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />}
                {!s.live && <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
              </div>
              <p className={`mt-4 font-mono text-2xl font-medium tracking-tight ${s.live ? "text-red-300" : ""}`}>
                {s.value}
              </p>
              <p className="mt-1 text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </motion.div>
          ))}
        </motion.section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* News feed */}
          <motion.section
            className="lg:col-span-2"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Platform news</h2>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Latest</span>
              </div>
              {loadingNews ? (
                <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
                  Loading…
                </div>
              ) : news.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
                  No announcements yet.
                </div>
              ) : (
                <motion.ul
                  className="divide-y divide-white/[0.05]"
                  variants={staggerContainer(0.06)}
                  initial="hidden"
                  animate="visible"
                >
                  {news.map((n) => (
                    <motion.li
                      key={n.id}
                      variants={fadeUp}
                      className="flex gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex w-12 shrink-0 flex-col items-center">
                        <span className="font-mono text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${TAG_STYLES[n.tag] || TAG_STYLES.Update}`}>
                            {n.tag}
                          </span>
                          <h3 className="truncate text-sm font-medium">{n.title}</h3>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </motion.section>

          {/* Plan snapshot + quick paths */}
          <motion.aside
            className="space-y-6"
            variants={staggerContainer(0.08, 0.35)}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-5 backdrop-blur-sm">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Plan snapshot</span>
              {plan ? (
                <>
                  <p className="mt-2 font-heading text-2xl font-semibold">{plan.name}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <Row label="Concurrent" value="1 slot" />
                    <Row label="Max duration" value={plan.max_duration ? `${plan.max_duration}s` : "∞"} />
                    <Row label="Methods" value={(plan.access_layers || []).join(" + ") || "—"} />
                    <Row label="Daily limit" value={plan.max_daily_runs === 0 ? "Unlimited" : `${plan.max_daily_runs} runs`} />
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No plan assigned.</p>
              )}
              <Link
                to="/pricing"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200"
              >
                Upgrade plan
              </Link>
            </motion.div>

            <div className="space-y-2">
              {QUICK.map((q) => (
                <motion.div key={q.label} variants={fadeUp}>
                  <Link
                    to={q.to}
                    className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-4 transition-all hover:border-white/[0.14] hover:bg-zinc-900/80 hover:-translate-y-0.5"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                      <q.icon className="h-4 w-4 text-zinc-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{q.label}</p>
                      <p className="text-xs text-muted-foreground">{q.desc}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.aside>
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
