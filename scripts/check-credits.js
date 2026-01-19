const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const opts = {
  hostname: 'crgbmbotbmzfibzupdhi.supabase.co',
  path: '/rest/v1/credits?user_id=eq.42a140a2-b4c5-4e2e-92bd-449e87f52605&select=*',
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

https.get(opts, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const credits = JSON.parse(data);
    console.log('User Credits:', credits);
  });
}).on('error', (e) => console.error('Error:', e.message));
