-- Create booking_treatments table for multi-person booking support
-- This table stores individual treatments/services for each person within a booking

CREATE TABLE IF NOT EXISTS public.booking_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  person_name VARCHAR(100) NOT NULL,
  service_name TEXT NOT NULL, -- Store name in case service is deleted
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_booking_treatments_booking_id ON public.booking_treatments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_treatments_service_id ON public.booking_treatments(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_treatments_status ON public.booking_treatments(status);

-- Enable Row Level Security
ALTER TABLE public.booking_treatments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON public.booking_treatments;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.booking_treatments;
DROP POLICY IF EXISTS "Enable update for all users" ON public.booking_treatments;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.booking_treatments;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON public.booking_treatments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.booking_treatments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.booking_treatments
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.booking_treatments
  FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_booking_treatments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_booking_treatments_updated_at ON public.booking_treatments;
CREATE TRIGGER update_booking_treatments_updated_at
  BEFORE UPDATE ON public.booking_treatments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_treatments_updated_at();
