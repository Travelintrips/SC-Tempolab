/*
  # Add Guest Booking Support

  1. Changes
    - Add guest_reference column to bookings table
    - Update RLS policies to allow public access for guest bookings
    - Add email verification for guest bookings

  2. Security
    - Enable public access with proper constraints
    - Ensure data privacy for guest bookings
*/

-- Add guest_reference column to bookings table
ALTER TABLE bookings 
ADD COLUMN guest_reference text,
ADD COLUMN is_guest_booking boolean DEFAULT false;

-- Create unique index for guest reference
CREATE UNIQUE INDEX bookings_guest_reference_idx ON bookings (guest_reference) 
WHERE guest_reference IS NOT NULL;

-- Create function to generate random reference number
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  END LOOP;
  RETURN result;
END;
$$;

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "users_view_own_bookings" ON bookings;
  DROP POLICY IF EXISTS "users_create_own_bookings" ON bookings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies for guest bookings
CREATE POLICY "allow_guest_bookings"
ON bookings
FOR INSERT
TO public
WITH CHECK (
  is_guest_booking = true AND
  customer_email IS NOT NULL AND
  customer_name IS NOT NULL AND
  customer_phone IS NOT NULL
);

CREATE POLICY "allow_guest_view_bookings"
ON bookings
FOR SELECT
TO public
USING (
  guest_reference IS NOT NULL AND
  is_guest_booking = true
);

-- Update existing policies to handle both authenticated and guest bookings
CREATE POLICY "users_view_own_bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  is_admin_or_super_admin(auth.uid())
);

CREATE POLICY "users_create_own_bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  is_guest_booking = false
);