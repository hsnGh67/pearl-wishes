-- Migration 014: panel staff (admin users OR active nail artists)
-- Allows nail artists with Auth to access admin-panel RLS / RPCs.

CREATE OR REPLACE FUNCTION public.is_panel_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.artists
    WHERE auth_id = auth.uid() AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_panel_staff() FROM public;
GRANT EXECUTE ON FUNCTION public.is_panel_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_panel_staff() TO anon;

-- ── business_settings ────────────────────────────────────────
DROP POLICY IF EXISTS "Admin update business settings" ON public.business_settings;
CREATE POLICY "Admin update business settings"
  ON public.business_settings
  FOR UPDATE
  USING (public.is_panel_staff())
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin insert business settings" ON public.business_settings;
CREATE POLICY "Admin insert business settings"
  ON public.business_settings
  FOR INSERT
  WITH CHECK (public.is_panel_staff());

-- ── service_addons ───────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage service_addons" ON service_addons;
CREATE POLICY "Admin manage service_addons"
  ON service_addons
  FOR ALL
  USING (public.is_panel_staff())
  WITH CHECK (public.is_panel_staff());

-- ── sync_service_addons RPC ──────────────────────────────────
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
  IF NOT public.is_panel_staff() THEN
    RAISE EXCEPTION 'Only panel staff can modify service add-on mappings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE id = p_service_id) THEN
    RAISE EXCEPTION 'Service % does not exist', p_service_id;
  END IF;

  IF p_service_id = ANY(p_addon_ids) THEN
    RAISE EXCEPTION 'A service cannot reference itself as an add-on';
  END IF;

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

REVOKE ALL ON FUNCTION sync_service_addons(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION sync_service_addons(uuid, uuid[]) TO authenticated;

-- ── artists ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin select artists" ON public.artists;
CREATE POLICY "Admin select artists"
  ON public.artists FOR SELECT
  USING (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin insert artists" ON public.artists;
CREATE POLICY "Admin insert artists"
  ON public.artists FOR INSERT
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin update artists" ON public.artists;
CREATE POLICY "Admin update artists"
  ON public.artists FOR UPDATE
  USING (public.is_panel_staff())
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin delete artists" ON public.artists;
CREATE POLICY "Admin delete artists"
  ON public.artists FOR DELETE
  USING (public.is_panel_staff());

-- ── artist_districts ─────────────────────────────────────────
DROP POLICY IF EXISTS "Admin select artist_districts" ON public.artist_districts;
CREATE POLICY "Admin select artist_districts"
  ON public.artist_districts FOR SELECT
  USING (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin insert artist_districts" ON public.artist_districts;
CREATE POLICY "Admin insert artist_districts"
  ON public.artist_districts FOR INSERT
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin update artist_districts" ON public.artist_districts;
CREATE POLICY "Admin update artist_districts"
  ON public.artist_districts FOR UPDATE
  USING (public.is_panel_staff())
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin delete artist_districts" ON public.artist_districts;
CREATE POLICY "Admin delete artist_districts"
  ON public.artist_districts FOR DELETE
  USING (public.is_panel_staff());

-- ── artist_services ──────────────────────────────────────────
DROP POLICY IF EXISTS "Admin select artist_services" ON public.artist_services;
CREATE POLICY "Admin select artist_services"
  ON public.artist_services FOR SELECT
  USING (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin insert artist_services" ON public.artist_services;
CREATE POLICY "Admin insert artist_services"
  ON public.artist_services FOR INSERT
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin update artist_services" ON public.artist_services;
CREATE POLICY "Admin update artist_services"
  ON public.artist_services FOR UPDATE
  USING (public.is_panel_staff())
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Admin delete artist_services" ON public.artist_services;
CREATE POLICY "Admin delete artist_services"
  ON public.artist_services FOR DELETE
  USING (public.is_panel_staff());
