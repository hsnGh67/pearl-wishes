-- Run after creating the admin user in Supabase Authentication dashboard.
-- Replace the placeholders with your actual values.

UPDATE public.users
SET auth_id = '<auth-user-uuid-from-dashboard>'
WHERE phone = '<admin-phone-e164>' AND role = 'admin';

-- Verify:
-- SELECT id, full_name, phone, role, auth_id FROM public.users WHERE role = 'admin';
