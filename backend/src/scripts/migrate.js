import { env } from '../config/env.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SQL = `
-- Profiles table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'provider')),
  preferred_language TEXT DEFAULT 'English',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Providers / Clinics
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

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID,
  provider_name TEXT,
  date TEXT,
  time TEXT,
  type TEXT DEFAULT 'Specialist Visit',
  language TEXT DEFAULT 'English',
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show','pending')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT,
  provider_name TEXT,
  urgency TEXT DEFAULT 'routine',
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','booked','in_progress','completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Care steps (linked to referrals)
CREATE TABLE IF NOT EXISTS care_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_order INT DEFAULT 1,
  name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Patient health records
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

-- Navigator chat messages
CREATE TABLE IF NOT EXISTS navigator_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigator_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow service key to bypass (already does), allow users to read their own data
-- Providers are public read
CREATE POLICY IF NOT EXISTS "providers_public_read" ON providers FOR SELECT USING (true);

-- Profiles: users can read/update their own
CREATE POLICY IF NOT EXISTS "profiles_own_read" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Appointments: users can CRUD their own
CREATE POLICY IF NOT EXISTS "appointments_own" ON appointments FOR ALL USING (auth.uid() = user_id);

-- Referrals: users can read their own
CREATE POLICY IF NOT EXISTS "referrals_own" ON referrals FOR ALL USING (auth.uid() = user_id);

-- Care steps: users can read their own
CREATE POLICY IF NOT EXISTS "care_steps_own" ON care_steps FOR ALL USING (auth.uid() = user_id);

-- Patient records: users can CRUD their own
CREATE POLICY IF NOT EXISTS "patient_records_own" ON patient_records FOR ALL USING (auth.uid() = user_id);

-- Navigator messages: users can CRUD their own
CREATE POLICY IF NOT EXISTS "navigator_messages_own" ON navigator_messages FOR ALL USING (auth.uid() = user_id);
`;

async function migrate() {
  console.log('Running CareCompass database migration...\n');

  // Split SQL into individual statements and run them
  const statements = SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const stmt of statements) {
    const short = stmt.substring(0, 80).replace(/\n/g, ' ');
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        // Try raw REST approach if rpc doesn't exist
        throw error;
      }
      console.log(`  OK: ${short}...`);
    } catch (err) {
      // Fallback: use the SQL editor endpoint directly
      console.log(`  SKIP (run manually): ${short}...`);
    }
  }

  console.log('\n---');
  console.log('If tables were not created automatically, run the SQL below');
  console.log('in Supabase Dashboard > SQL Editor:\n');
  console.log(SQL);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
