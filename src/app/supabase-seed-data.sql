-- Insert sample client users
INSERT INTO public.users (email, full_name, phone, role)
VALUES 
  ('emma.johnson@example.com', 'Emma Johnson', '+44 7700 900001', 'client'),
  ('sophia.martinez@example.com', 'Sophia Martinez', '+44 7700 900002', 'client'),
  ('olivia.brown@example.com', 'Olivia Brown', '+44 7700 900003', 'client'),
  ('ava.davis@example.com', 'Ava Davis', '+44 7700 900004', 'client'),
  ('isabella.wilson@example.com', 'Isabella Wilson', '+44 7700 900005', 'client')
ON CONFLICT (email) DO NOTHING;

-- Insert sample bookings
WITH client_users AS (
  SELECT id FROM public.users WHERE role = 'client' ORDER BY created_at LIMIT 5
),
available_services AS (
  SELECT id FROM public.services ORDER BY created_at LIMIT 9
)
INSERT INTO public.bookings (
  user_id,
  service_id,
  appointment_date,
  appointment_time,
  address,
  postcode,
  district,
  total_price,
  status,
  payment_status,
  stripe_payment_intent_id
)
SELECT 
  (SELECT id FROM client_users ORDER BY random() LIMIT 1),
  (SELECT id FROM available_services ORDER BY random() LIMIT 1),
  CURRENT_DATE + (floor(random() * 30)::int),
  (ARRAY['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'])[floor(random() * 8 + 1)],
  (ARRAY['123 Park Lane, Mayfair', '45 Oxford Street, Soho', '78 Kings Road, Chelsea', '90 Camden High Street'])[floor(random() * 4 + 1)],
  (ARRAY['W1K 1BE', 'W1D 2HG', 'SW3 5XP', 'NW1 8AB'])[floor(random() * 4 + 1)],
  (ARRAY['Westminster', 'Kensington', 'Camden', 'Chelsea'])[floor(random() * 4 + 1)],
  45.00 + (random() * 100),
  (ARRAY['confirmed', 'confirmed', 'confirmed', 'pending', 'completed'])[floor(random() * 5 + 1)],
  (ARRAY['paid', 'paid', 'pending'])[floor(random() * 3 + 1)],
  'pi_' || substr(md5(random()::text), 1, 24)
FROM generate_series(1, 25);
