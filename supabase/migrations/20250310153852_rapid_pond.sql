/*
  # Add admin role policies

  1. Changes
    - Add policies for admin role management
    - Simplify policy conditions for better performance
    
  2. Security
    - Add policies for admin role to manage users
    - Ensure proper access control for role management
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;

-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- Add policy for admins to update user roles
CREATE POLICY "Admins can update user roles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );