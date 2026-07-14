-- Migration: Add address fields to users table
-- Run this in your Supabase SQL Editor

-- Add address columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postcode VARCHAR(10),
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN users.address IS 'Full street address (e.g., 123 High Street)';
COMMENT ON COLUMN users.postcode IS 'Postal code (e.g., N2 0BP)';
COMMENT ON COLUMN users.district IS 'District/area (e.g., East Finchley, Hampstead)';

-- Verify the columns were added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('address', 'postcode', 'district');
