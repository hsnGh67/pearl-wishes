-- Migration: Add number_of_people column to bookings table
-- Run this in your Supabase SQL Editor

-- Add number_of_people column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS number_of_people INTEGER DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN bookings.number_of_people IS 'Number of people for this booking appointment';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name = 'number_of_people';
