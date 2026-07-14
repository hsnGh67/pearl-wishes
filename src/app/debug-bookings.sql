-- DEBUG: Check everything step by step

-- 1. Do we have any users?
SELECT 'USER COUNT' as check_type, COUNT(*) as count FROM public.users;

-- 2. Do we have any services?
SELECT 'SERVICE COUNT' as check_type, COUNT(*) as count FROM public.services;

-- 3. Do we have any bookings?
SELECT 'BOOKING COUNT' as check_type, COUNT(*) as count FROM public.bookings;

-- 4. Show me ALL bookings with details
SELECT 
  b.id,
  b.appointment_date,
  b.appointment_time,
  b.status,
  b.user_id,
  b.service_id,
  u.full_name as client_name,
  s.name as service_name
FROM public.bookings b
LEFT JOIN public.users u ON b.user_id = u.id
LEFT JOIN public.services s ON b.service_id = s.id
ORDER BY b.appointment_date, b.appointment_time;

-- 5. Check the bookings table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'bookings'
ORDER BY ordinal_position;
