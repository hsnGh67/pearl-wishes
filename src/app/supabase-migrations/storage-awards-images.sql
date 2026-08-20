-- Migration: storage policies for Awards & Certifications images
-- The `images` bucket already exists. Uploads to `awards/` fail with
-- 403 AccessDenied until storage.objects RLS allows that folder.

-- Public can view Awards images
DROP POLICY IF EXISTS "Public can view awards images" ON storage.objects;
CREATE POLICY "Public can view awards images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'awards'
  );

-- Authenticated admins can upload Awards images
DROP POLICY IF EXISTS "Authenticated users can upload awards images" ON storage.objects;
CREATE POLICY "Authenticated users can upload awards images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'awards'
  );

-- Authenticated admins can replace Awards images
DROP POLICY IF EXISTS "Authenticated users can update awards images" ON storage.objects;
CREATE POLICY "Authenticated users can update awards images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'awards'
  )
  WITH CHECK (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'awards'
  );

-- Authenticated admins can delete Awards images
DROP POLICY IF EXISTS "Authenticated users can delete awards images" ON storage.objects;
CREATE POLICY "Authenticated users can delete awards images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'awards'
  );
