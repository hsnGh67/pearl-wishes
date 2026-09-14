-- Migration: 015_booking_artist
-- Assign nail artists to bookings + public RPC for available artists during booking.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS artist_id uuid REFERENCES public.artists (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_artist_id
  ON public.bookings (artist_id);

CREATE OR REPLACE FUNCTION public.appointment_time_to_minutes(p_time text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    (split_part(substring(p_time from 1 for 5), ':', 1)::integer * 60)
    + split_part(substring(p_time from 1 for 5), ':', 2)::integer;
$$;

CREATE OR REPLACE FUNCTION public.booking_occupied_duration_minutes(p_booking_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 60
      ELSE COALESCE(SUM(bt.duration), 0)::integer
        + GREATEST(COUNT(*)::integer - 1, 0) * 5
    END
  FROM public.booking_treatments bt
  WHERE bt.booking_id = p_booking_id
    AND bt.status = 'active';
$$;

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
  v_new_end := v_new_start + p_duration_minutes + p_buffer_minutes;

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
