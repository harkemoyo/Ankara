require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkPagesAnon() {
  const { data, error } = await supabase.from('pages').select('*');
  if (error) {
    console.error('Error fetching pages with ANON key:', error);
  } else {
    console.log(`Pages fetched with ANON key: ${data.length}`);
    data.forEach(p => console.log(p.slug));
  }
}

checkPagesAnon();
