-- Migration: 012_add_artist_role
-- Allow 'artist' on users.role and rename any legacy 'technician' values.

-- Migrate legacy technician rows (if any) before tightening the CHECK
UPDATE public.users
SET role = 'artist'
WHERE role = 'technician';

-- Drop existing role CHECK (Postgres names inline CHECKs as {table}_{column}_check)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('client', 'admin', 'artist'));
