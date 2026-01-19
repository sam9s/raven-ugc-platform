const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Read the current workflow
const workflowPath = path.join(__dirname, '../n8n/workflows/READY-TO-IMPORT.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Set active to true
workflow.active = true;

const data = JSON.stringify(workflow);
const opts = {
  hostname: 'n8n.sam9scloud.in',
  port: 443,
  path: '/api/v1/workflows/iJ24oWpgg52IvNt1',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'X-N8N-API-KEY': process.env.N8N_API_KEY
  }
};

const req = https.request(opts, (res) => {
  let responseData = '';
  res.on('data', c => responseData += c);
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      if (result.active || result.data?.active) {
        console.log('✅ Workflow activated successfully');
        console.log(`   Workflow ID: iJ24oWpgg52IvNt1`);
      } else {
        console.log('Response:', responseData);
      }
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
