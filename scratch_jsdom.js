const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check for site-header
    const headerMatch = data.match(/<header[^>]*id="site-header"[^>]*>/);
    if (headerMatch) {
      console.log('HEADER TAG FOUND:', headerMatch[0]);
    } else {
      console.log('NO site-header FOUND in served HTML');
    }

    // Check for display:none anywhere near header
    const idx = data.indexOf('site-header');
    if (idx > -1) {
      console.log('CONTEXT AROUND site-header:');
      console.log(data.substring(Math.max(0, idx - 100), idx + 200));
    }

    // Check how many times each script appears
    const scripts = ['global.js', 'sale-link.js', 'announcement.js', 'supabase-client.js', 'header.js', 'swiper-bundle.min.js', 'cart.js'];
    scripts.forEach(s => {
      const regex = new RegExp(s.replace('.', '\\.'), 'g');
      const matches = data.match(regex);
      console.log(`${s}: appears ${matches ? matches.length : 0} times`);
    });
  });
}).on('error', e => console.error(e));
