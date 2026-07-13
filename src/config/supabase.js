const { createClient } = require('@supabase/supabase-js');

// ANON key  → used by the browser (read-only per RLS)
const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// SERVICE key → used by this server only (bypasses RLS — keep it secret!)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

module.exports = {
    supabaseAnon,
    supabaseAdmin
};
