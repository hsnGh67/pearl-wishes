-- Manual Treatment Examples
-- Use these SQL snippets to manually add treatment data for testing

-- ==================================================
-- EXAMPLE 1: Add a single-person booking treatment
-- ==================================================
-- Replace 'your-booking-uuid' with an actual booking ID from your bookings table
-- Replace 'your-service-uuid' with an actual service ID from your services table

INSERT INTO booking_treatments (
  booking_id,
  service_id,
  person_name,
  service_name,
  price,
  duration,
  status
) VALUES (
  'your-booking-uuid',
  'your-service-uuid',
  'Sarah Johnson',
  'Gel Manicure',
  45,
  75,
  'active'
);


-- ==================================================
-- EXAMPLE 2: Add multi-person treatment (2 people)
-- ==================================================

INSERT INTO booking_treatments (
  booking_id,
  service_id,
  person_name,
  service_name,
  price,
  duration,
  status
) VALUES 
  (
    'your-booking-uuid',
    'your-service-uuid',
    'Sarah Johnson',
    'Gel Manicure',
    45,
    75,
    'active'
  ),
  (
    'your-booking-uuid',
    'your-service-uuid',
    'Emily Chen',
    'Classic Pedicure',
    45,
    60,
    'active'
  );


-- ==================================================
-- EXAMPLE 3: Find your booking and service IDs
-- ==================================================

-- Get recent booking IDs
SELECT 
  id as booking_id,
  customer_name,
  appointment_date,
  appointment_time,
  status
FROM bookings
WHERE status != 'cancelled'
ORDER BY created_at DESC
LIMIT 10;

-- Get available service IDs
SELECT 
  id as service_id,
  name,
  price,
  duration
FROM services
ORDER BY name;


-- ==================================================
-- EXAMPLE 4: Add treatments using actual IDs
-- ==================================================
-- Step 1: Copy a booking_id from the first query above
-- Step 2: Copy a service_id from the second query above
-- Step 3: Run this insert with your actual values

-- INSERT INTO booking_treatments (
--   booking_id,
--   service_id,
--   person_name,
--   service_name,
--   price,
--   duration,
--   status
-- ) VALUES (
--   '11111111-1111-1111-1111-111111111111', -- Replace with actual booking_id
--   '22222222-2222-2222-2222-222222222222', -- Replace with actual service_id
--   'Jessica Williams',
--   'Luxury Manicure-gel',
--   55,
--   90,
--   'active'
-- );


-- ==================================================
-- EXAMPLE 5: Verify your treatments
-- ==================================================

-- See all treatments
SELECT 
  bt.id,
  bt.person_name,
  bt.service_name,
  bt.price,
  bt.duration,
  bt.status,
  b.customer_name,
  b.appointment_date
FROM booking_treatments bt
JOIN bookings b ON b.id = bt.booking_id
ORDER BY b.appointment_date DESC, bt.created_at;

-- See bookings with treatment counts
SELECT 
  b.id,
  b.customer_name,
  b.appointment_date,
  b.appointment_time,
  COUNT(bt.id) as num_treatments,
  STRING_AGG(bt.person_name || ' - ' || bt.service_name, ', ') as all_treatments
FROM bookings b
LEFT JOIN booking_treatments bt ON bt.booking_id = b.id
WHERE b.status != 'cancelled'
GROUP BY b.id, b.customer_name, b.appointment_date, b.appointment_time
ORDER BY b.appointment_date DESC
LIMIT 20;


-- ==================================================
-- EXAMPLE 6: Cancel a treatment
-- ==================================================

-- Cancel a specific treatment by ID
UPDATE booking_treatments
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE id = 'your-treatment-uuid';


-- ==================================================
-- EXAMPLE 7: Delete all test treatments (careful!)
-- ==================================================

-- Uncomment to delete ALL treatments (use with caution!)
-- DELETE FROM booking_treatments;


-- ==================================================
-- EXAMPLE 8: Add treatments to the most recent booking
-- ==================================================

-- This uses a subquery to get the latest booking automatically
INSERT INTO booking_treatments (
  booking_id,
  service_id,
  person_name,
  service_name,
  price,
  duration,
  status
)
SELECT 
  (SELECT id FROM bookings WHERE status != 'cancelled' ORDER BY created_at DESC LIMIT 1) as booking_id,
  (SELECT id FROM services ORDER BY RANDOM() LIMIT 1) as service_id,
  'Test Person 1',
  'Gel Manicure',
  45,
  75,
  'active'
UNION ALL
SELECT 
  (SELECT id FROM bookings WHERE status != 'cancelled' ORDER BY created_at DESC LIMIT 1) as booking_id,
  (SELECT id FROM services ORDER BY RANDOM() LIMIT 1) as service_id,
  'Test Person 2',
  'Classic Pedicure',
  45,
  60,
  'active';


-- ==================================================
-- Quick Copy-Paste Template
-- ==================================================
-- 1. Get IDs first:
-- SELECT id FROM bookings WHERE status != 'cancelled' ORDER BY created_at DESC LIMIT 1;
-- SELECT id FROM services LIMIT 1;

-- 2. Then insert (replace the UUIDs):
-- INSERT INTO booking_treatments (booking_id, service_id, person_name, service_name, price, duration, status)
-- VALUES 
--   ('BOOKING-UUID-HERE', 'SERVICE-UUID-HERE', 'Person 1', 'Gel Manicure', 45, 75, 'active'),
--   ('BOOKING-UUID-HERE', 'SERVICE-UUID-HERE', 'Person 2', 'Pedicure', 45, 60, 'active');
