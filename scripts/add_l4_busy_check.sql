-- ============================================================
-- Global L4 busy check — run in Supabase SQL Editor
-- ============================================================

-- Returns true if ANY user has an active L4 run right now.
-- security definer = runs as the function owner (bypasses RLS)
-- so it can see all rows without exposing them to the caller.
create or replace function is_l4_busy()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from l4_runs
    where status in ('running', 'queued')
  );
$$;

-- Allow any authenticated user to call it
grant execute on function is_l4_busy() to authenticated;
