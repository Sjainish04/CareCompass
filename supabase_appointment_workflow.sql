-- Appointment Workflow Migration
-- Run AFTER supabase_migration.sql

-- 0. Drop existing check constraint on status (if any) and replace with one that includes 'pending'
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_check;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'));

-- 1. Change default status from 'confirmed'/'scheduled' to 'pending'
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Add rejection reason and requested date/time columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS requested_date TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS requested_time TEXT;

-- 3. Provider schedules table (weekly availability)
CREATE TABLE IF NOT EXISTS provider_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time TEXT NOT NULL,  -- "09:00"
  end_time TEXT NOT NULL,    -- "17:00"
  slot_duration INT DEFAULT 30,  -- minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, day_of_week)
);

-- 4. Provider blocked dates table
CREATE TABLE IF NOT EXISTS provider_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_date TEXT NOT NULL,  -- "2026-03-20"
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS policies
ALTER TABLE provider_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_owner" ON provider_schedules FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "blocked_owner" ON provider_blocked_dates FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "schedules_public_read" ON provider_schedules FOR SELECT USING (true);
CREATE POLICY "blocked_public_read" ON provider_blocked_dates FOR SELECT USING (true);
