-- ============================================================
-- Fix is_l4_busy() to respect run duration expiry
-- Run this in Supabase SQL Editor
-- ============================================================

create or replace function is_l4_busy()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from l4_runs
    where status in ('running', 'queued')
      and (
        -- still within its time window
        started_at is not null
        and started_at + (duration * interval '1 second') > now()
      )
  );
$$;

grant execute on function is_l4_busy() to authenticated;

-- Also clean up any stale runs whose duration has already passed
-- (safe to run multiple times)
update l4_runs
set status = 'success', stopped_at = now()
where status in ('running', 'queued')
  and started_at is not null
  and started_at + (duration * interval '1 second') <= now();
