-- Migration: create-awards-certifications
-- Stores Awards & Certifications cards used by Admin Content and the public About page.

-- 1. awards_certifications -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.awards_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  issuer TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_awards_certifications_sort_order
  ON public.awards_certifications (sort_order);

-- 2. updated_at trigger --------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_awards_certifications_updated_at ON public.awards_certifications;
CREATE TRIGGER update_awards_certifications_updated_at
  BEFORE UPDATE ON public.awards_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Row Level Security --------------------------------------------------------
ALTER TABLE public.awards_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view awards certifications" ON public.awards_certifications;
CREATE POLICY "Public can view awards certifications"
  ON public.awards_certifications
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert awards certifications" ON public.awards_certifications;
CREATE POLICY "Authenticated users can insert awards certifications"
  ON public.awards_certifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update awards certifications" ON public.awards_certifications;
CREATE POLICY "Authenticated users can update awards certifications"
  ON public.awards_certifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete awards certifications" ON public.awards_certifications;
CREATE POLICY "Authenticated users can delete awards certifications"
  ON public.awards_certifications
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Seed data -----------------------------------------------------------------
INSERT INTO public.awards_certifications (image_url, name, year, issuer, sort_order)
SELECT v.image_url, v.name, v.year, v.issuer, v.sort_order
FROM (
  VALUES
    (
      '',
      'Best Mobile Beauty Service',
      '2023',
      'London Beauty Awards',
      0
    ),
    (
      '',
      'Five Star Excellence',
      '2024',
      'UK Nail Industry Association',
      1
    )
) AS v(image_url, name, year, issuer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.awards_certifications);
