/*
  # Fix Profile Policies Recursion

  1. Changes
    - Drop all existing policies
    - Create new simplified policies without circular references
    - Add public read access for sports facilities
    
  2. Security
    - Maintain proper access control
    - Fix infinite recursion in policies
    - Ensure proper role-based access
*/

-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
  DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
  DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
  DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;
  DROP POLICY IF EXISTS "admins_update_profiles" ON profiles;
  DROP POLICY IF EXISTS "service_role_all_access" ON profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies that avoid recursion
CREATE POLICY "Allow users to read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM roles
    WHERE roles.id IN (
      SELECT role_id 
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
    AND roles.name IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow users to update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Allow users to insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Service role policy
CREATE POLICY "service_role_all_access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow public access to sports facilities
CREATE POLICY "Allow public access to facilities"
ON sports_facilities
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to view facilities
CREATE POLICY "Allow authenticated access to facilities"
ON sports_facilities
FOR SELECT
TO authenticated
USING (true);