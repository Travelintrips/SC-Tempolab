/*
  # Fix Bookings RLS Policies for Guest Bookings

  1. Changes
    - Drop and recreate all booking policies to ensure consistency
    - Fix guest booking policy to allow proper access
    - Add policy for public access to create guest bookings
    
  2. Security
    - Maintain proper access control
    - Allow guest bookings without authentication
    - Preserve admin capabilities
*/

-- Drop all existing booking policies to start fresh
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "users_view_own_bookings" ON bookings;
  DROP POLICY IF EXISTS "users_create_own_bookings" ON bookings;
  DROP POLICY IF EXISTS "allow_guest_bookings" ON bookings;
  DROP POLICY IF EXISTS "allow_guest_view_bookings" ON bookings;
  DROP POLICY IF EXISTS "admins_update_bookings" ON bookings;
  DROP POLICY IF EXISTS "admins_delete_bookings" ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view their bookings
CREATE POLICY "users_view_own_bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  is_admin_or_super_admin(auth.uid())
);

-- Create policy for authenticated users to create bookings
CREATE POLICY "users_create_own_bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND is_guest_booking = false) OR
  is_admin_or_super_admin(auth.uid())
);

-- Create policy for guest bookings (public access)
CREATE POLICY "allow_guest_bookings"
ON bookings
FOR INSERT
TO anon
WITH CHECK (
  is_guest_booking = true AND
  user_id IS NULL AND
  customer_email IS NOT NULL AND
  customer_name IS NOT NULL AND
  customer_phone IS NOT NULL
);

-- Create policy for guests to view their bookings
CREATE POLICY "allow_guest_view_bookings"
ON bookings
FOR SELECT
TO anon
USING (
  guest_reference IS NOT NULL AND
  is_guest_booking = true
);

-- Create policy for admins to update bookings
CREATE POLICY "admins_update_bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (is_admin_or_super_admin(auth.uid()))
WITH CHECK (is_admin_or_super_admin(auth.uid()));

-- Create policy for admins to delete bookings
CREATE POLICY "admins_delete_bookings"
ON bookings
FOR DELETE
TO authenticated
USING (is_admin_or_super_admin(auth.uid()));