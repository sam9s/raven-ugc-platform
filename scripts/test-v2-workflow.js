#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const payload = JSON.parse(fs.readFileSync(path.join(__dirname, '../test-data/sample-script-payload.json'), 'utf8'));
const data = JSON.stringify(payload);

const opts = {
  hostname: 'n8n.sam9scloud.in',
  port: 443,
  path: '/webhook/ugc-video-generate-v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'X-API-Key': process.env.N8N_WEBHOOK_SECRET
  }
};

console.log('🚀 Testing v2 workflow with UGC script...');
console.log('   Video ID:', payload.video_id);
console.log('   Product:', payload.product_name);
console.log('   Script Hook:', payload.ugc_script.hook.substring(0, 50) + '...');
console.log('');

const req = https.request(opts, (res) => {
  let responseData = '';
  res.on('data', c => responseData += c);
  res.on('end', () => {
    console.log('📊 Response Status:', res.statusCode);
    console.log('');
    try {
      const result = JSON.parse(responseData);
      console.log('Response:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Response:', responseData);
    }
    console.log('');
    if (res.statusCode === 200) {
      console.log('✅ Workflow triggered successfully!');
      console.log('');
      console.log('⏳ Video generation in progress (will take ~5-6 minutes)');
      console.log('   Check execution logs: https://n8n.sam9scloud.in/executions');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
