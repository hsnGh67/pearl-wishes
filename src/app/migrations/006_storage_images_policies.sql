-- Migration: Set up storage bucket "images" with correct RLS policies
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Create the bucket if it doesn't already exist, mark it public so
--    generated public URLs work without a signed URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop any existing policies on the bucket to avoid conflicts.
DROP POLICY IF EXISTS "Public can view images"         ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- 3. Allow anyone to read files (needed for public image URLs on the website).
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- 4. Allow any logged-in user to upload.
--    The admin panel already gates access to admins only, so auth.role() =
--    'authenticated' is the right level here without a heavier join.
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

-- 5. Allow logged-in users to replace (update) files they uploaded.
CREATE POLICY "Authenticated users can update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

-- 6. Allow logged-in users to delete files.
CREATE POLICY "Authenticated users can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );
