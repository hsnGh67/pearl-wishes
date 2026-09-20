-- Migration: 020_booking_rpcs_district_id
-- Switch booking schedule / available-artist RPCs from district name to district_id.

DROP FUNCTION IF EXISTS public.list_artists_for_services(text, uuid[]);
DROP FUNCTION IF EXISTS public.get_bookable_dates_for_artist(uuid, text, uuid[], date, date, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_bookable_dates_for_services(text, uuid[], date, date, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_free_times_for_services(text, uuid[], date, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.assign_artist_for_slot(text, uuid[], date, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_available_artists_for_booking(text, uuid[], date, text, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_available_artists_for_booking(
  p_district_id uuid,
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
  v_required_services integer;
  v_new_start integer;
  v_new_end integer;
  v_appt_end integer;
  v_year_month date;
BEGIN
  IF p_district_id IS NULL
     OR p_service_ids IS NULL
     OR array_length(p_service_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.districts d
    WHERE d.id = p_district_id
      AND d.is_active = true
  ) THEN
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
   AND ad.district_id = p_district_id
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
        AND ms.year_month = v_year_month
        AND ms.status = 'submitted'
    )
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

CREATE OR REPLACE FUNCTION public.list_artists_for_services(
  p_district_id uuid,
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
  v_required_services integer;
BEGIN
  IF p_district_id IS NULL
     OR p_service_ids IS NULL
     OR array_length(p_service_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.districts d
    WHERE d.id = p_district_id
      AND d.is_active = true
  ) THEN
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
   AND ad.district_id = p_district_id
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
  p_district_id uuid,
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
  v_required_services integer;
BEGIN
  IF p_artist_id IS NULL
     OR p_district_id IS NULL
     OR p_service_ids IS NULL
     OR array_length(p_service_ids, 1) IS NULL
     OR p_from_date IS NULL
     OR p_to_date IS NULL
     OR p_from_date > p_to_date THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.districts d
    WHERE d.id = p_district_id
      AND d.is_active = true
  ) THEN
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
     AND ad.district_id = p_district_id
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
  p_district_id uuid,
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
  v_required_services integer;
BEGIN
  IF p_district_id IS NULL
     OR p_service_ids IS NULL
     OR array_length(p_service_ids, 1) IS NULL
     OR p_from_date IS NULL
     OR p_to_date IS NULL
     OR p_from_date > p_to_date THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.districts d
    WHERE d.id = p_district_id
      AND d.is_active = true
  ) THEN
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
     AND ad.district_id = p_district_id
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

CREATE OR REPLACE FUNCTION public.get_free_times_for_services(
  p_district_id uuid,
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
  v_required_services integer;
BEGIN
  IF p_district_id IS NULL
     OR p_service_ids IS NULL
     OR array_length(p_service_ids, 1) IS NULL
     OR p_appointment_date IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.districts d
    WHERE d.id = p_district_id
      AND d.is_active = true
  ) THEN
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
   AND ad.district_id = p_district_id
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
  p_district_id uuid,
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
    p_district_id,
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

GRANT EXECUTE ON FUNCTION public.get_available_artists_for_booking(
  uuid, uuid[], date, text, integer, integer, uuid
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.list_artists_for_services(uuid, uuid[])
  TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_bookable_dates_for_artist(
  uuid, uuid, uuid[], date, date, integer, integer, uuid
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_bookable_dates_for_services(
  uuid, uuid[], date, date, integer, integer, uuid
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_free_times_for_services(
  uuid, uuid[], date, integer, integer, uuid
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.assign_artist_for_slot(
  uuid, uuid[], date, text, integer, integer, uuid
) TO anon, authenticated;
