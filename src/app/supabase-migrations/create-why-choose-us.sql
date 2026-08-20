-- Migration: create-why-choose-us
-- Stores Why Choose Us cards used by Admin Content and the public About page.

-- 1. why_choose_us -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.why_choose_us (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_why_choose_us_sort_order
  ON public.why_choose_us (sort_order);

-- 2. updated_at trigger --------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_why_choose_us_updated_at ON public.why_choose_us;
CREATE TRIGGER update_why_choose_us_updated_at
  BEFORE UPDATE ON public.why_choose_us
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Row Level Security --------------------------------------------------------
ALTER TABLE public.why_choose_us ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view why choose us" ON public.why_choose_us;
CREATE POLICY "Public can view why choose us"
  ON public.why_choose_us
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert why choose us" ON public.why_choose_us;
CREATE POLICY "Authenticated users can insert why choose us"
  ON public.why_choose_us
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update why choose us" ON public.why_choose_us;
CREATE POLICY "Authenticated users can update why choose us"
  ON public.why_choose_us
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete why choose us" ON public.why_choose_us;
CREATE POLICY "Authenticated users can delete why choose us"
  ON public.why_choose_us
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Seed data -----------------------------------------------------------------
INSERT INTO public.why_choose_us (icon, image_url, title, description, sort_order)
SELECT v.icon, v.image_url, v.title, v.description, v.sort_order
FROM (
  VALUES
    (
      '✨',
      '',
      'Thoughtful Craft',
      'Every detail matters. From preparation to finish, each set is created with precision, balance, and intention — ensuring refined results that stand the test of time.',
      0
    ),
    (
      '💅',
      '',
      'Premium Products',
      'We work exclusively with carefully selected, high-quality products chosen for performance, safety, and nail health. Quality is never compromised, because exceptional results begin with exceptional materials.',
      1
    ),
    (
      '🎓',
      '',
      'Personal Experience',
      'No two clients are the same. We take time to understand your style, needs, and occasion, delivering a service that feels considered, personal, and never formulaic.',
      2
    )
) AS v(icon, image_url, title, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.why_choose_us);
