-- Link Supabase Auth to app profiles
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- Role helpers for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Replace open policies on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do anything on users" ON public.users;

CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid() AND role = (SELECT role FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (public.is_admin());

CREATE POLICY "Authenticated users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth_id = auth.uid() AND role = 'client');

-- Bootstrap first admin (replace placeholders before running):
-- UPDATE public.users
-- SET auth_id = '<auth-user-uuid-from-dashboard>'
-- WHERE phone = '<admin-phone-e164>' AND role = 'admin';
