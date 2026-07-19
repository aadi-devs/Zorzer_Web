import { useState, useEffect } from "react";
import { Crosshair, Layers, Play, Square } from "lucide-react";
import SiteFooter from "@/components/return/SiteFooter";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const L4_METHODS = ["Method A", "Method B", "Method C"];
const L7_METHODS = ["Method A", "Method B", "Method C", "Method D"];
const DURATIONS = [60, 120, 300, 600, 1200];

export default function Panel() {
  const { user } = useAuth();
  const [layer, setLayer] = useState("L4");
  const [method, setMethod] = useState("Method A");
  const [target, setTarget] = useState("");
  const [duration, setDuration] = useState(300);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState("");
  const [runs, setRuns] = useState([]);
  const methods = layer === "L4" ? L4_METHODS : L7_METHODS;

  const selectLayer = (l) => {
    setLayer(l);
    setMethod(l === "L4" ? L4_METHODS[0] : L7_METHODS[0]);
    setTarget("");
  };

  // Fetch active/recent runs
  useEffect(() => {
    if (!user) return;
    fetchRuns();
  }, [user]);

  async function fetchRuns() {
    const { data } = await supabase
      .from("runs")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["running", "queued"])
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setRuns(data);
  }

  async function launch(e) {
    e.preventDefault();
    if (!target.trim()) return;
    setLaunchError("");
    setLaunching(true);
    const { error } = await supabase.from("runs").insert({
      user_id: user.id,
      target: target.trim(),
      layer,
      method,
      duration,
      status: "queued",
    });
    setLaunching(false);
    if (error) {
      setLaunchError("Failed to launch run: " + error.message);
    } else {
      setTarget("");
      fetchRuns();
    }
  }

  async function stopRun(id) {
    await supabase.from("runs").update({ status: "success", stopped_at: new Date().toISOString() }).eq("id", id);
    fetchRuns();
  }

  return (
    <div className="relative z-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Crosshair className="h-3.5 w-3.5" /> Panel
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Launch Panel
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Configure and launch stress test runs across Layer 4 &amp; Layer 7.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Config card */}
          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">New run</h2>
              </div>
              <form onSubmit={launch} className="space-y-5 p-5">
                {/* Layer toggle */}
                <Field label="Layer">
                  <div className="inline-flex rounded-lg border border-white/[0.08] bg-black/40 p-1">
                    {["L4", "L7"].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => selectLayer(l)}
                        className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                          layer === l ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        {l}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Target */}
                <Field label={layer === "L4" ? "Server IP" : "Target URL"}>
                  <input
                    required
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder={layer === "L4" ? "203.0.113.10" : "https://example.com"}
                    className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-sm outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/10"
                  />
                </Field>

                {/* Method */}
                <Field label="Method">
                  <div className="flex flex-wrap gap-2">
                    {methods.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          method === m
                            ? "bg-white text-black"
                            : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Duration */}
                <Field label="Duration">
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`rounded-full px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                          duration === d
                            ? "bg-white text-black"
                            : "border border-white/[0.08] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </Field>

                {launchError && (
                  <p className="text-xs text-red-400">{launchError}</p>
                )}

                <button
                  type="submit"
                  disabled={launching}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black ring-1 ring-white/10 transition-colors hover:bg-zinc-200 disabled:opacity-60"
                >
                  <Play className="h-4 w-4" />
                  {launching ? "Queuing…" : "Launch run"}
                </button>
              </form>
            </div>
          </section>

          {/* Active runs */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold">Active runs</h2>
                <span className="font-mono text-[10px] text-muted-foreground">{runs.length} active</span>
              </div>
              {runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Crosshair className="mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No active runs</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {runs.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-medium">{r.target}</p>
                        <p className="text-[10px] text-muted-foreground">{r.layer} · {r.method} · {r.duration}s</p>
                      </div>
                      <StatusPill status={r.status} />
                      <button
                        onClick={() => stopRun(r.id)}
                        className="ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        title="Stop run"
                      >
                        <Square className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
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

function StatusPill({ status }) {
  const map = {
    running: "bg-zinc-100/10 text-zinc-200 ring-white/10",
    queued:  "bg-white/[0.04] text-muted-foreground ring-white/[0.06]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map[status] || map.queued}`}>
      {status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300" />}
      {status}
    </span>
  );
}
