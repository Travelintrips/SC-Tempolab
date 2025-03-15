/*
  # Add Receiver Flag and Update Bank Account Policies

  1. Changes
    - Add is_receiver column to bank_accounts table
    - Update policies to allow public viewing of active receiver accounts
    - Ensure proper access control for payment receiver accounts
    
  2. Security
    - Maintain existing RLS policies
    - Add policy for public viewing of active receiver accounts
*/

-- Add is_receiver column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bank_accounts' 
    AND column_name = 'is_receiver'
  ) THEN
    ALTER TABLE bank_accounts
    ADD COLUMN is_receiver boolean DEFAULT true;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view active bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Public can view active receiver accounts" ON bank_accounts;

-- Create policy for viewing active receiver accounts
CREATE POLICY "Authenticated users can view active bank accounts"
ON bank_accounts
FOR SELECT
TO authenticated
USING (is_active = true AND is_receiver = true);

-- Allow public to view active receiver accounts
CREATE POLICY "Public can view active receiver accounts"
ON bank_accounts
FOR SELECT
TO public
USING (is_active = true AND is_receiver = true);