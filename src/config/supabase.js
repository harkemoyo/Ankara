require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Fallback to store configuration if env vars are not set
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oscqakcygvvtjngbuhbw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// ANON key  → used by the browser (read-only per RLS)
const supabaseAnon = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// SERVICE key → used by this server only (bypasses RLS — keep it secret!)
const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

module.exports = {
    supabaseAnon,
    supabaseAdmin
};
