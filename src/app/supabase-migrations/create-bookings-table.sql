-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(5) NOT NULL, -- Format: HH:MM
  address TEXT NOT NULL,
  postcode VARCHAR(10) NOT NULL,
  district VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON public.bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read all bookings (for admin)
CREATE POLICY "Allow authenticated users to read bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert bookings
CREATE POLICY "Allow authenticated users to insert bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update bookings
CREATE POLICY "Allow authenticated users to update bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete bookings
CREATE POLICY "Allow authenticated users to delete bookings"
  ON public.bookings
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample bookings data (optional - for testing)
INSERT INTO public.bookings (user_id, service_id, appointment_date, appointment_time, address, postcode, district, status, payment_status, total_price, notes)
SELECT 
  u.id,
  s.id,
  CURRENT_DATE + (INTERVAL '1 day' * (row_number() OVER () % 30)),
  CASE (row_number() OVER () % 8)
    WHEN 0 THEN '09:00'
    WHEN 1 THEN '10:30'
    WHEN 2 THEN '11:00'
    WHEN 3 THEN '13:00'
    WHEN 4 THEN '14:30'
    WHEN 5 THEN '15:00'
    WHEN 6 THEN '16:00'
    ELSE '17:00'
  END,
  CASE (row_number() OVER () % 5)
    WHEN 0 THEN '123 Kensington High Street'
    WHEN 1 THEN '45 Kings Road, Chelsea'
    WHEN 2 THEN '78 Notting Hill Gate'
    WHEN 3 THEN '12 Berkeley Square, Mayfair'
    ELSE '56 Sloane Street'
  END,
  CASE (row_number() OVER () % 5)
    WHEN 0 THEN 'SW7 1LT'
    WHEN 1 THEN 'SW3 5UE'
    WHEN 2 THEN 'W11 2HE'
    WHEN 3 THEN 'W1J 6BR'
    ELSE 'SW1X 9NB'
  END,
  CASE (row_number() OVER () % 5)
    WHEN 0 THEN 'Kensington'
    WHEN 1 THEN 'Chelsea'
    WHEN 2 THEN 'Notting Hill'
    WHEN 3 THEN 'Mayfair'
    ELSE 'Knightsbridge'
  END,
  CASE (row_number() OVER () % 4)
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'confirmed'
    WHEN 2 THEN 'completed'
    ELSE 'confirmed'
  END,
  CASE (row_number() OVER () % 3)
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'paid'
    ELSE 'paid'
  END,
  s.price,
  CASE (row_number() OVER () % 3)
    WHEN 0 THEN 'Please bring nail polish remover'
    WHEN 1 THEN 'Client prefers gel colors'
    ELSE NULL
  END
FROM 
  (SELECT id FROM public.users WHERE role = 'client' LIMIT 10) u,
  (SELECT id, price FROM public.services LIMIT 5) s
WHERE NOT EXISTS (SELECT 1 FROM public.bookings)
LIMIT 20;
