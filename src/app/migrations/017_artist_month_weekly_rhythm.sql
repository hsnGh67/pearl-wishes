-- Migration: 017_artist_month_weekly_rhythm
-- Month-scoped weekly rhythm overrides; default artist_weekly_rhythm stays global.
-- Resolve order: day override > month weekly rhythm > default weekly rhythm.

-- =============================================
-- TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.artist_month_weekly_rhythm (
  artist_id   uuid NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  year_month  date NOT NULL,
  dow         smallint NOT NULL,
  is_working  boolean NOT NULL DEFAULT false,
  start_time  time NOT NULL DEFAULT '10:00',
  end_time    time NOT NULL DEFAULT '18:00',
  PRIMARY KEY (artist_id, year_month, dow),
  CONSTRAINT artist_month_weekly_rhythm_dow_check CHECK (dow >= 0 AND dow <= 6),
  CONSTRAINT artist_month_weekly_rhythm_times_check CHECK (start_time < end_time),
  CONSTRAINT artist_month_weekly_rhythm_year_month_check CHECK (
    year_month = date_trunc('month', year_month)::date
  )
);

CREATE INDEX IF NOT EXISTS idx_artist_month_weekly_rhythm_artist_month
  ON public.artist_month_weekly_rhythm (artist_id, year_month);

ALTER TABLE public.artist_month_weekly_rhythm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Panel select artist_month_weekly_rhythm" ON public.artist_month_weekly_rhythm;
CREATE POLICY "Panel select artist_month_weekly_rhythm"
  ON public.artist_month_weekly_rhythm FOR SELECT
  USING (public.is_panel_staff());

DROP POLICY IF EXISTS "Manage artist_month_weekly_rhythm" ON public.artist_month_weekly_rhythm;
CREATE POLICY "Manage artist_month_weekly_rhythm"
  ON public.artist_month_weekly_rhythm FOR ALL
  USING (public.can_manage_artist(artist_id))
  WITH CHECK (public.can_manage_artist(artist_id));

-- =============================================
-- resolve_artist_day: day > month rhythm > default
-- =============================================

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
  v_override     public.artist_day_overrides%ROWTYPE;
  v_month_rhythm public.artist_month_weekly_rhythm%ROWTYPE;
  v_rhythm       public.artist_weekly_rhythm%ROWTYPE;
  v_dow          smallint;
  v_ym           date;
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
  v_ym := public.normalize_year_month(p_work_date);

  SELECT *
  INTO v_month_rhythm
  FROM public.artist_month_weekly_rhythm
  WHERE artist_id = p_artist_id
    AND year_month = v_ym
    AND dow = v_dow;

  IF FOUND THEN
    status := CASE WHEN v_month_rhythm.is_working THEN 'working' ELSE 'off' END;
    start_time := v_month_rhythm.start_time;
    end_time := v_month_rhythm.end_time;
    RETURN NEXT;
    RETURN;
  END IF;

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

  status := 'off';
  start_time := NULL;
  end_time := NULL;
  RETURN NEXT;
END;
$$;

-- =============================================
-- get_artist_availability: include month_rhythm
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
  v_has_month_rhythm boolean;
  v_result jsonb;
BEGIN
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to view availability for this artist';
  END IF;

  PERFORM public.ensure_artist_weekly_rhythm(p_artist_id);

  SELECT * INTO v_month
  FROM public.artist_month_submissions
  WHERE artist_id = p_artist_id AND year_month = v_ym;

  SELECT EXISTS (
    SELECT 1
    FROM public.artist_month_weekly_rhythm mr
    WHERE mr.artist_id = p_artist_id
      AND mr.year_month = v_ym
  ) INTO v_has_month_rhythm;

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
    'month_rhythm', CASE
      WHEN NOT v_has_month_rhythm THEN '[]'::jsonb
      ELSE COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'dow', mr.dow,
            'is_working', mr.is_working,
            'start_time', to_char(mr.start_time, 'HH24:MI'),
            'end_time', to_char(mr.end_time, 'HH24:MI')
          )
          ORDER BY CASE mr.dow WHEN 0 THEN 7 ELSE mr.dow END
        )
        FROM public.artist_month_weekly_rhythm mr
        WHERE mr.artist_id = p_artist_id
          AND mr.year_month = v_ym
      ), '[]'::jsonb)
    END,
    'has_month_rhythm', v_has_month_rhythm,
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

-- =============================================
-- Upsert month weekly rhythm (does not touch defaults)
-- =============================================

CREATE OR REPLACE FUNCTION public.upsert_artist_month_weekly_rhythm(
  p_artist_id uuid,
  p_year_month date,
  p_days jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ym date := public.normalize_year_month(p_year_month);
  v_day jsonb;
  v_dow smallint;
  v_is_working boolean;
  v_start time;
  v_end time;
BEGIN
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to update month rhythm for this artist';
  END IF;

  IF NOT public.artist_month_is_writable(p_artist_id, v_ym) THEN
    RAISE EXCEPTION 'Month is submitted; unlock before editing';
  END IF;

  IF p_days IS NULL OR jsonb_typeof(p_days) <> 'array' OR jsonb_array_length(p_days) <> 7 THEN
    RAISE EXCEPTION 'p_days must be a JSON array of 7 day objects';
  END IF;

  PERFORM public.ensure_artist_month_draft(p_artist_id, v_ym);
  PERFORM public.ensure_artist_weekly_rhythm(p_artist_id);

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

    INSERT INTO public.artist_month_weekly_rhythm (
      artist_id, year_month, dow, is_working, start_time, end_time
    )
    VALUES (p_artist_id, v_ym, v_dow, v_is_working, v_start, v_end)
    ON CONFLICT (artist_id, year_month, dow) DO UPDATE
      SET is_working = EXCLUDED.is_working,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time;
  END LOOP;
END;
$$;

-- Clear month weekly rhythm (fall back to defaults) + clear day overrides
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

  DELETE FROM public.artist_month_weekly_rhythm
  WHERE artist_id = p_artist_id
    AND year_month = v_ym;

  DELETE FROM public.artist_day_overrides
  WHERE artist_id = p_artist_id
    AND work_date >= v_ym
    AND work_date < (v_ym + interval '1 month')::date;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_artist_month_weekly_rhythm(uuid, date, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.upsert_artist_month_weekly_rhythm(uuid, date, jsonb) TO authenticated;
