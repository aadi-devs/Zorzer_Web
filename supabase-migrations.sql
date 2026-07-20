-- =============================================================
-- Zorzer Stresser — DB migration
-- Run this in the Supabase SQL editor to keep server-side RPCs
-- in sync with the client-side time-aware logic.
-- =============================================================

-- Fix is_l4_busy: time-aware — stale "queued" runs no longer block forever
CREATE OR REPLACE FUNCTION is_l4_busy()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM l4_runs
    WHERE status IN ('running', 'queued')
      AND CASE
        WHEN started_at IS NOT NULL THEN
          started_at + (duration || ' seconds')::interval > NOW()
        ELSE
          -- queued with no started_at: expire after duration + 30 s grace
          created_at + (duration || ' seconds')::interval + INTERVAL '30 seconds' > NOW()
      END
  );
$$;

-- Create is_l7_busy (mirrors is_l4_busy logic for Layer 7 runs)
CREATE OR REPLACE FUNCTION is_l7_busy()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM l7_runs
    WHERE status IN ('running', 'queued')
      AND CASE
        WHEN started_at IS NOT NULL THEN
          started_at + (duration || ' seconds')::interval > NOW()
        ELSE
          created_at + (duration || ' seconds')::interval + INTERVAL '30 seconds' > NOW()
      END
  );
$$;

-- Grant execute to authenticated role so the JS client can call them
GRANT EXECUTE ON FUNCTION is_l4_busy() TO authenticated;
GRANT EXECUTE ON FUNCTION is_l7_busy() TO authenticated;
