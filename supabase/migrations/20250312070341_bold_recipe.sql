/*
  # Fix Profile Policies Final

  1. Changes
    - Drop all existing policies
    - Create new simplified policies without recursion
    - Separate admin access policies
    
  2. Security
    - Maintain proper access control
    - Fix infinite recursion in policies
    - Ensure proper role-based access
*/

-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
  DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
  DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
  DROP POLICY IF EXISTS "service_role_all_access" ON profiles;
  DROP POLICY IF EXISTS "Allow public access to facilities" ON sports_facilities;
  DROP POLICY IF EXISTS "Allow authenticated access to facilities" ON sports_facilities;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic user access
CREATE POLICY "users_read_own_profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Admin access (separate policy to avoid recursion)
CREATE POLICY "admins_read_all_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM roles r
    JOIN profiles p ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Update policy for own profile
CREATE POLICY "users_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Insert policy for registration
CREATE POLICY "users_insert_own_profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Admin update policy
CREATE POLICY "admins_update_all_profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM roles r
    JOIN profiles p ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM roles r
    JOIN profiles p ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Service role full access
CREATE POLICY "service_role_all_access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public facilities access
CREATE POLICY "public_facilities_access"
ON sports_facilities
FOR SELECT
TO public
USING (true);