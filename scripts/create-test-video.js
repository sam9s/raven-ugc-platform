#!/usr/bin/env node

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const videoData = {
  id: 'test-v2-0001-0001-0001-000000000001',
  user_id: '42a140a2-b4c5-4e2e-92bd-449e87f52605',
  product_name: 'Wireless Earbuds Pro',
  status: 'processing',
  product_photo_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'
};

const data = JSON.stringify(videoData);
const opts = {
  hostname: 'crgbmbotbmzfibzupdhi.supabase.co',
  path: '/rest/v1/videos',
  method: 'POST',
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
};

console.log('📝 Creating test video record in Supabase...');
console.log('   Video ID:', videoData.id);

const req = https.request(opts, (res) => {
  let responseData = '';
  res.on('data', c => responseData += c);
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('');
      console.log('✅ Test video record created successfully');
    } else {
      console.log('');
      console.log('Response status:', res.statusCode);
      console.log('Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
