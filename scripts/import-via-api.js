#!/usr/bin/env node

/**
 * Import workflow to n8n via REST API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_URL = 'n8n.sam9scloud.in';

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY not found in .env');
  process.exit(1);
}

const READY_PATH = path.join(__dirname, '../n8n/workflows/READY-TO-IMPORT.json');
const workflow = JSON.parse(fs.readFileSync(READY_PATH, 'utf8'));

console.log(`🚀 Importing workflow to n8n...`);
console.log(`   Name: ${workflow.name}`);
console.log(`   Nodes: ${workflow.nodes.length}\n`);

const postData = JSON.stringify(workflow);

const options = {
  hostname: N8N_URL,
  port: 443,
  path: '/api/v1/workflows',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'X-N8N-API-KEY': N8N_API_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('✅ Workflow created successfully!');
      console.log(`   ID: ${result.id || result.data?.id}`);
      console.log(`   Name: ${result.name || result.data?.name}`);
      console.log('\n🔗 Access at: https://n8n.sam9scloud.in/workflow/' + (result.id || result.data?.id));
    } else {
      console.error(`❌ Failed: HTTP ${res.statusCode}`);
      console.error(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(postData);
req.end();
