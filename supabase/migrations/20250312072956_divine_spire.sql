/*
  # Fix Booking Policies and Add Admin Access

  1. Changes
    - Add policies for admin booking management
    - Fix booking status update permissions
    - Add booking deletion permissions
    
  2. Security
    - Enable RLS on bookings table
    - Add specific policies for admin roles
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create a function to check admin status
CREATE OR REPLACE FUNCTION is_admin_or_super_admin(user_id uuid)
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

-- Users can view their own bookings
CREATE POLICY "users_view_own_bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  is_admin_or_super_admin(auth.uid())
);

-- Users can create their own bookings
CREATE POLICY "users_create_own_bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Only admins can update booking status
CREATE POLICY "admins_update_bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (is_admin_or_super_admin(auth.uid()))
WITH CHECK (is_admin_or_super_admin(auth.uid()));

-- Only admins can delete bookings
CREATE POLICY "admins_delete_bookings"
ON bookings
FOR DELETE
TO authenticated
USING (is_admin_or_super_admin(auth.uid()));