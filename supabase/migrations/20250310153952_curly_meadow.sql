/*
  # Fix Profile Policies

  1. Changes
    - Drop and recreate policies for profiles table
    - Fix duplicate policy issue
    
  2. Security
    - Maintain proper access control
    - Ensure users can only access their own profiles
    - Allow admins to access all profiles
*/

-- First, drop existing policies on the profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Basic policy for users to read their own profile
CREATE POLICY "profiles_read_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM roles 
      WHERE roles.id = role_id 
      AND roles.name IN ('admin', 'super_admin')
    )
  );

-- Policy for users to update their own profile
CREATE POLICY "profiles_update_policy"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM roles 
      WHERE roles.id = role_id 
      AND roles.name IN ('admin', 'super_admin')
    )
  );

-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;