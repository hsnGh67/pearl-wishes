-- Migration: create-studio-contact-and-hours
-- Stores studio phone/email/address and display business hours
-- used by Admin Content and the public About/Footer pages.

-- 1. studio_contact (singleton) ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.studio_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS studio_contact_singleton
  ON public.studio_contact ((true));

-- 2. business_hours ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  time_label TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_hours_sort_order
  ON public.business_hours (sort_order);

-- 3. updated_at triggers -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_studio_contact_updated_at ON public.studio_contact;
CREATE TRIGGER update_studio_contact_updated_at
  BEFORE UPDATE ON public.studio_contact
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_hours_updated_at ON public.business_hours;
CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security --------------------------------------------------------
ALTER TABLE public.studio_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view studio contact" ON public.studio_contact;
CREATE POLICY "Public can view studio contact"
  ON public.studio_contact
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert studio contact" ON public.studio_contact;
CREATE POLICY "Authenticated users can insert studio contact"
  ON public.studio_contact
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update studio contact" ON public.studio_contact;
CREATE POLICY "Authenticated users can update studio contact"
  ON public.studio_contact
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete studio contact" ON public.studio_contact;
CREATE POLICY "Authenticated users can delete studio contact"
  ON public.studio_contact
  FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view business hours" ON public.business_hours;
CREATE POLICY "Public can view business hours"
  ON public.business_hours
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert business hours" ON public.business_hours;
CREATE POLICY "Authenticated users can insert business hours"
  ON public.business_hours
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update business hours" ON public.business_hours;
CREATE POLICY "Authenticated users can update business hours"
  ON public.business_hours
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete business hours" ON public.business_hours;
CREATE POLICY "Authenticated users can delete business hours"
  ON public.business_hours
  FOR DELETE
  TO authenticated
  USING (true);

-- 5. Seed data -----------------------------------------------------------------
INSERT INTO public.studio_contact (phone, email, address)
SELECT '+44 20 7946 0958', 'hello@pearlwishesstudio.co.uk', 'London, United Kingdom'
WHERE NOT EXISTS (SELECT 1 FROM public.studio_contact);

INSERT INTO public.business_hours (day, time_label, sort_order)
SELECT v.day, v.time_label, v.sort_order
FROM (
  VALUES
    ('Monday', '9:00 AM – 7:00 PM', 0),
    ('Tuesday', '9:00 AM – 7:00 PM', 1),
    ('Wednesday', '9:00 AM – 7:00 PM', 2),
    ('Thursday', '9:00 AM – 8:00 PM', 3),
    ('Friday', '9:00 AM – 8:00 PM', 4),
    ('Saturday', '10:00 AM – 6:00 PM', 5),
    ('Sunday', 'Closed', 6)
) AS v(day, time_label, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.business_hours);
