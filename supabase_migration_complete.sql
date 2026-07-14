-- Complete Migration: Add all missing columns to database tables
-- Run this in your Supabase SQL Editor

-- ============================================
-- USERS TABLE - Add address fields
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postcode VARCHAR(10),
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

COMMENT ON COLUMN users.address IS 'Full street address';
COMMENT ON COLUMN users.postcode IS 'Postal code';
COMMENT ON COLUMN users.district IS 'District/area';

-- ============================================
-- SERVICES TABLE - Add is_add_on field
-- ============================================
ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_add_on BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN services.is_add_on IS 'Whether this service is an add-on to other services';

-- ============================================
-- BOOKINGS TABLE - Verify existing columns
-- ============================================
-- Required columns (should already exist):
-- - id (UUID, primary key)
-- - user_id (UUID, foreign key to users)
-- - service_id (UUID, foreign key to services)
-- - appointment_date (DATE or TEXT)
-- - appointment_time (TEXT, format HH:MM)
-- - address (TEXT)
-- - postcode (VARCHAR)
-- - district (VARCHAR)
-- - status (TEXT, enum: pending/confirmed/in_progress/completed/cancelled/no_show)
-- - payment_status (TEXT, enum: pending/paid/failed/refunded)
-- - total_price (NUMERIC or DECIMAL)
-- - notes (TEXT, nullable)
-- - stripe_payment_intent_id (TEXT, nullable)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- ============================================
-- BOOKING_TREATMENTS TABLE - Verify structure
-- ============================================
-- Required columns (should already exist):
-- - id (UUID, primary key)
-- - booking_id (UUID, foreign key to bookings)
-- - service_id (UUID, foreign key to services)
-- - person_name (TEXT) - Name/identifier for the person receiving this treatment
-- - service_name (TEXT) - Cached service name in case service is deleted
-- - price (NUMERIC or DECIMAL) - Price at time of booking
-- - duration (INTEGER) - Duration in minutes
-- - status (TEXT, enum: active/cancelled)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- ============================================
-- Verification Queries
-- ============================================

-- Verify users table columns
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('address', 'postcode', 'district')
ORDER BY column_name;

-- Verify services table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'services'
AND column_name = 'is_add_on';

-- Verify bookings table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- Verify booking_treatments table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'booking_treatments'
ORDER BY ordinal_position;
