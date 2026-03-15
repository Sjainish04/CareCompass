-- =====================================================
-- CareCompass Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'patient',
  preferred_language TEXT DEFAULT 'English',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Providers / Clinics
CREATE TABLE IF NOT EXISTS providers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  spec TEXT,
  icon TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  addr TEXT,
  phone TEXT,
  hours TEXT,
  acc BOOLEAN DEFAULT true,
  open BOOLEAN DEFAULT true,
  dist DOUBLE PRECISION DEFAULT 0,
  wait INT DEFAULT 0,
  rating DOUBLE PRECISION DEFAULT 0,
  rc INT DEFAULT 0,
  color TEXT,
  langs JSONB DEFAULT '[]',
  reviews JSONB DEFAULT '[]',
  slots JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id TEXT,
  provider_name TEXT,
  date TEXT,
  time TEXT,
  datetime TEXT,
  type TEXT DEFAULT 'Specialist Visit',
  language TEXT DEFAULT 'English',
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT,
  provider_name TEXT,
  urgency TEXT DEFAULT 'routine',
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Care Steps
CREATE TABLE IF NOT EXISTS care_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_order INT DEFAULT 1,
  name TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Patient Records
CREATE TABLE IF NOT EXISTS patient_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  conditions JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  ohip_number TEXT,
  emergency_contact JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Navigator Messages
CREATE TABLE IF NOT EXISTS navigator_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigator_messages ENABLE ROW LEVEL SECURITY;

-- Providers: public read
CREATE POLICY "providers_public_read" ON providers FOR SELECT USING (true);

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Appointments
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "appointments_insert" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "appointments_delete" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- Referrals
CREATE POLICY "referrals_select" ON referrals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "referrals_insert" ON referrals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Care Steps
CREATE POLICY "care_steps_select" ON care_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "care_steps_insert" ON care_steps FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Patient Records
CREATE POLICY "patient_records_select" ON patient_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "patient_records_insert" ON patient_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "patient_records_update" ON patient_records FOR UPDATE USING (auth.uid() = user_id);

-- Navigator Messages
CREATE POLICY "navigator_messages_select" ON navigator_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "navigator_messages_insert" ON navigator_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "navigator_messages_delete" ON navigator_messages FOR DELETE USING (auth.uid() = user_id);
