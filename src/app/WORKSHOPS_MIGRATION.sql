-- =============================================
-- WORKSHOPS TABLE MIGRATION
-- Run this in your Supabase SQL Editor
-- =============================================

-- Option 1: If you want to keep existing data (add missing columns)
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update column types if they exist but are wrong type
ALTER TABLE workshops ALTER COLUMN title SET NOT NULL;
ALTER TABLE workshops ALTER COLUMN description TYPE TEXT;
ALTER TABLE workshops ALTER COLUMN description SET NOT NULL;
ALTER TABLE workshops ALTER COLUMN duration TYPE TEXT;
ALTER TABLE workshops ALTER COLUMN duration SET NOT NULL;
ALTER TABLE workshops ALTER COLUMN class_type TYPE TEXT;
ALTER TABLE workshops ALTER COLUMN class_type SET NOT NULL;

-- Drop old columns that are not needed
ALTER TABLE workshops DROP COLUMN IF EXISTS workshop_date;
ALTER TABLE workshops DROP COLUMN IF EXISTS max_participants;
ALTER TABLE workshops DROP COLUMN IF EXISTS current_participants;
ALTER TABLE workshops DROP COLUMN IF EXISTS location;

-- Add constraint for level if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'workshops_level_check'
  ) THEN
    ALTER TABLE workshops ADD CONSTRAINT workshops_level_check 
      CHECK (level IN ('beginner', 'intermediate', 'advanced', 'intermediate_to_advanced', 'all_levels'));
  END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_workshops_is_active ON workshops(is_active);

-- Add trigger for updated_at if not exists
DROP TRIGGER IF EXISTS update_workshops_updated_at ON workshops;
CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing workshops to have display_order if they don't
UPDATE workshops SET display_order = 0 WHERE display_order IS NULL;

-- Insert the 2 initial workshops if they don't exist
INSERT INTO workshops (title, description, duration, level, class_type, highlights, is_active, display_order)
SELECT 
  'Advanced Refresh Course',
  'For experienced nail artists looking to update their skills and refine modern techniques.',
  '3 sessions · 4 hours each',
  'intermediate_to_advanced',
  'Private or small group (max 3 students)',
  ARRAY['Skill refinement', 'Modern techniques', 'Industry updates', 'Hands-on practice'],
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM workshops WHERE title = 'Advanced Refresh Course'
);

INSERT INTO workshops (title, description, duration, level, class_type, highlights, is_active, display_order)
SELECT 
  'Complete Nail Course',
  'A full programme for beginners, covering everything from foundation to professional-level skills.',
  '5 sessions · 5 hours each',
  'beginner',
  'Private or small group (max 3 students)',
  ARRAY['Foundation techniques', 'Professional skills', 'Comprehensive training', 'Hands-on practice'],
  true,
  2
WHERE NOT EXISTS (
  SELECT 1 FROM workshops WHERE title = 'Complete Nail Course'
);

-- Verify the data
SELECT id, title, level, duration, is_active, display_order FROM workshops ORDER BY display_order;
