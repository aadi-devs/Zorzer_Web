/**
 * Time-aware concurrent-busy helpers.
 *
 * These query the DB directly so they work correctly regardless of
 * whether the server-side is_l4_busy / is_l7_busy RPCs have been
 * updated with timestamp logic.
 *
 * A run counts as "active" if:
 *   - status is 'running'  AND  started_at + duration > now
 *   - status is 'queued'   AND  created_at + duration + 30 s grace > now
 */
import { supabase } from "./supabaseClient";

async function isTableBusy(table) {
  const { data, error } = await supabase
    .from(table)
    .select("id, status, started_at, created_at, duration")
    .in("status", ["running", "queued"]);

  if (error || !data || data.length === 0) return false;

  const nowMs = Date.now();
  return data.some((r) => {
    if (r.started_at) {
      return new Date(r.started_at).getTime() + r.duration * 1000 > nowMs;
    }
    // queued with no started_at → grace period = duration + 30 s
    return new Date(r.created_at).getTime() + (r.duration + 30) * 1000 > nowMs;
  });
}

export async function isL4Busy() {
  return isTableBusy("l4_runs");
}

export async function isL7Busy() {
  return isTableBusy("l7_runs");
}

export async function getConcurrentCounts() {
  const [l4, l7] = await Promise.all([isL4Busy(), isL7Busy()]);
  return { l4: l4 ? 1 : 0, l7: l7 ? 1 : 0 };
}
