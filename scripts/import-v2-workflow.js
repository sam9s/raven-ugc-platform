#!/usr/bin/env node

/**
 * Import v2 workflow to n8n via REST API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PAYLOAD_PATH = path.join(__dirname, '../n8n/workflows/clone-v2-payload.json');

console.log('📦 Reading v2 workflow payload...');
const workflow = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));

console.log('   Name:', workflow.name);
console.log('   Nodes:', workflow.nodes.length);

const data = JSON.stringify(workflow);

const opts = {
  hostname: 'n8n.sam9scloud.in',
  port: 443,
  path: '/api/v1/workflows',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'X-N8N-API-KEY': process.env.N8N_API_KEY
  }
};

console.log('');
console.log('🚀 Creating v2 workflow in n8n...');

const req = https.request(opts, (res) => {
  let responseData = '';

  res.on('data', chunk => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);

      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('');
        console.log('✅ V2 workflow created successfully!');
        console.log('   Workflow ID:', result.id || result.data?.id);
        console.log('   Name:', result.name || result.data?.name);
        console.log('   Status:', result.active ? 'Active' : 'Inactive');
        console.log('');
        console.log('🔗 Access at: https://n8n.sam9scloud.in/workflow/' + (result.id || result.data?.id));
      } else {
        console.error('❌ Error creating workflow:');
        console.error('   Status:', res.statusCode);
        console.error('   Response:', responseData);
      }
    } catch (e) {
      console.error('❌ Failed to parse response:');
      console.error('   Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(data);
req.end();
