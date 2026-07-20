-- ============================================================
-- Split `runs` into `l4_runs` and `l7_runs`
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Layer 4 runs ──────────────────────────────────────────
create table if not exists l4_runs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  target      text not null,
  method      text not null,
  duration    int not null,
  status      text not null default 'queued',
  started_at  timestamptz,
  stopped_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ── Layer 7 runs ──────────────────────────────────────────
create table if not exists l7_runs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  target      text not null,
  method      text not null,
  duration    int not null,
  status      text not null default 'queued',
  started_at  timestamptz,
  stopped_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────
alter table l4_runs enable row level security;
alter table l7_runs enable row level security;

-- l4_runs — user sees / touches own rows only
create policy "l4_runs_select_own" on l4_runs for select using (auth.uid() = user_id);
create policy "l4_runs_insert_own" on l4_runs for insert with check (auth.uid() = user_id);
create policy "l4_runs_update_own" on l4_runs for update using (auth.uid() = user_id);
create policy "l4_runs_delete_own" on l4_runs for delete using (auth.uid() = user_id);

-- l4_runs — admin can read all rows
create policy "l4_runs_admin_select" on l4_runs for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- l7_runs — user sees / touches own rows only
create policy "l7_runs_select_own" on l7_runs for select using (auth.uid() = user_id);
create policy "l7_runs_insert_own" on l7_runs for insert with check (auth.uid() = user_id);
create policy "l7_runs_update_own" on l7_runs for update using (auth.uid() = user_id);
create policy "l7_runs_delete_own" on l7_runs for delete using (auth.uid() = user_id);

-- l7_runs — admin can read all rows
create policy "l7_runs_admin_select" on l7_runs for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- ── Migrate existing data ─────────────────────────────────
insert into l4_runs (id, user_id, target, method, duration, status, started_at, stopped_at, created_at)
select id, user_id, target, method, duration, status, started_at, stopped_at, created_at
from runs
where layer = 'L4'
on conflict (id) do nothing;

insert into l7_runs (id, user_id, target, method, duration, status, started_at, stopped_at, created_at)
select id, user_id, target, method, duration, status, started_at, stopped_at, created_at
from runs
where layer = 'L7'
on conflict (id) do nothing;
