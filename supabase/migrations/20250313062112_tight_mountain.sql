/*
  # Add Payment Fields to Bookings Table

  1. Changes
    - Add payment-related fields to bookings table:
      - payment_method_id (references bank_accounts)
      - customer_name
      - customer_phone
      - customer_email

  2. Security
    - Maintain existing RLS policies
    - Add foreign key constraint for payment_method
*/

ALTER TABLE bookings
ADD COLUMN payment_method_id uuid REFERENCES bank_accounts(id),
ADD COLUMN customer_name text,
ADD COLUMN customer_phone text,
ADD COLUMN customer_email text;