/*
  # Fix Profiles RLS Policies

  1. Changes
    - Add insert policy for profiles table to allow new user registration
    - Ensure authenticated users can only access their own profile data
    - Allow service role to manage all profiles

  2. Security
    - Enable RLS on profiles table
    - Add specific policies for insert, select, and update operations
*/

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Create insert policy for new user registration
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create select policy
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create update policy
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role full access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);