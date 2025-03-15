/*
  # Create bank accounts table

  1. New Tables
    - `bank_accounts`
      - `id` (uuid, primary key)
      - `bank_name` (text)
      - `account_number` (text)
      - `account_holder` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `bank_accounts` table
    - Add policy for super_admin to manage bank accounts
    - Add policy for authenticated users to view active bank accounts
*/

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for super_admin to manage bank accounts
CREATE POLICY "Super admin can manage bank accounts"
  ON bank_accounts
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

-- Create policy for authenticated users to view active bank accounts
CREATE POLICY "Authenticated users can view active bank accounts"
  ON bank_accounts
  FOR SELECT
  TO authenticated
  USING (is_active = true);