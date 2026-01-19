#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const workflowPath = path.join(__dirname, '../n8n/workflows/ugc-video-generation-v2-fixed.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Prepare update payload
const updatePayload = {
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: workflow.settings || {}
};

const data = JSON.stringify(updatePayload);

const opts = {
  hostname: 'n8n.sam9scloud.in',
  port: 443,
  path: `/api/v1/workflows/${workflow.id}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'X-N8N-API-KEY': process.env.N8N_API_KEY
  }
};

console.log('🔄 Updating v2 workflow in n8n...');
console.log('   Workflow ID:', workflow.id);
console.log('   Nodes:', workflow.nodes.length);

const req = https.request(opts, (res) => {
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('');
      console.log('✅ V2 workflow updated successfully!');
      console.log('   Applied fixes:');
      console.log('   - Video duration: 45 seconds');
      console.log('   - Aspect ratio: 9:16 (vertical)');
      console.log('   - OpenAI max_tokens: 500');
    } else {
      console.error('❌ Error updating workflow:');
      console.error('   Status:', res.statusCode);
      console.error('   Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(data);
req.end();
