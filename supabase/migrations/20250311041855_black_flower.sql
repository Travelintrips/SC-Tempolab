/*
  # Add RLS policies for sports_facilities table

  1. Security
    - Enable RLS on sports_facilities table
    - Add policies:
      - Allow all authenticated users to view facilities
      - Allow super_admin to manage facilities (insert, update, delete)
*/

-- Enable RLS
ALTER TABLE sports_facilities ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing facilities (all authenticated users)
CREATE POLICY "Anyone can view facilities"
  ON sports_facilities
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for managing facilities (super_admin only)
CREATE POLICY "Super admin can manage facilities"
  ON sports_facilities
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