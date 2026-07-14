-- Add scheduled date and time fields to workshop_bookings table
-- This allows workshops to appear in the calendar on specific dates

ALTER TABLE workshop_bookings
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Create index for scheduled date to improve query performance
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_scheduled_date 
ON workshop_bookings(scheduled_date);

-- Add comment to clarify purpose
COMMENT ON COLUMN workshop_bookings.scheduled_date IS 'The date when the workshop is scheduled to take place';
COMMENT ON COLUMN workshop_bookings.scheduled_time IS 'The time when the workshop is scheduled to start';
