/*
  # Initial Schema Setup for Role Management

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role_id` (uuid, references roles)
      - `full_name` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role_id uuid REFERENCES roles ON DELETE SET NULL,
  full_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for roles table
CREATE POLICY "Roles are viewable by authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Insert default roles
INSERT INTO roles (name) VALUES
  ('admin'),
  ('user')
ON CONFLICT (name) DO NOTHING;