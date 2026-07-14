-- Migration: Update workshop_bookings table for new booking flow
-- This adds columns needed for the workshop reservation system

-- Add new columns
ALTER TABLE workshop_bookings
  ADD COLUMN IF NOT EXISTS workshop_title TEXT,
  ADD COLUMN IF NOT EXISTS workshop_duration TEXT,
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS preferred_month TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'scheduled', 'completed', 'cancelled'));

-- Update booking_status check constraint to include new statuses
ALTER TABLE workshop_bookings
  DROP CONSTRAINT IF EXISTS workshop_bookings_booking_status_check;

ALTER TABLE workshop_bookings
  ADD CONSTRAINT workshop_bookings_booking_status_check
  CHECK (booking_status IN ('pending', 'confirmed', 'scheduled', 'completed', 'cancelled'));

-- Make workshop_id optional (for direct bookings without workshop in system)
ALTER TABLE workshop_bookings
  ALTER COLUMN workshop_id DROP NOT NULL;

-- Make participant_name, participant_email non-required since we use different fields
ALTER TABLE workshop_bookings
  ALTER COLUMN participant_name DROP NOT NULL,
  ALTER COLUMN participant_email DROP NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_status ON workshop_bookings(status);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_scheduled_date ON workshop_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_preferred_month ON workshop_bookings(preferred_month);

-- Comment
COMMENT ON COLUMN workshop_bookings.workshop_title IS 'Workshop name at time of booking';
COMMENT ON COLUMN workshop_bookings.workshop_duration IS 'Workshop duration description';
COMMENT ON COLUMN workshop_bookings.base_price IS 'Base reservation fee paid upfront';
COMMENT ON COLUMN workshop_bookings.preferred_month IS 'Month user prefers (june, july, august, september)';
COMMENT ON COLUMN workshop_bookings.whatsapp_number IS 'WhatsApp number for coordination';
COMMENT ON COLUMN workshop_bookings.email IS 'Email address for confirmation';
COMMENT ON COLUMN workshop_bookings.notes IS 'Additional notes from participant';
COMMENT ON COLUMN workshop_bookings.scheduled_date IS 'Final confirmed workshop date (set via WhatsApp)';
COMMENT ON COLUMN workshop_bookings.receipt_number IS 'Receipt number from booking';
COMMENT ON COLUMN workshop_bookings.status IS 'New status field (pending/confirmed/scheduled/completed/cancelled)';
