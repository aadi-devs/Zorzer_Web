-- ============================================================
-- Fix: update plans IN-PLACE (preserves UUIDs & profile links)
-- Run this in Supabase SQL Editor instead of update_plans_v3.sql
-- ============================================================

-- Basic
update plans set
  price            = 600,
  billing_period   = 'monthly',
  concurrent_slots = 1,
  max_duration     = 120,
  max_daily_runs   = 10,
  access_layers    = ARRAY['L4'],
  methods          = ARRAY['UDP-NORMAL'],
  tagline          = 'Starter — Layer 4',
  features         = ARRAY[
    '1 concurrent attack',
    'UDP-NORMAL method',
    '120s max attack time',
    '10 attacks per day'
  ],
  highlight        = false
where name = 'Basic';

-- Elite
update plans set
  price            = 800,
  billing_period   = 'monthly',
  concurrent_slots = 1,
  max_duration     = 600,
  max_daily_runs   = 20,
  access_layers    = ARRAY['L4'],
  methods          = ARRAY['UDP-NORMAL','UDP-BYPASS','ICMP'],
  tagline          = 'Advanced Layer 4',
  features         = ARRAY[
    '1 concurrent attack',
    'UDP-NORMAL method',
    'UDP-BYPASS method',
    'ICMP method',
    '600s max attack time',
    '20 attacks per day'
  ],
  highlight        = true
where name = 'Elite';

-- Adv
update plans set
  price            = 800,
  billing_period   = 'monthly',
  concurrent_slots = 1,
  max_duration     = 600,
  max_daily_runs   = 15,
  access_layers    = ARRAY['L7'],
  methods          = ARRAY['HTTP-GET','HTTP-POST','API-FLOOD','RAPID-RESET'],
  tagline          = 'Layer 7 full access',
  features         = ARRAY[
    '1 concurrent attack',
    'HTTP-GET method',
    'HTTP-POST method',
    'API-FLOOD method',
    'RAPID-RESET method',
    '600s max attack time',
    '15 attacks per day'
  ],
  highlight        = false
where name = 'Adv';

-- God
update plans set
  price            = 1400,
  billing_period   = 'monthly',
  concurrent_slots = 1,
  max_duration     = 1200,
  max_daily_runs   = 60,
  access_layers    = ARRAY['L4','L7'],
  methods          = ARRAY['UDP-NORMAL','UDP-BYPASS','ICMP','HTTP-GET','HTTP-POST','API-FLOOD','RAPID-RESET'],
  tagline          = 'All layers · maximum power',
  features         = ARRAY[
    '1 concurrent attack',
    'All L4 methods (UDP-NORMAL, UDP-BYPASS, ICMP)',
    'All L7 methods (HTTP-GET, HTTP-POST, API-FLOOD, RAPID-RESET)',
    '1200s max attack time',
    '30 L4 attacks + 30 L7 attacks per day'
  ],
  highlight        = false
where name = 'God';

-- If plans were deleted (UUIDs lost), re-insert missing ones
insert into plans (name, price, billing_period, concurrent_slots, max_duration, max_daily_runs,
                   access_layers, methods, tagline, features, highlight)
select 'Basic', 600, 'monthly', 1, 120, 10,
  ARRAY['L4'], ARRAY['UDP-NORMAL'],
  'Starter — Layer 4',
  ARRAY['1 concurrent attack','UDP-NORMAL method','120s max attack time','10 attacks per day'],
  false
where not exists (select 1 from plans where name = 'Basic');

insert into plans (name, price, billing_period, concurrent_slots, max_duration, max_daily_runs,
                   access_layers, methods, tagline, features, highlight)
select 'Elite', 800, 'monthly', 1, 600, 20,
  ARRAY['L4'], ARRAY['UDP-NORMAL','UDP-BYPASS','ICMP'],
  'Advanced Layer 4',
  ARRAY['1 concurrent attack','UDP-NORMAL method','UDP-BYPASS method','ICMP method','600s max attack time','20 attacks per day'],
  true
where not exists (select 1 from plans where name = 'Elite');

insert into plans (name, price, billing_period, concurrent_slots, max_duration, max_daily_runs,
                   access_layers, methods, tagline, features, highlight)
select 'Adv', 800, 'monthly', 1, 600, 15,
  ARRAY['L7'], ARRAY['HTTP-GET','HTTP-POST','API-FLOOD','RAPID-RESET'],
  'Layer 7 full access',
  ARRAY['1 concurrent attack','HTTP-GET method','HTTP-POST method','API-FLOOD method','RAPID-RESET method','600s max attack time','15 attacks per day'],
  false
where not exists (select 1 from plans where name = 'Adv');

insert into plans (name, price, billing_period, concurrent_slots, max_duration, max_daily_runs,
                   access_layers, methods, tagline, features, highlight)
select 'God', 1400, 'monthly', 1, 1200, 60,
  ARRAY['L4','L7'],
  ARRAY['UDP-NORMAL','UDP-BYPASS','ICMP','HTTP-GET','HTTP-POST','API-FLOOD','RAPID-RESET'],
  'All layers · maximum power',
  ARRAY['1 concurrent attack','All L4 methods (UDP-NORMAL, UDP-BYPASS, ICMP)','All L7 methods (HTTP-GET, HTTP-POST, API-FLOOD, RAPID-RESET)','1200s max attack time','30 L4 attacks + 30 L7 attacks per day'],
  false
where not exists (select 1 from plans where name = 'God');

-- ── After running, re-assign your profile if plan shows as null ──────────
-- Check which plans exist now:
--   SELECT id, name FROM plans ORDER BY price;
--
-- Then re-assign your profile:
--   UPDATE profiles
--   SET plan_id = '<elite-uuid-from-above>'
--   WHERE email = 'your@email.com';
