/*
  # Add Operating Hours Table

  1. New Tables
    - `operating_hours`
      - `id` (uuid, primary key)
      - `day_of_week` (integer, 0-6 where 0 is Sunday)
      - `open_time` (time)
      - `close_time` (time)
      - `is_open` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for super admin management
    - Add policies for public and authenticated read access
*/

CREATE TABLE IF NOT EXISTS operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_hours CHECK (close_time > open_time)
);

-- Enable RLS
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

-- Allow super admin to manage operating hours
CREATE POLICY "Super admin can manage operating hours"
  ON operating_hours
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
      AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- Allow public and authenticated users to read operating hours
CREATE POLICY "Anyone can view operating hours"
  ON operating_hours
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view operating hours"
  ON operating_hours
  FOR SELECT
  TO public
  USING (true);

-- Insert default operating hours (8 AM to 8 PM every day)
INSERT INTO operating_hours (day_of_week, open_time, close_time)
SELECT day_of_week, '08:00:00'::time, '20:00:00'::time
FROM generate_series(0, 6) AS day_of_week
ON CONFLICT DO NOTHING;