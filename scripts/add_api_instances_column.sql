-- ============================================================
-- Add api_instances column to l4_runs
-- Run this in Supabase SQL Editor
-- ============================================================

-- Stores { "https://api-url": "instance_id" } map per run
-- so the stop button can target each API server individually
alter table l4_runs
  add column if not exists api_instances jsonb default null;

-- Allow authenticated users to read layer4_apis (needed by Panel)
alter table layer4_apis enable row level security;

create policy "layer4_apis_select_auth"
  on layer4_apis for select
  using (auth.role() = 'authenticated');
