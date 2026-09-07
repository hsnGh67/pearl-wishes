-- Migration 009: business_settings table
-- Stores global admin-configurable settings; always a single row.

CREATE TABLE IF NOT EXISTS public.business_settings (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_buffer_minutes  integer     NOT NULL DEFAULT 30,
  buffer_effective_from  date        NOT NULL DEFAULT CURRENT_DATE,
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Seed the single config row if the table is empty
INSERT INTO public.business_settings (travel_buffer_minutes, buffer_effective_from)
SELECT 30, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Public read: booking flow (including anon visitors) needs to read the buffer
CREATE POLICY "Public read business settings"
  ON public.business_settings
  FOR SELECT
  USING (true);

-- Admin-only write: UPDATE
CREATE POLICY "Admin update business settings"
  ON public.business_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- Admin-only write: INSERT (used if row ever needs re-seeding)
CREATE POLICY "Admin insert business settings"
  ON public.business_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );
