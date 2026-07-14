-- Migration: 004_promo_codes
-- Creates promo_codes + promo_code_usage tables and adds
-- promo snapshot columns to bookings.

-- 1. promo_codes ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  code           TEXT NOT NULL UNIQUE,
  discount_type  TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  max_cap        NUMERIC(10,2),
  start_date     DATE,
  end_date       DATE,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  applies_to     TEXT NOT NULL DEFAULT 'all'
                   CHECK (applies_to IN ('all','treatments','workshops','specific')),
  assign_to      TEXT NOT NULL DEFAULT 'all'
                   CHECK (assign_to IN ('all','specific','filter')),
  per_user_usage TEXT NOT NULL DEFAULT 'once'
                   CHECK (per_user_usage IN ('once','multiple')),
  per_user_limit INTEGER,
  global_usage   TEXT NOT NULL DEFAULT 'unlimited'
                   CHECK (global_usage IN ('unlimited','limited')),
  global_limit   INTEGER,
  usage_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code   ON promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes (is_active);

-- 2. promo_code_usage ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id    UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  booking_id       UUID,
  user_id          UUID,
  discount_applied NUMERIC(10,2) NOT NULL,
  original_total   NUMERIC(10,2),
  final_total      NUMERIC(10,2),
  used_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_code    ON promo_code_usage (promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user    ON promo_code_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_booking ON promo_code_usage (booking_id);

-- 3. Promo snapshot on bookings ------------------------------------------------
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS promo_code_id       UUID REFERENCES promo_codes(id),
  ADD COLUMN IF NOT EXISTS promo_code_code     TEXT,
  ADD COLUMN IF NOT EXISTS promo_code_discount NUMERIC(10,2);

-- 4. Atomic increment helper ---------------------------------------------------
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE promo_codes
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE id = promo_id;
$$;

-- 5. Seed data -----------------------------------------------------------------
INSERT INTO promo_codes
  (name, code, discount_type, discount_value, max_cap,
   start_date, end_date, is_active, applies_to,
   per_user_usage, global_usage, global_limit)
VALUES
  ('Summer Repeat Clients','SUMMER20','percentage',20, 40,'2026-07-01','2026-07-31',true, 'treatments','once','limited',  100),
  ('VIP Workshop',         'VIPW10',  'fixed',      10,NULL,'2026-07-05','2026-08-05',true, 'workshops', 'once','unlimited',NULL),
  ('Returning Users',      'BACK15',  'percentage', 15,NULL,'2026-06-01','2026-06-30',true, 'all',       'once','limited',  200),
  ('New Client Welcome',   'NEWCLIENT','fixed',      15,NULL,'2026-01-01','2026-12-31',true, 'treatments','once','limited',  500),
  ('Autumn Launch',        'AUTUMN10','percentage', 10,NULL,'2026-09-01','2026-10-31',true, 'all',       'once','unlimited',NULL),
  ('Birthday Special',     'BDAY25',  'percentage', 25,NULL,'2026-05-01','2026-05-31',false,'all',       'once','limited',   50),
  ('Loyalty Reward',       'LOYAL5',  'fixed',       5,NULL,'2026-03-01','2026-03-31',false,'treatments','multiple','limited',60)
ON CONFLICT (code) DO NOTHING;
