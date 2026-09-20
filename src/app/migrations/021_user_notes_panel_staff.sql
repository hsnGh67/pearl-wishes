-- Migration 021: panel staff access to user_notes
-- Artists (and admins) need to view and manage shared client notes
-- from the Artist Panel Client History UI.

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Panel staff select user_notes" ON public.user_notes;
CREATE POLICY "Panel staff select user_notes"
  ON public.user_notes
  FOR SELECT
  TO authenticated
  USING (public.is_panel_staff());

DROP POLICY IF EXISTS "Panel staff insert user_notes" ON public.user_notes;
CREATE POLICY "Panel staff insert user_notes"
  ON public.user_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Panel staff update user_notes" ON public.user_notes;
CREATE POLICY "Panel staff update user_notes"
  ON public.user_notes
  FOR UPDATE
  TO authenticated
  USING (public.is_panel_staff())
  WITH CHECK (public.is_panel_staff());

DROP POLICY IF EXISTS "Panel staff delete user_notes" ON public.user_notes;
CREATE POLICY "Panel staff delete user_notes"
  ON public.user_notes
  FOR DELETE
  TO authenticated
  USING (public.is_panel_staff());
