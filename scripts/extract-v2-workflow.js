#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outputFile = process.argv[3] || 'n8n/workflows/ugc-video-generation-v2-before-fixes.json';

console.log('📦 Reading MCP output file...');
const data = fs.readFileSync(inputFile, 'utf8');

let workflow;
try {
  const parsed = JSON.parse(data);

  // Handle persisted output format: [{type: "text", text: "..."}]
  if (Array.isArray(parsed) && parsed[0] && parsed[0].type === 'text') {
    const textContent = parsed[0].text;
    const result = JSON.parse(textContent);
    workflow = result.data || result;
  } else if (parsed.data) {
    workflow = parsed.data;
  } else {
    workflow = parsed;
  }

  console.log('✅ Extracted workflow data');
  console.log('   Name:', workflow.name);
  console.log('   ID:', workflow.id);
  console.log('   Nodes:', workflow.nodes?.length || 0);

  // Verify it's the v2 workflow
  if (!workflow.id || workflow.id !== 'YanQMNKAFhjSGnt1') {
    console.error('❌ ERROR: This is not the v2 workflow!');
    console.error('   Expected ID: YanQMNKAFhjSGnt1');
    console.error('   Found ID:', workflow.id);
    process.exit(1);
  }

  fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
  console.log('');
  console.log('💾 V2 workflow saved to:', outputFile);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
