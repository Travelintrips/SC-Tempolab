/*
  # Add Super Admin Role and Policies

  1. New Roles
    - Add 'super_admin' role
    - Add 'admin' role if not exists

  2. Security
    - Update RLS policies for profiles table to allow role management
    - Add policies for super admin access
*/

-- Insert roles if they don't exist
INSERT INTO roles (name)
SELECT 'super_admin'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin');

INSERT INTO roles (name)
SELECT 'admin'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can update non-super-admin roles" ON profiles;
    DROP POLICY IF EXISTS "Super admins can update all roles" ON profiles;
    DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Update profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile and admins to view all profiles
CREATE POLICY "Users can view profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND
    p.role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'super_admin'))
  )
);

-- Allow admins to update roles (except super_admin)
CREATE POLICY "Admins can update non-super-admin roles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND
    p.role_id IN (SELECT id FROM roles WHERE name = 'admin')
  ) AND
  role_id NOT IN (SELECT id FROM roles WHERE name = 'super_admin')
);

-- Allow super_admins to update all roles
CREATE POLICY "Super admins can update all roles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND
    p.role_id IN (SELECT id FROM roles WHERE name = 'super_admin')
  )
);

-- Allow roles to be viewed by authenticated users
CREATE POLICY "Roles are viewable by authenticated users"
ON roles
FOR SELECT
TO authenticated
USING (true);