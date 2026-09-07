-- ============================================================
-- 007_service_addons.sql
-- Add has_addons flag to services and create junction table
-- linking services to their available add-ons.
-- ============================================================

-- 1. Add has_addons column to services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS has_addons boolean NOT NULL DEFAULT false;

-- 2. Junction table: service → allowed add-ons
CREATE TABLE IF NOT EXISTS service_addons (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    uuid        NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  addon_id      uuid        NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  is_active     boolean     NOT NULL DEFAULT true,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_addons_unique UNIQUE (service_id, addon_id),
  CONSTRAINT no_self_addon         CHECK  (service_id <> addon_id)
);

CREATE INDEX IF NOT EXISTS idx_service_addons_service_id ON service_addons (service_id);
CREATE INDEX IF NOT EXISTS idx_service_addons_addon_id   ON service_addons (addon_id);

-- 3. Row-level security
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read service_addons"         ON service_addons;
DROP POLICY IF EXISTS "Authenticated manage service_addons" ON service_addons;

CREATE POLICY "Public read service_addons"
  ON service_addons FOR SELECT USING (true);

CREATE POLICY "Authenticated manage service_addons"
  ON service_addons FOR ALL USING (auth.role() = 'authenticated');
