-- Add sample treatment data to existing bookings
-- This creates 1-3 treatments per booking for testing multi-person functionality

-- Insert sample treatments for existing bookings
-- This uses a random selection approach to create realistic test data

DO $$
DECLARE
  booking_record RECORD;
  service_record RECORD;
  num_people INTEGER;
  person_names TEXT[] := ARRAY[
    'Sarah Johnson',
    'Emily Chen',
    'Jessica Williams',
    'Rachel Martinez',
    'Amanda Taylor',
    'Sophie Anderson',
    'Olivia Brown',
    'Emma Davis',
    'Ava Wilson',
    'Isabella Moore'
  ];
  service_names TEXT[] := ARRAY['Gel Manicure', 'Classic Pedicure', 'Luxury Manicure & Pedicure', 'Gel Nail Extensions', 'Nail Art'];
  prices DECIMAL[] := ARRAY[35, 45, 75, 55, 25];
  durations INTEGER[] := ARRAY[45, 60, 90, 90, 30];
  random_idx INTEGER;
  random_person INTEGER;
BEGIN
  -- Loop through all active bookings
  FOR booking_record IN 
    SELECT id, status FROM bookings WHERE status != 'cancelled' ORDER BY created_at DESC
  LOOP
    -- Random number of people (1-3)
    num_people := 1 + floor(random() * 3)::INTEGER;
    
    -- Get a random service for this booking
    SELECT id INTO service_record FROM services ORDER BY RANDOM() LIMIT 1;
    
    -- Create treatments for each person
    FOR i IN 1..num_people LOOP
      random_idx := 1 + floor(random() * 5)::INTEGER;
      random_person := 1 + floor(random() * 10)::INTEGER;
      
      INSERT INTO booking_treatments (
        booking_id,
        service_id,
        person_name,
        service_name,
        price,
        duration,
        status,
        created_at,
        updated_at
      ) VALUES (
        booking_record.id,
        service_record.id,
        person_names[random_person],
        service_names[random_idx],
        prices[random_idx],
        durations[random_idx],
        'active',
        NOW(),
        NOW()
      );
    END LOOP;
    
    RAISE NOTICE 'Added % treatment(s) for booking %', num_people, booking_record.id;
  END LOOP;
  
  RAISE NOTICE 'Sample treatment data added successfully!';
END $$;

-- Verify the data
SELECT 
  b.id as booking_id,
  b.customer_name,
  b.booking_date,
  COUNT(bt.id) as num_treatments,
  STRING_AGG(bt.person_name || ' - ' || bt.service_name, ', ') as treatments
FROM bookings b
LEFT JOIN booking_treatments bt ON bt.booking_id = b.id
WHERE b.status != 'cancelled'
GROUP BY b.id, b.customer_name, b.booking_date
ORDER BY b.booking_date DESC
LIMIT 10;
