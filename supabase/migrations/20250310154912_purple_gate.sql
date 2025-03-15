/*
  # Add Bidirectional Update Triggers

  1. New Functions
    - `handle_booking_status_change`: Handles booking status updates
    - `handle_facility_update`: Handles facility updates

  2. New Triggers
    - `on_booking_status_change`: Trigger for booking status changes
    - `on_facility_update`: Trigger for facility updates

  3. Security
    - Functions are set to SECURITY DEFINER to ensure they run with necessary privileges
*/

-- Function to handle booking status changes
CREATE OR REPLACE FUNCTION handle_booking_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if status has changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Notify all connected clients about the booking status change
    PERFORM pg_notify(
      'booking_status_changed',
      json_build_object(
        'booking_id', NEW.id,
        'status', NEW.status,
        'facility_id', NEW.facility_id,
        'user_id', NEW.user_id
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Function to handle facility updates
CREATE OR REPLACE FUNCTION handle_facility_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notify all connected clients about the facility update
  IF (TG_OP = 'UPDATE') THEN
    PERFORM pg_notify(
      'facility_updated',
      json_build_object(
        'facility_id', NEW.id,
        'name', NEW.name,
        'price_per_hour', NEW.price_per_hour,
        'updated_at', CURRENT_TIMESTAMP
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for booking status changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_booking_status_change'
  ) THEN
    CREATE TRIGGER on_booking_status_change
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_status_change();
  END IF;
END $$;

-- Create trigger for facility updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_facility_update'
  ) THEN
    CREATE TRIGGER on_facility_update
    AFTER UPDATE ON sports_facilities
    FOR EACH ROW
    EXECUTE FUNCTION handle_facility_update();
  END IF;
END $$;