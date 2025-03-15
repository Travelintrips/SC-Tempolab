/*
  # Create bank accounts table and policies

  1. New Tables
    - `bank_accounts`
      - `id` (uuid, primary key)
      - `bank_name` (text, not null)
      - `account_number` (text, not null)
      - `account_holder` (text, not null)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `bank_accounts` table
    - Add policies for super_admin role to manage bank accounts
    - Add policy for authenticated users to view active bank accounts
*/

-- Create the bank_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Super admin can manage bank accounts" ON bank_accounts;
  DROP POLICY IF EXISTS "Authenticated users can view active bank accounts" ON bank_accounts;
END $$;

-- Create policies
CREATE POLICY "Super admin can manage bank accounts"
  ON bank_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.name = 'super_admin'
    )
  );

CREATE POLICY "Authenticated users can view active bank accounts"
  ON bank_accounts
  FOR SELECT
  TO authenticated
  USING (is_active = true);