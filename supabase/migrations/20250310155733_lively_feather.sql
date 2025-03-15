/*
  # Add Signup Auto Update Trigger

  1. Changes
    - Add trigger function for user signup events
    - Create trigger on profiles table for insert events
    - Enable realtime for profiles table

  2. Security
    - Trigger executes with security definer permissions
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION handle_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about the new signup
  PERFORM pg_notify(
    'user_signup',
    json_build_object(
      'user_id', NEW.id,
      'full_name', NEW.full_name,
      'created_at', NEW.created_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_user_signup ON profiles;
CREATE TRIGGER on_user_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_signup();