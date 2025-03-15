/*
  # Fix Bookings RLS Policies

  1. Changes
    - Update RLS policies for bookings table to properly handle guest bookings
    - Ensure both authenticated users and guests can create bookings
    - Maintain existing security constraints
    
  2. Security
    - Enable proper access for guest bookings
    - Maintain admin access controls
    - Ensure data privacy
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "users_create_own_bookings" ON bookings;
  DROP POLICY IF EXISTS "allow_guest_bookings" ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policy for authenticated user bookings
CREATE POLICY "users_create_own_bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND is_guest_booking = false) OR
  is_admin_or_super_admin(auth.uid())
);

-- Create policy for guest bookings
CREATE POLICY "allow_guest_bookings"
ON bookings
FOR INSERT
TO public
WITH CHECK (
  is_guest_booking = true AND
  user_id IS NULL AND
  customer_email IS NOT NULL AND
  customer_name IS NOT NULL AND
  customer_phone IS NOT NULL
);

-- Add trigger to automatically generate guest reference
CREATE OR REPLACE FUNCTION set_guest_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_guest_booking = true AND NEW.guest_reference IS NULL THEN
    NEW.guest_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS tr_set_guest_reference ON bookings;
CREATE TRIGGER tr_set_guest_reference
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_guest_reference();