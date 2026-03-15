import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Admin client — bypasses RLS, server-only
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Auth client — uses anon key for auth flows
export const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
