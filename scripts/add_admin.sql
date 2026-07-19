-- ============================================
-- Migration: add is_admin + admin RLS policies
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add is_admin column to profiles
alter table profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Allow admin users to insert/delete news
create policy "admin_news_insert"
  on news for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and   profiles.is_admin = true
    )
  );

create policy "admin_news_delete"
  on news for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and   profiles.is_admin = true
    )
  );

-- 3. Allow admin users to update plans
create policy "admin_plans_update"
  on plans for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and   profiles.is_admin = true
    )
  );

-- 4. Grant yourself admin access (replace with your actual user ID from Supabase → Auth → Users)
-- update profiles set is_admin = true where email = 'your@email.com';
