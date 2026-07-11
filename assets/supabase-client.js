// assets/supabase-client.js
// =============================================
// Replace the two values below with your real
// Supabase Project URL and anon key from:
// Supabase Dashboard → Settings → API
// =============================================

const SUPABASE_URL = 'https://oscqakcygvvtjngbuhbw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
