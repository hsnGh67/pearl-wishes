-- Migration: 018_artist_unlock_own_month
-- Owning artists (and admins) can unlock their own submitted months.

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
  IF NOT public.can_manage_artist(p_artist_id) THEN
    RAISE EXCEPTION 'Not allowed to unlock this month';
  END IF;

  INSERT INTO public.artist_month_submissions (artist_id, year_month, status, submitted_at)
  VALUES (p_artist_id, v_ym, 'draft', NULL)
  ON CONFLICT (artist_id, year_month) DO UPDATE
    SET status = 'draft',
        submitted_at = NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_artist_month(uuid, date) TO authenticated;
