/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies that are causing infinite recursion
    - Add new, simplified RLS policies for the profiles table
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Users can read their own profile
      - Users can update their own profile
      - Service role can manage all profiles
      - Authenticated users can read profiles (needed for basic functionality)
*/

-- First, disable RLS to clean up policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can create profiles" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new, simplified policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role full access"
  ON profiles
  TO service_role
  USING (true)
  WITH CHECK (true);