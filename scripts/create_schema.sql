-- ============================================
-- ReturnStress — Supabase Schema
-- ============================================

-- UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PLANS
-- ============================================
create table if not exists plans (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  price           decimal(10,2) not null default 0,
  billing_period  text not null default 'monthly',
  concurrent_slots int not null default 1,
  max_duration    int not null default 300,
  access_layers   text[] not null default '{}',
  methods         text[] not null default '{}',
  tagline         text,
  features        text[] not null default '{}',
  highlight       boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table if not exists profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  full_name            text,
  avatar_url           text,
  plan_id              uuid references plans(id),
  compact_layout       boolean not null default false,
  animations_enabled   boolean not null default true,
  monospace_numerics   boolean not null default false,
  two_factor_enabled   boolean not null default false,
  email_notifications  boolean not null default true,
  auto_renew           boolean not null default true,
  login_ip             text,
  is_suspended         boolean not null default false,
  suspended_at         timestamptz,
  suspended_reason     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================
-- RUNS (stress test runs)
-- ============================================
create table if not exists runs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  target      text not null,
  layer       text not null,
  method      text not null,
  duration    int not null,
  status      text not null default 'queued',
  started_at  timestamptz,
  stopped_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ============================================
-- NEWS / ANNOUNCEMENTS
-- ============================================
create table if not exists news (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  body        text not null,
  tag         text not null default 'Update',
  created_at  timestamptz not null default now()
);

-- ============================================
-- FEEDBACK
-- ============================================
create table if not exists feedback (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete set null,
  name        text not null,
  email       text not null,
  topic       text not null default 'General',
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table plans    enable row level security;
alter table profiles enable row level security;
alter table runs     enable row level security;
alter table news     enable row level security;
alter table feedback enable row level security;

-- Plans: public read
create policy "plans_select_public"
  on plans for select using (true);

-- Profiles: own row only
create policy "profiles_select_own"
  on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own"
  on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own"
  on profiles for update using (auth.uid() = id);

-- Runs: own rows only
create policy "runs_select_own"
  on runs for select using (auth.uid() = user_id);
create policy "runs_insert_own"
  on runs for insert with check (auth.uid() = user_id);
create policy "runs_update_own"
  on runs for update using (auth.uid() = user_id);
create policy "runs_delete_own"
  on runs for delete using (auth.uid() = user_id);

-- News: any authenticated user can read
create policy "news_select_auth"
  on news for select using (auth.role() = 'authenticated');

-- Feedback: anyone can insert; users see own
create policy "feedback_insert_any"
  on feedback for insert with check (true);
create policy "feedback_select_own"
  on feedback for select using (auth.uid() = user_id);

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SEED: Plans
-- ============================================
insert into plans (name, price, billing_period, concurrent_slots, max_duration, access_layers, methods, tagline, features, highlight)
values
  ('Basic',  0,  'free',     1,  120,  ARRAY['L4'],       ARRAY['Method A'],                              'Get started free',  ARRAY['Layer 4 access','Method A only','1 concurrent slot','120s max duration','Basic support'],                                        false),
  ('Elite',  19, 'monthly',  3,  600,  ARRAY['L4'],       ARRAY['Method A','Method B','Method C'],         'L4 All methods',    ARRAY['Layer 4 access','Method A, B & C','3 concurrent slots','600s max duration','Priority support'],                                  true),
  ('Pro',    39, 'monthly',  5,  1200, ARRAY['L4','L7'],  ARRAY['Method A','Method B','Method C','Method D'],'L4 + L7 access',  ARRAY['Layer 4 & 7 access','All methods','5 concurrent slots','1200s max duration','Priority support'],                                false),
  ('God',    99, 'monthly',  10, 3600, ARRAY['L4','L7'],  ARRAY['Method A','Method B','Method C','Method D'],'Unlimited power', ARRAY['Layer 4 & 7 access','All methods','10 concurrent slots','3600s max duration','Dedicated support','Custom methods'],              false)
on conflict do nothing;

-- ============================================
-- SEED: News
-- ============================================
insert into news (title, body, tag)
values
  ('Platform Update v2.4',             'Enhanced L7 bypass capabilities with improved fingerprint rotation. Reduced latency by 18% across all regions.',                                   'Update'),
  ('New Network Node: São Paulo',       'We have added a new exit node in São Paulo, Brazil. This expands our South American coverage significantly.',                                       'Network'),
  ('Security Hardening',               'Implemented additional rate limiting and abuse detection. All traffic is now routed through our enhanced scrubbing infrastructure.',                'Security'),
  ('Service Status: All Systems Operational', 'All layers are operating normally. Uptime for the past 30 days: 99.97%.',                                                                   'Status')
on conflict do nothing;
