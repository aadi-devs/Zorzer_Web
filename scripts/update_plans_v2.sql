-- ============================================================
-- ReturnStress — Plan migration v2
-- Run this in Supabase SQL Editor AFTER create_schema.sql
-- ============================================================

-- 1. Add max_daily_runs column (0 = unlimited)
alter table plans
  add column if not exists max_daily_runs int not null default 0;

-- 2. Wipe old seed plans and insert the real four
delete from plans;

insert into plans
  (name, price, billing_period, concurrent_slots, max_duration, max_daily_runs,
   access_layers, methods, tagline, features, highlight)
values
  (
    'Basic', 0, 'free', 1, 120, 10,
    ARRAY['L4'],
    ARRAY['UDP-NORMAL'],
    'Starter — Layer 4',
    ARRAY[
      'Layer 4 access',
      'UDP-NORMAL method',
      '1 concurrent slot',
      '120s max duration',
      '10 attacks per day'
    ],
    false
  ),
  (
    'Elite', 19, 'monthly', 2, 300, 20,
    ARRAY['L4'],
    ARRAY['UDP-BYPASS','ICMP'],
    'Advanced Layer 4',
    ARRAY[
      'Layer 4 access',
      'UDP-BYPASS method',
      'ICMP method',
      '2 concurrent slots',
      '300s max duration',
      '20 attacks per day'
    ],
    true
  ),
  (
    'Adv', 39, 'monthly', 3, 600, 30,
    ARRAY['L7'],
    ARRAY['httpget','httpflood','apiflood','rapidreset'],
    'Layer 7 full access',
    ARRAY[
      'Layer 7 access',
      'HTTP GET flood',
      'HTTP flood',
      'API flood',
      'Rapid Reset (HTTP/2)',
      '3 concurrent slots',
      '600s max duration',
      '30 attacks per day'
    ],
    false
  ),
  (
    'God', 99, 'monthly', 10, 3600, 0,
    ARRAY['L4','L7'],
    ARRAY['UDP-NORMAL','UDP-BYPASS','ICMP','httpget','httpflood','apiflood','rapidreset'],
    'All layers · unlimited',
    ARRAY[
      'Layer 4 + Layer 7 access',
      'All methods unlocked',
      '10 concurrent slots',
      '3600s max duration',
      'Unlimited daily attacks',
      'Dedicated support'
    ],
    false
  );
