require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPages() {
  const { data, error } = await supabase.from('pages').select('*');
  if (error) {
    console.error('Error fetching pages:', error);
  } else {
    console.log('Pages in DB:');
    data.forEach(p => {
      console.log(`- ${p.slug} (${p.title})`);
    });
  }
}

checkPages();
