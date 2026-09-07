-- ============================================================
-- Zorzer Stresser — Plan update v3
-- Run this in Supabase SQL Editor
-- ============================================================

-- Wipe existing plans and insert updated ones
delete from plans;

insert into plans
  (name, price, billing_period, concurrent_slots, max_duration, max_daily_runs,
   access_layers, methods, tagline, features, highlight)
values
  (
    'Basic', 600, 'monthly', 1, 120, 10,
    ARRAY['L4'],
    ARRAY['UDP-NORMAL'],
    'Starter — Layer 4',
    ARRAY[
      '1 concurrent attack',
      'UDP-NORMAL method',
      '120s max attack time',
      '10 attacks per day'
    ],
    false
  ),
  (
    'Elite', 800, 'monthly', 1, 600, 20,
    ARRAY['L4'],
    ARRAY['UDP-NORMAL','UDP-BYPASS','ICMP'],
    'Advanced Layer 4',
    ARRAY[
      '1 concurrent attack',
      'UDP-NORMAL method',
      'UDP-BYPASS method',
      'ICMP method',
      '600s max attack time',
      '20 attacks per day'
    ],
    true
  ),
  (
    'Adv', 800, 'monthly', 1, 600, 15,
    ARRAY['L7'],
    ARRAY['HTTP-GET','HTTP-POST','API-FLOOD','RAPID-RESET'],
    'Layer 7 full access',
    ARRAY[
      '1 concurrent attack',
      'HTTP-GET method',
      'HTTP-POST method',
      'API-FLOOD method',
      'RAPID-RESET method',
      '600s max attack time',
      '15 attacks per day'
    ],
    false
  ),
  (
    'God', 1400, 'monthly', 1, 1200, 60,
    ARRAY['L4','L7'],
    ARRAY['UDP-NORMAL','UDP-BYPASS','ICMP','HTTP-GET','HTTP-POST','API-FLOOD','RAPID-RESET'],
    'All layers · maximum power',
    ARRAY[
      '1 concurrent attack',
      'All L4 methods (UDP-NORMAL, UDP-BYPASS, ICMP)',
      'All L7 methods (HTTP-GET, HTTP-POST, API-FLOOD, RAPID-RESET)',
      '1200s max attack time',
      '30 L4 attacks + 30 L7 attacks per day'
    ],
    false
  );
