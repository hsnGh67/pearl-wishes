-- Migration: 013_artists
-- Nail artist profiles (independent of public.users) + district/service junctions.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ARTISTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.artists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     uuid UNIQUE REFERENCES auth.users (id) ON DELETE SET NULL,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  phone       text,
  email       text NOT NULL,
  username    text NOT NULL,
  notes       text NOT NULL DEFAULT '',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT artists_email_unique UNIQUE (email),
  CONSTRAINT artists_username_unique UNIQUE (username)
);

-- Case-insensitive uniqueness for username
CREATE UNIQUE INDEX IF NOT EXISTS artists_username_lower_idx
  ON public.artists (lower(username));

CREATE UNIQUE INDEX IF NOT EXISTS artists_email_lower_idx
  ON public.artists (lower(email));

CREATE INDEX IF NOT EXISTS idx_artists_auth_id
  ON public.artists (auth_id);

CREATE INDEX IF NOT EXISTS idx_artists_is_active
  ON public.artists (is_active);

DROP TRIGGER IF EXISTS update_artists_updated_at ON public.artists;
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ARTIST DISTRICTS (many-to-many)
-- =============================================
CREATE TABLE IF NOT EXISTS public.artist_districts (
  artist_id   uuid NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  district_id uuid NOT NULL REFERENCES public.districts (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (artist_id, district_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_districts_district_id
  ON public.artist_districts (district_id);

-- =============================================
-- ARTIST SERVICES (many-to-many)
-- =============================================
CREATE TABLE IF NOT EXISTS public.artist_services (
  artist_id  uuid NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (artist_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_services_service_id
  ON public.artist_services (service_id);

-- =============================================
-- RLS — admin only
-- =============================================
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_services ENABLE ROW LEVEL SECURITY;

-- artists
DROP POLICY IF EXISTS "Admin select artists" ON public.artists;
CREATE POLICY "Admin select artists"
  ON public.artists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin insert artists" ON public.artists;
CREATE POLICY "Admin insert artists"
  ON public.artists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin update artists" ON public.artists;
CREATE POLICY "Admin update artists"
  ON public.artists FOR UPDATE
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

DROP POLICY IF EXISTS "Admin delete artists" ON public.artists;
CREATE POLICY "Admin delete artists"
  ON public.artists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- artist_districts
DROP POLICY IF EXISTS "Admin select artist_districts" ON public.artist_districts;
CREATE POLICY "Admin select artist_districts"
  ON public.artist_districts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin insert artist_districts" ON public.artist_districts;
CREATE POLICY "Admin insert artist_districts"
  ON public.artist_districts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin update artist_districts" ON public.artist_districts;
CREATE POLICY "Admin update artist_districts"
  ON public.artist_districts FOR UPDATE
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

DROP POLICY IF EXISTS "Admin delete artist_districts" ON public.artist_districts;
CREATE POLICY "Admin delete artist_districts"
  ON public.artist_districts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- artist_services
DROP POLICY IF EXISTS "Admin select artist_services" ON public.artist_services;
CREATE POLICY "Admin select artist_services"
  ON public.artist_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin insert artist_services" ON public.artist_services;
CREATE POLICY "Admin insert artist_services"
  ON public.artist_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin update artist_services" ON public.artist_services;
CREATE POLICY "Admin update artist_services"
  ON public.artist_services FOR UPDATE
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

DROP POLICY IF EXISTS "Admin delete artist_services" ON public.artist_services;
CREATE POLICY "Admin delete artist_services"
  ON public.artist_services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'admin'
    )
  );
