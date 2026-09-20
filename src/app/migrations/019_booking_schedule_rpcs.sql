-- Migration: 019_booking_schedule_rpcs
-- RPCs for artist-first / date-first booking calendars, free times, and auto-assign.

CREATE OR REPLACE FUNCTION public.minutes_to_appointment_time(p_minutes integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    lpad((p_minutes / 60)::text, 2, '0')
    || ':'
    || lpad((p_minutes % 60)::text, 2, '0');
$$;

CREATE OR REPLACE FUNCTION public.workshop_blocks_slot(
  p_work_date date,
  p_slot_start integer,
  p_slot_end integer,
  p_buffer_minutes integer
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workshop_sessions ws
    WHERE ws.date = p_work_date
      AND p_slot_start < (
        public.appointment_time_to_minutes(ws.ends_at::text)
        + p_buffer_minutes
      )
      AND public.appointment_time_to_minutes(ws.starts_at::text) < p_slot_end
  );
$$;

CREATE OR REPLACE FUNCTION public.artist_booking_blocks_slot(
  p_artist_id uuid,
  p_work_date date,
  p_slot_start integer,
  p_slot_end integer,
  p_buffer_minutes integer,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.artist_id = p_artist_id
      AND b.appointment_date = p_work_date
      AND b.status <> 'cancelled'
      AND (p_exclude_booking_id IS NULL OR b.id <> p_exclude_booking_id)
      AND p_slot_start < (
        public.appointment_time_to_minutes(b.appointment_time)
        + public.booking_occupied_duration_minutes(b.id)
        + p_buffer_minutes
      )
      AND public.appointment_time_to_minutes(b.appointment_time) < p_slot_end
  );
$$;

CREATE OR REPLACE FUNCTION public.artist_day_has_free_slot(
  p_artist_id uuid,
  p_work_date date,
  p_duration_minutes integer,
  p_buffer_minutes integer,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_start_time time;
  v_end_time time;
  v_open integer;
  v_close integer;
  v_slot integer;
  v_appt_end integer;
  v_slot_end integer;
  v_step integer;
BEGIN
  SELECT rd.status, rd.start_time, rd.end_time
  INTO v_status, v_start_time, v_end_time
  FROM public.resolve_artist_day(p_artist_id, p_work_date) rd;

  IF v_status IS DISTINCT FROM 'working'
     OR v_start_time IS NULL
     OR v_end_time IS NULL THEN
    RETURN false;
  END IF;

  v_open := EXTRACT(HOUR FROM v_start_time)::integer * 60
    + EXTRACT(MINUTE FROM v_start_time)::integer;
  v_close := EXTRACT(HOUR FROM v_end_time)::integer * 60
    + EXTRACT(MINUTE FROM v_end_time)::integer;
  v_step := GREATEST(p_buffer_minutes, 1);

  v_slot := v_open;
  WHILE v_slot + p_duration_minutes <= v_close LOOP
    v_appt_end := v_slot + p_duration_minutes;
    v_slot_end := v_appt_end + p_buffer_minutes;

    IF NOT public.artist_booking_blocks_slot(
         p_artist_id, p_work_date, v_slot, v_slot_end,
         p_buffer_minutes, p_exclude_booking_id
       )
       AND NOT public.workshop_blocks_slot(
         p_work_date, v_slot, v_slot_end, p_buffer_minutes
       )
    THEN
      RETURN true;
    END IF;

    v_slot := v_slot + v_step;
  END LOOP;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_artists_for_services(
  p_district_name text,
  p_service_ids uuid[]
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
  ORDER BY a.first_name, a.last_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_bookable_dates_for_artist(
  p_artist_id uuid,
  p_district_name text,
  p_service_ids uuid[],
  p_from_date date,
  p_to_date date,
  p_duration_minutes integer,
  p_buffer_minutes integer DEFAULT 30,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE (work_date date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_district_id uuid;
  v_required_services integer;
BEGIN
  IF p_artist_id IS NULL
     OR p_service_ids IS NULL
     OR array_length(p_service_ids, 1) IS NULL
     OR p_from_date IS NULL
     OR p_to_date IS NULL
     OR p_from_date > p_to_date THEN
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.artists a
    INNER JOIN public.artist_districts ad
      ON ad.artist_id = a.id
     AND ad.district_id = v_district_id
    WHERE a.id = p_artist_id
      AND a.is_active = true
      AND (
        SELECT COUNT(DISTINCT ars.service_id)::integer
        FROM public.artist_services ars
        WHERE ars.artist_id = a.id
          AND ars.service_id = ANY (p_service_ids)
      ) = v_required_services
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT d::date AS work_date
  FROM generate_series(p_from_date, p_to_date, interval '1 day') AS d
  WHERE EXISTS (
      SELECT 1
      FROM public.artist_month_submissions ms
      WHERE ms.artist_id = p_artist_id
        AND ms.year_month = public.normalize_year_month(d::date)
        AND ms.status = 'submitted'
    )
    AND public.artist_day_has_free_slot(
      p_artist_id,
      d::date,
      p_duration_minutes,
      p_buffer_minutes,
      p_exclude_booking_id
    )
  ORDER BY 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_bookable_dates_for_services(
  p_district_name text,
  p_service_ids uuid[],
  p_from_date date,
  p_to_date date,
  p_duration_minutes integer,
  p_buffer_minutes integer DEFAULT 30,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE (work_date date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_district_id uuid;
  v_required_services integer;
BEGIN
  IF p_service_ids IS NULL
     OR array_length(p_service_ids, 1) IS NULL
     OR p_from_date IS NULL
     OR p_to_date IS NULL
     OR p_from_date > p_to_date THEN
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

  RETURN QUERY
  SELECT d::date AS work_date
  FROM generate_series(p_from_date, p_to_date, interval '1 day') AS d
  WHERE EXISTS (
    SELECT 1
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
      AND EXISTS (
        SELECT 1
        FROM public.artist_month_submissions ms
        WHERE ms.artist_id = a.id
          AND ms.year_month = public.normalize_year_month(d::date)
          AND ms.status = 'submitted'
      )
      AND public.artist_day_has_free_slot(
        a.id,
        d::date,
        p_duration_minutes,
        p_buffer_minutes,
        p_exclude_booking_id
      )
  )
  ORDER BY 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_free_times_for_artist(
  p_artist_id uuid,
  p_appointment_date date,
  p_duration_minutes integer,
  p_buffer_minutes integer DEFAULT 30,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE (slot_time text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_start_time time;
  v_end_time time;
  v_open integer;
  v_close integer;
  v_slot integer;
  v_appt_end integer;
  v_slot_end integer;
  v_step integer;
BEGIN
  IF p_artist_id IS NULL OR p_appointment_date IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.artist_month_submissions ms
    WHERE ms.artist_id = p_artist_id
      AND ms.year_month = public.normalize_year_month(p_appointment_date)
      AND ms.status = 'submitted'
  ) THEN
    RETURN;
  END IF;

  SELECT rd.status, rd.start_time, rd.end_time
  INTO v_status, v_start_time, v_end_time
  FROM public.resolve_artist_day(p_artist_id, p_appointment_date) rd;

  IF v_status IS DISTINCT FROM 'working'
     OR v_start_time IS NULL
     OR v_end_time IS NULL THEN
    RETURN;
  END IF;

  v_open := EXTRACT(HOUR FROM v_start_time)::integer * 60
    + EXTRACT(MINUTE FROM v_start_time)::integer;
  v_close := EXTRACT(HOUR FROM v_end_time)::integer * 60
    + EXTRACT(MINUTE FROM v_end_time)::integer;
  v_step := GREATEST(p_buffer_minutes, 1);

  v_slot := v_open;
  WHILE v_slot + p_duration_minutes <= v_close LOOP
    v_appt_end := v_slot + p_duration_minutes;
    v_slot_end := v_appt_end + p_buffer_minutes;

    IF NOT public.artist_booking_blocks_slot(
         p_artist_id, p_appointment_date, v_slot, v_slot_end,
         p_buffer_minutes, p_exclude_booking_id
       )
       AND NOT public.workshop_blocks_slot(
         p_appointment_date, v_slot, v_slot_end, p_buffer_minutes
       )
    THEN
      slot_time := public.minutes_to_appointment_time(v_slot);
      RETURN NEXT;
    END IF;

    v_slot := v_slot + v_step;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_free_times_for_services(
  p_district_name text,
  p_service_ids uuid[],
  p_appointment_date date,
  p_duration_minutes integer,
  p_buffer_minutes integer DEFAULT 30,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE (slot_time text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_district_id uuid;
  v_required_services integer;
BEGIN
  IF p_service_ids IS NULL
     OR array_length(p_service_ids, 1) IS NULL
     OR p_appointment_date IS NULL THEN
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

  RETURN QUERY
  SELECT DISTINCT t.slot_time
  FROM public.artists a
  INNER JOIN public.artist_districts ad
    ON ad.artist_id = a.id
   AND ad.district_id = v_district_id
  CROSS JOIN LATERAL public.get_free_times_for_artist(
    a.id,
    p_appointment_date,
    p_duration_minutes,
    p_buffer_minutes,
    p_exclude_booking_id
  ) AS t
  WHERE a.is_active = true
    AND (
      SELECT COUNT(DISTINCT ars.service_id)::integer
      FROM public.artist_services ars
      WHERE ars.artist_id = a.id
        AND ars.service_id = ANY (p_service_ids)
    ) = v_required_services
  ORDER BY 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_artist_for_slot(
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
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.first_name,
    a.last_name,
    a.username
  FROM public.get_available_artists_for_booking(
    p_district_name,
    p_service_ids,
    p_appointment_date,
    p_appointment_time,
    p_duration_minutes,
    p_buffer_minutes,
    p_exclude_booking_id
  ) a
  ORDER BY (
    SELECT COUNT(*)::integer
    FROM public.bookings b
    WHERE b.artist_id = a.id
      AND b.appointment_date = p_appointment_date
      AND b.status <> 'cancelled'
  ) ASC,
  random()
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.minutes_to_appointment_time(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.workshop_blocks_slot(date, integer, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.artist_booking_blocks_slot(uuid, date, integer, integer, integer, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.artist_day_has_free_slot(uuid, date, integer, integer, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_artists_for_services(text, uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bookable_dates_for_artist(uuid, text, uuid[], date, date, integer, integer, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bookable_dates_for_services(text, uuid[], date, date, integer, integer, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_free_times_for_artist(uuid, date, integer, integer, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_free_times_for_services(text, uuid[], date, integer, integer, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_artist_for_slot(text, uuid[], date, text, integer, integer, uuid) TO anon, authenticated;
