-- Migration 010: preserve previous buffer value on update
-- Allows the booking engine to apply the old buffer for dates before the effective date.

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS previous_travel_buffer_minutes integer NOT NULL DEFAULT 30;
