-- Add provider_name column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS provider_name TEXT;
