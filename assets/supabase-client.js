// assets/supabase-client.js
// =============================================
// Replace the two values below with your real
// Supabase Project URL and anon key from:
// Supabase Dashboard → Settings → API
// =============================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
