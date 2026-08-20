-- Migration: storage policies for Why Choose Us images
-- The `images` bucket already exists. Uploads to `why-choose-us/` fail with
-- 403 AccessDenied until storage.objects RLS allows that folder.

-- Public can view Why Choose Us images
DROP POLICY IF EXISTS "Public can view why choose us images" ON storage.objects;
CREATE POLICY "Public can view why choose us images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'why-choose-us'
  );

-- Authenticated admins can upload Why Choose Us images
DROP POLICY IF EXISTS "Authenticated users can upload why choose us images" ON storage.objects;
CREATE POLICY "Authenticated users can upload why choose us images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'why-choose-us'
  );

-- Authenticated admins can replace Why Choose Us images
DROP POLICY IF EXISTS "Authenticated users can update why choose us images" ON storage.objects;
CREATE POLICY "Authenticated users can update why choose us images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'why-choose-us'
  )
  WITH CHECK (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'why-choose-us'
  );

-- Authenticated admins can delete Why Choose Us images
DROP POLICY IF EXISTS "Authenticated users can delete why choose us images" ON storage.objects;
CREATE POLICY "Authenticated users can delete why choose us images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND split_part(name, '/', 1) = 'why-choose-us'
  );
