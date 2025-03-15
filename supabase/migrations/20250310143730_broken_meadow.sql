/*
  # Sports Center Booking Schema

  1. New Tables
    - `sports_facilities`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the facility
      - `description` (text) - Description of the facility
      - `price_per_hour` (integer) - Price in cents
      - `image_url` (text) - Facility image
      - `created_at` (timestamp)
      
    - `bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References profiles
      - `facility_id` (uuid) - References sports_facilities
      - `start_time` (timestamptz) - Booking start time
      - `end_time` (timestamptz) - Booking end time
      - `status` (text) - Booking status (pending, confirmed, cancelled)
      - `total_price` (integer) - Total price in cents
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create sports_facilities table
CREATE TABLE IF NOT EXISTS sports_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_per_hour integer NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id uuid REFERENCES sports_facilities(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_price integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_booking_time CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE sports_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for sports_facilities
CREATE POLICY "Sports facilities are viewable by all users"
  ON sports_facilities FOR SELECT
  TO authenticated
  USING (true);

-- Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample facilities
INSERT INTO sports_facilities (name, description, price_per_hour, image_url) VALUES
  (
    'Indoor Basketball Court',
    'Professional-grade indoor basketball court with wooden flooring and adjustable hoops',
    5000,
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200'
  ),
  (
    'Tennis Court',
    'All-weather tennis court with night lighting',
    4000,
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&q=80&w=1200'
  ),
  (
    'Futsal Court',
    'Indoor futsal court with artificial turf',
    6000,
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&q=80&w=1200'
  );