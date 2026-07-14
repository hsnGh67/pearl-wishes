-- Migration: 005_promo_codes_rls
-- Adds Row Level Security policies for promo_codes and promo_code_usage tables

-- Enable RLS on promo tables
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Promo Codes Policies
-- Allow authenticated users (admins) to read all promo codes
CREATE POLICY "Allow authenticated users to read promo codes"
  ON promo_codes
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users (admins) to insert promo codes
CREATE POLICY "Allow authenticated users to insert promo codes"
  ON promo_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users (admins) to update promo codes
CREATE POLICY "Allow authenticated users to update promo codes"
  ON promo_codes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (admins) to delete promo codes
CREATE POLICY "Allow authenticated users to delete promo codes"
  ON promo_codes
  FOR DELETE
  TO authenticated
  USING (true);

-- Promo Code Usage Policies
-- Allow authenticated users to read all usage records
CREATE POLICY "Allow authenticated users to read promo usage"
  ON promo_code_usage
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert usage records
CREATE POLICY "Allow authenticated users to insert promo usage"
  ON promo_code_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update usage records
CREATE POLICY "Allow authenticated users to update promo usage"
  ON promo_code_usage
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete usage records
CREATE POLICY "Allow authenticated users to delete promo usage"
  ON promo_code_usage
  FOR DELETE
  TO authenticated
  USING (true);
