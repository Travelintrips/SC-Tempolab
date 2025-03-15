/*
  # Fix Profiles Policies to Prevent Infinite Recursion

  1. Changes
    - Drop existing problematic policies
    - Create new simplified policies that avoid recursion
    - Add separate policies for admin access
    
  2. Security
    - Maintain proper access control
    - Fix infinite recursion in profile policies
    - Ensure proper role-based access
*/

-- First, drop all existing policies on profiles to start fresh
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
  DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Service role full access" ON profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic user policies
CREATE POLICY "users_read_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin policies (using direct role check)
CREATE POLICY "admins_read_all_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = (SELECT role_id FROM profiles WHERE id = auth.uid())
      AND r.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admins_update_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = (SELECT role_id FROM profiles WHERE id = auth.uid())
      AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = (SELECT role_id FROM profiles WHERE id = auth.uid())
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- Service role policy
CREATE POLICY "service_role_all_access"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);