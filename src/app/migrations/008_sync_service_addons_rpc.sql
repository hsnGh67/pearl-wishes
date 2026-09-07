-- ============================================================
-- 008_sync_service_addons_rpc.sql
-- 1. Replace the permissive "authenticated" write policy on
--    service_addons with an admin-only policy.
-- 2. Create an atomic sync_service_addons() RPC that replaces
--    the old delete-then-insert pattern with a single database
--    transaction, including full input validation.
-- ============================================================

-- ── 1. Tighten RLS on service_addons ─────────────────────────
DROP POLICY IF EXISTS "Authenticated manage service_addons" ON service_addons;
DROP POLICY IF EXISTS "Admin manage service_addons" ON service_addons;
CREATE POLICY "Admin manage service_addons"
  ON service_addons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- ── 2. Atomic sync function ───────────────────────────────────
CREATE OR REPLACE FUNCTION sync_service_addons(
  p_service_id uuid,
  p_addon_ids   uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Caller must be an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admin users can modify service add-on mappings';
  END IF;

  -- Service must exist
  IF NOT EXISTS (SELECT 1 FROM services WHERE id = p_service_id) THEN
    RAISE EXCEPTION 'Service % does not exist', p_service_id;
  END IF;

  -- No self-references
  IF p_service_id = ANY(p_addon_ids) THEN
    RAISE EXCEPTION 'A service cannot reference itself as an add-on';
  END IF;

  -- All IDs must be active is_add_on services
  IF EXISTS (
    SELECT 1
    FROM unnest(p_addon_ids) AS req(id)
    LEFT JOIN services s
      ON s.id = req.id
      AND s.is_add_on = true
      AND s.is_active = true
    WHERE s.id IS NULL
  ) THEN
    RAISE EXCEPTION 'One or more IDs are not active add-on services';
  END IF;

  -- Atomic replace
  DELETE FROM service_addons WHERE service_id = p_service_id;

  INSERT INTO service_addons (service_id, addon_id, display_order, is_active)
  SELECT
    p_service_id,
    ord.id,
    (ord.n - 1)::integer,
    true
  FROM unnest(p_addon_ids) WITH ORDINALITY AS ord(id, n);
END;
$$;

-- Restrict direct execution to authenticated users only
REVOKE ALL ON FUNCTION sync_service_addons(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION sync_service_addons(uuid, uuid[]) TO authenticated;
