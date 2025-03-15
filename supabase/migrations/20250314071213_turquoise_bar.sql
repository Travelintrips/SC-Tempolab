/*
  # Fix Guest Booking RLS Policies

  1. Changes
    - Drop existing guest booking policies
    - Create new policies with correct target and conditions
    - Ensure proper access for both authenticated and guest bookings
    
  2. Security
    - Maintain proper access control
    - Enable guest booking functionality
    - Ensure data integrity
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "allow_guest_bookings" ON bookings;
  DROP POLICY IF EXISTS "allow_guest_view_bookings" ON bookings;
  DROP POLICY IF EXISTS "users_create_own_bookings" ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for guest bookings
CREATE POLICY "allow_guest_bookings"
ON bookings
FOR INSERT
TO anon
WITH CHECK (
  is_guest_booking = true AND
  user_id IS NULL AND
  customer_email IS NOT NULL AND
  customer_name IS NOT NULL AND
  customer_phone IS NOT NULL AND
  payment_method_id IS NOT NULL AND
  guest_reference IS NULL
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

-- Create policy for authenticated users to create bookings
CREATE POLICY "users_create_own_bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND is_guest_booking = false) OR
  is_admin_or_super_admin(auth.uid())
);