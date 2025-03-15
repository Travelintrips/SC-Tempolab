/*
  # Add public access policy for sports facilities

  1. Security Changes
    - Add policy to allow public read access to sports_facilities table
    - This allows unauthenticated users to view facilities
*/

CREATE POLICY "Allow public read access to facilities"
ON sports_facilities
FOR SELECT
TO public
USING (true);