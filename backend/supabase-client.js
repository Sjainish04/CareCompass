import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://vleyrexwowjrcmzwsmde.supabase.co'
const supabaseKey = 'sb_publishable_Zf0-9YZJoq20ZHq6ggEJnQ_v1GpwDbr'

export const supabase = createClient(supabaseUrl, supabaseKey)
