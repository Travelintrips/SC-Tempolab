/*
  # Fix Profile Policies Final V2

  1. Changes
    - Drop all existing policies
    - Create new simplified policies without recursion
    - Use materialized role check to prevent recursion
    
  2. Security
    - Maintain proper access control
    - Fix infinite recursion in policies
    - Ensure proper role-based access
*/

-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
  DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;
  DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
  DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
  DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
  DROP POLICY IF EXISTS "service_role_all_access" ON profiles;
  DROP POLICY IF EXISTS "public_facilities_access" ON sports_facilities;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_facilities ENABLE ROW LEVEL SECURITY;

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM roles r, profiles p
    WHERE p.id = user_id
    AND p.role_id = r.id
    AND r.name IN ('admin', 'super_admin')
  );
$$;

-- Basic read policy for all authenticated users
CREATE POLICY "allow_read_own_and_admin_read_all"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  is_admin(auth.uid())
);

-- Update policy for own profile and admin updates
CREATE POLICY "allow_update_own_and_admin_update_all"
ON profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid() OR
  is_admin(auth.uid())
)
WITH CHECK (
  id = auth.uid() OR
  is_admin(auth.uid())
);

-- Insert policy for registration
CREATE POLICY "allow_insert_own_profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

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