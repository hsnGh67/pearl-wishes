-- Migration: 016_artist_availability
-- Weekly rhythm + day overrides + month submit gate for nail artists.
-- Extends get_available_artists_for_booking to respect submitted working hours.

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.artist_weekly_rhythm (
  artist_id   uuid NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  dow         smallint NOT NULL,
  is_working  boolean NOT NULL DEFAULT false,
  start_time  time NOT NULL DEFAULT '10:00',
  end_time    time NOT NULL DEFAULT '18:00',
  PRIMARY KEY (artist_id, dow),
  CONSTRAINT artist_weekly_rhythm_dow_check CHECK (dow >= 0 AND dow <= 6),
  CONSTRAINT artist_weekly_rhythm_times_check CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_artist_weekly_rhythm_artist_id
  ON public.artist_weekly_rhythm (artist_id);

CREATE TABLE IF NOT EXISTS public.artist_day_overrides (
  artist_id   uuid NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  work_date   date NOT NULL,
  status      text NOT NULL,
  start_time  time,
  end_time    time,
  PRIMARY KEY (artist_id, work_date),
  CONSTRAINT artist_day_overrides_status_check CHECK (status IN ('working', 'off')),
  CONSTRAINT artist_day_overrides_times_check CHECK (
    (status = 'off')
    OR (
      status = 'working'
      AND start_time IS NOT NULL
      AND end_time IS NOT NULL
      AND start_time < end_time
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_artist_day_overrides_artist_date
  ON public.artist_day_overrides (artist_id, work_date);

CREATE TABLE IF NOT EXISTS public.artist_month_submissions (
  artist_id     uuid NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  year_month    date NOT NULL,
  status        text NOT NULL DEFAULT 'draft',
  submitted_at  timestamptz,
  PRIMARY KEY (artist_id, year_month),
  CONSTRAINT artist_month_submissions_status_check CHECK (status IN ('draft', 'submitted')),
  CONSTRAINT artist_month_submissions_year_month_check CHECK (
    year_month = date_trunc('month', year_month)::date
  )
);

CREATE INDEX IF NOT EXISTS idx_artist_month_submissions_status
  ON public.artist_month_submissions (status);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.artist_weekly_rhythm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_day_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_month_submissions ENABLE ROW LEVEL SECURITY;

-- Helper: caller is admin in public.users
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- Helper: admin OR owning active artist
CREATE OR REPLACE FUNCTION public.can_manage_artist(p_artist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.artists
      WHERE id = p_artist_id
        AND auth_id = auth.uid()
        AND is_active = true
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_artist(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_manage_artist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_artist(uuid) TO anon;

-- Normalize to first-of-month
CREATE OR REPLACE FUNCTION public.normalize_year_month(p_date date)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('month', p_date)::date;
$$;

-- Resolve working status/hours for a date (override > rhythm)
CREATE OR REPLACE FUNCTION public.resolve_artist_day(
  p_artist_id uuid,
  p_work_date date
)
RETURNS TABLE (
  status text,
  start_time time,
  end_time time
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override public.artist_day_overrides%ROWTYPE;
  v_rhythm   public.artist_weekly_rhythm%ROWTYPE;
  v_dow      smallint;
BEGIN
  SELECT *
  INTO v_override
  FROM public.artist_day_overrides
  WHERE artist_id = p_artist_id
    AND work_date = p_work_date;

  IF FOUND THEN
    status := v_override.status;
    start_time := v_override.start_time;
    end_time := v_override.end_time;
    RETURN NEXT;
    RETURN;
  END IF;

  v_dow := EXTRACT(DOW FROM p_work_date)::smallint;

  SELECT *
  INTO v_rhythm
  FROM public.artist_weekly_rhythm
  WHERE artist_id = p_artist_id
    AND dow = v_dow;

  IF FOUND THEN
    status := CASE WHEN v_rhythm.is_working THEN 'working' ELSE 'off' END;
    start_time := v_rhythm.start_time;
    end_time := v_rhythm.end_time;
    RETURN NEXT;
    RETURN;
  END IF;

  -- No rhythm row → treat as off
  status := 'off';
  start_time := NULL;
  end_time := NULL;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_artist_day(uuid, date) FROM public;
GRANT EXECUTE ON FUNCTION public.resolve_artist_day(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_artist_day(uuid, date) TO anon;

-- Seed default weekly rhythm (Mon–Fri 10–18, Sat 10–15, Sun off)
CREATE OR REPLACE FUNCTION public.ensure_artist_weekly_rhythm(p_artist_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.artist_weekly_rhythm WHERE artist_id = p_artist_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.artist_weekly_rhythm (artist_id, dow, is_working, start_time, end_time)
  VALUES
    (p_artist_id, 0, false, '10:00', '18:00'),
    (p_artist_id, 1, true,  '10:00', '18:00'),
    (p_artist_id, 2, true,  '10:00', '18:00'),
    (p_artist_id, 3, true,  '10:00', '18:00'),
    (p_artist_id, 4, true,  '10:00', '18:00'),
    (p_artist_id, 5, true,  '10:00', '18:00'),
    (p_artist_id, 6, true,  '10:00', '15:00');
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_artist_month_draft(
  p_artist_id uuid,
  p_year_month date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ym date := public.normalize_year_month(p_year_month);
BEGIN
  INSERT INTO public.artist_month_submissions (artist_id, year_month, status, submitted_at)
  VALUES (p_artist_id, v_ym, 'draft', NULL)
  ON CONFLICT (artist_id, year_month) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.artist_month_is_writable(
  p_artist_id uuid,
  p_year_month date
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin_user()
    OR NOT EXISTS (
      SELECT 1
      FROM public.artist_month_submissions
      WHERE artist_id = p_artist_id
        AND year_month = public.normalize_year_month(p_year_month)
        AND status = 'submitted'
    );
$$;

-- SELECT: panel staff
DROP POLICY IF EXISTS "Panel select artist_weekly_rhythm" ON public.artist_weekly_rhythm;
CREATE POLICY "Panel select artist_weekly_rhythm"
  ON public.artist_weekly_rhythm FOR SELECT
  USING (public.is_panel_staff());

DROP POLICY IF EXISTS "Panel select artist_day_overrides" ON public.artist_day_overrides;
CREATE POLICY "Panel select artist_day_overrides"
  ON public.artist_day_overrides FOR SELECT
  USING (public.is_panel_staff());

DROP POLICY IF EXISTS "Panel select artist_month_submissions" ON public.artist_month_submissions;
CREATE POLICY "Panel select artist_month_submissions"
  ON public.artist_month_submissions FOR SELECT
  USING (public.is_panel_staff());

-- Writes go through SECURITY DEFINER RPCs; keep direct table writes for owner/admin as backup
DROP POLICY IF EXISTS "Manage artist_weekly_rhythm" ON public.artist_weekly_rhythm;
CREATE POLICY "Manage artist_weekly_rhythm"
  ON public.artist_weekly_rhythm FOR ALL
  USING (public.can_manage_artist(artist_id))
  WITH CHECK (public.can_manage_artist(artist_id));

DROP POLICY IF EXISTS "Manage artist_day_overrides" ON public.artist_day_overrides;
CREATE POLICY "Manage artist_day_overrides"
  ON public.artist_day_overrides FOR ALL
  USING (public.can_manage_artist(artist_id))
  WITH CHECK (public.can_manage_artist(artist_id));

DROP POLICY IF EXISTS "Manage artist_month_submissions" ON public.artist_month_submissions;
CREATE POLICY "Manage artist_month_submissions"
  ON public.artist_month_submissions FOR ALL
  USING (public.can_manage_artist(artist_id))
  WITH CHECK (public.can_manage_artist(artist_id));

-- =============================================
-- CRUD RPCs
-- =============================================

CREATE OR REPLACE FUNCTION public.get_artist_availability(
  p_artist_id uuid,
  p_year_month date
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ym date := public.normalize_year_month(p_year_month);
  v_month public.artist_month_submissions%ROWTYPE;
  v_result jsonb;
BEGIN
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to view availability for this artist';
  END IF;

  PERFORM public.ensure_artist_weekly_rhythm(p_artist_id);

  SELECT * INTO v_month
  FROM public.artist_month_submissions
  WHERE artist_id = p_artist_id AND year_month = v_ym;

  SELECT jsonb_build_object(
    'artist_id', p_artist_id,
    'year_month', v_ym,
    'month', CASE
      WHEN v_month.artist_id IS NULL THEN jsonb_build_object(
        'artist_id', p_artist_id,
        'year_month', v_ym,
        'status', 'draft',
        'submitted_at', NULL
      )
      ELSE jsonb_build_object(
        'artist_id', v_month.artist_id,
        'year_month', v_month.year_month,
        'status', v_month.status,
        'submitted_at', v_month.submitted_at
      )
    END,
    'rhythm', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'dow', r.dow,
          'is_working', r.is_working,
          'start_time', to_char(r.start_time, 'HH24:MI'),
          'end_time', to_char(r.end_time, 'HH24:MI')
        )
        ORDER BY CASE r.dow WHEN 0 THEN 7 ELSE r.dow END
      )
      FROM public.artist_weekly_rhythm r
      WHERE r.artist_id = p_artist_id
    ), '[]'::jsonb),
    'overrides', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'work_date', o.work_date,
          'status', o.status,
          'start_time', CASE WHEN o.start_time IS NULL THEN NULL ELSE to_char(o.start_time, 'HH24:MI') END,
          'end_time', CASE WHEN o.end_time IS NULL THEN NULL ELSE to_char(o.end_time, 'HH24:MI') END
        )
        ORDER BY o.work_date
      )
      FROM public.artist_day_overrides o
      WHERE o.artist_id = p_artist_id
        AND o.work_date >= v_ym
        AND o.work_date < (v_ym + interval '1 month')::date
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_artist_weekly_rhythm(
  p_artist_id uuid,
  p_days jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day jsonb;
  v_dow smallint;
  v_is_working boolean;
  v_start time;
  v_end time;
BEGIN
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to update rhythm for this artist';
  END IF;

  IF p_days IS NULL OR jsonb_typeof(p_days) <> 'array' OR jsonb_array_length(p_days) <> 7 THEN
    RAISE EXCEPTION 'p_days must be a JSON array of 7 day objects';
  END IF;

  FOR v_day IN SELECT * FROM jsonb_array_elements(p_days)
  LOOP
    v_dow := (v_day ->> 'dow')::smallint;
    v_is_working := COALESCE((v_day ->> 'is_working')::boolean, false);
    v_start := COALESCE((v_day ->> 'start_time')::time, '10:00'::time);
    v_end := COALESCE((v_day ->> 'end_time')::time, '18:00'::time);

    IF v_dow < 0 OR v_dow > 6 THEN
      RAISE EXCEPTION 'Invalid dow %', v_dow;
    END IF;

    IF v_start >= v_end THEN
      RAISE EXCEPTION 'start_time must be before end_time for dow %', v_dow;
    END IF;

    INSERT INTO public.artist_weekly_rhythm (artist_id, dow, is_working, start_time, end_time)
    VALUES (p_artist_id, v_dow, v_is_working, v_start, v_end)
    ON CONFLICT (artist_id, dow) DO UPDATE
      SET is_working = EXCLUDED.is_working,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_artist_day_override(
  p_artist_id uuid,
  p_work_date date,
  p_status text,
  p_start_time text DEFAULT NULL,
  p_end_time text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ym date := public.normalize_year_month(p_work_date);
  v_start time;
  v_end time;
BEGIN
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to update overrides for this artist';
  END IF;

  IF p_status NOT IN ('working', 'off') THEN
    RAISE EXCEPTION 'Invalid status %', p_status;
  END IF;

  IF NOT public.artist_month_is_writable(p_artist_id, v_ym) THEN
    RAISE EXCEPTION 'Month is submitted; unlock before editing';
  END IF;

  PERFORM public.ensure_artist_month_draft(p_artist_id, v_ym);
  PERFORM public.ensure_artist_weekly_rhythm(p_artist_id);

  IF p_status = 'working' THEN
    IF p_start_time IS NULL OR p_end_time IS NULL THEN
      RAISE EXCEPTION 'start_time and end_time are required for working days';
    END IF;
    v_start := p_start_time::time;
    v_end := p_end_time::time;
    IF v_start >= v_end THEN
      RAISE EXCEPTION 'start_time must be before end_time';
    END IF;
  ELSE
    v_start := NULL;
    v_end := NULL;
  END IF;

  INSERT INTO public.artist_day_overrides (artist_id, work_date, status, start_time, end_time)
  VALUES (p_artist_id, p_work_date, p_status, v_start, v_end)
  ON CONFLICT (artist_id, work_date) DO UPDATE
    SET status = EXCLUDED.status,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_artist_day_override(
  p_artist_id uuid,
  p_work_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ym date := public.normalize_year_month(p_work_date);
BEGIN
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to delete overrides for this artist';
  END IF;

  IF NOT public.artist_month_is_writable(p_artist_id, v_ym) THEN
    RAISE EXCEPTION 'Month is submitted; unlock before editing';
  END IF;

  DELETE FROM public.artist_day_overrides
  WHERE artist_id = p_artist_id
    AND work_date = p_work_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_rhythm_to_month(
  p_artist_id uuid,
  p_year_month date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ym date := public.normalize_year_month(p_year_month);
BEGIN
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to apply rhythm for this artist';
  END IF;

  IF NOT public.artist_month_is_writable(p_artist_id, v_ym) THEN
    RAISE EXCEPTION 'Month is submitted; unlock before editing';
  END IF;

  PERFORM public.ensure_artist_month_draft(p_artist_id, v_ym);
  PERFORM public.ensure_artist_weekly_rhythm(p_artist_id);

  DELETE FROM public.artist_day_overrides
  WHERE artist_id = p_artist_id
    AND work_date >= v_ym
    AND work_date < (v_ym + interval '1 month')::date;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_artist_month(
  p_artist_id uuid,
  p_year_month date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ym date := public.normalize_year_month(p_year_month);
BEGIN
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to submit availability for this artist';
  END IF;

  PERFORM public.ensure_artist_weekly_rhythm(p_artist_id);

  INSERT INTO public.artist_month_submissions (artist_id, year_month, status, submitted_at)
  VALUES (p_artist_id, v_ym, 'submitted', now())
  ON CONFLICT (artist_id, year_month) DO UPDATE
    SET status = 'submitted',
        submitted_at = COALESCE(public.artist_month_submissions.submitted_at, now());
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_artist_month(
  p_artist_id uuid,
  p_year_month date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ym date := public.normalize_year_month(p_year_month);
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Only admins can unlock a submitted month';
  END IF;

  INSERT INTO public.artist_month_submissions (artist_id, year_month, status, submitted_at)
  VALUES (p_artist_id, v_ym, 'draft', NULL)
  ON CONFLICT (artist_id, year_month) DO UPDATE
    SET status = 'draft',
        submitted_at = NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_artist_availability(uuid, date) FROM public;
REVOKE ALL ON FUNCTION public.upsert_artist_weekly_rhythm(uuid, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.upsert_artist_day_override(uuid, date, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.delete_artist_day_override(uuid, date) FROM public;
REVOKE ALL ON FUNCTION public.apply_rhythm_to_month(uuid, date) FROM public;
REVOKE ALL ON FUNCTION public.submit_artist_month(uuid, date) FROM public;
REVOKE ALL ON FUNCTION public.unlock_artist_month(uuid, date) FROM public;

GRANT EXECUTE ON FUNCTION public.get_artist_availability(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_artist_weekly_rhythm(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_artist_day_override(uuid, date, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_artist_day_override(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_rhythm_to_month(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_artist_month(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_artist_month(uuid, date) TO authenticated;

-- =============================================
-- BOOKING RPC — require submitted month + working hours
-- =============================================

CREATE OR REPLACE FUNCTION public.get_available_artists_for_booking(
  p_district_name text,
  p_service_ids uuid[],
  p_appointment_date date,
  p_appointment_time text,
  p_duration_minutes integer,
  p_buffer_minutes integer DEFAULT 30,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  username text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_district_id uuid;
  v_required_services integer;
  v_new_start integer;
  v_new_end integer;
  v_appt_end integer;
  v_year_month date;
BEGIN
  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  SELECT d.id
  INTO v_district_id
  FROM public.districts d
  WHERE d.name = p_district_name
    AND d.is_active = true
  LIMIT 1;

  IF v_district_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT sid)::integer
  INTO v_required_services
  FROM unnest(p_service_ids) AS sid;

  v_new_start := public.appointment_time_to_minutes(p_appointment_time);
  v_appt_end := v_new_start + p_duration_minutes;
  v_new_end := v_appt_end + p_buffer_minutes;
  v_year_month := public.normalize_year_month(p_appointment_date);

  RETURN QUERY
  SELECT
    a.id,
    a.first_name,
    a.last_name,
    a.username
  FROM public.artists a
  INNER JOIN public.artist_districts ad
    ON ad.artist_id = a.id
   AND ad.district_id = v_district_id
  WHERE a.is_active = true
    AND (
      SELECT COUNT(DISTINCT ars.service_id)::integer
      FROM public.artist_services ars
      WHERE ars.artist_id = a.id
        AND ars.service_id = ANY (p_service_ids)
    ) = v_required_services
    -- Month must be submitted
    AND EXISTS (
      SELECT 1
      FROM public.artist_month_submissions ms
      WHERE ms.artist_id = a.id
        AND ms.year_month = v_year_month
        AND ms.status = 'submitted'
    )
    -- Resolved day must be working and contain the appointment duration
    AND EXISTS (
      SELECT 1
      FROM public.resolve_artist_day(a.id, p_appointment_date) rd
      WHERE rd.status = 'working'
        AND rd.start_time IS NOT NULL
        AND rd.end_time IS NOT NULL
        AND v_new_start >= (
          EXTRACT(HOUR FROM rd.start_time)::integer * 60
          + EXTRACT(MINUTE FROM rd.start_time)::integer
        )
        AND v_appt_end <= (
          EXTRACT(HOUR FROM rd.end_time)::integer * 60
          + EXTRACT(MINUTE FROM rd.end_time)::integer
        )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.artist_id = a.id
        AND b.appointment_date = p_appointment_date
        AND b.status <> 'cancelled'
        AND (p_exclude_booking_id IS NULL OR b.id <> p_exclude_booking_id)
        AND (
          v_new_start < (
            public.appointment_time_to_minutes(b.appointment_time)
            + public.booking_occupied_duration_minutes(b.id)
            + p_buffer_minutes
          )
          AND public.appointment_time_to_minutes(b.appointment_time) < v_new_end
        )
    )
  ORDER BY a.first_name, a.last_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_artists_for_booking(
  text,
  uuid[],
  date,
  text,
  integer,
  integer,
  uuid
) TO anon, authenticated;
