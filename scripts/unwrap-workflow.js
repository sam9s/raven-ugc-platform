#!/usr/bin/env node

/**
 * Unwrap workflow from persisted output format
 * The WORKING file has a wrapper array with type/text structure
 */

const fs = require('fs');
const path = require('path');

const WRAPPED_PATH = path.join(__dirname, '../n8n/workflows/ugc-video-generation-WORKING-v1.json');
const CLEAN_PATH = path.join(__dirname, '../n8n/workflows/ugc-video-generation-CLEAN.json');

console.log('📦 Reading wrapped workflow...');
const wrappedData = fs.readFileSync(WRAPPED_PATH, 'utf8');
const parsed = JSON.parse(wrappedData);

// Extract the actual JSON from the wrapper
let workflowJSON;
if (Array.isArray(parsed) && parsed[0] && parsed[0].type === 'text') {
  // It's wrapped in persisted output format
  const textContent = parsed[0].text;
  workflowJSON = JSON.parse(textContent);
  console.log('✅ Unwrapped from persisted output format');
} else {
  // It's already clean JSON
  workflowJSON = parsed;
  console.log('✅ Already clean JSON format');
}

// Now extract just the workflow data (remove API response wrapper if present)
const workflow = workflowJSON.success ? workflowJSON.data : workflowJSON;

console.log(`📊 Workflow: "${workflow.name}"`);
console.log(`   Nodes: ${workflow.nodes ? workflow.nodes.length : 0}`);
console.log(`   Connections: ${workflow.connections ? Object.keys(workflow.connections).length : 0}`);

// Write clean version
fs.writeFileSync(CLEAN_PATH, JSON.stringify(workflow, null, 2), 'utf8');
console.log(`\n💾 Clean workflow saved to: ugc-video-generation-CLEAN.json`);
