#!/usr/bin/env node

/**
 * Extract workflow from n8n export format
 */

const fs = require('fs');
const path = require('path');

const DEPLOYED_PATH = path.join(__dirname, '../n8n/workflows/ugc-video-generation-DEPLOYED.json');

const rawData = fs.readFileSync(DEPLOYED_PATH, 'utf8');
const parsed = JSON.parse(rawData);

// The file contains the n8n API response structure
const workflow = parsed.success ? parsed.data : parsed;

// Output only what we need for n8n_create_workflow
const output = {
  name: workflow.name + " (Restored with UGC Prompts)",
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: workflow.settings || {}
};

// Write to a new file
const outputPath = path.join(__dirname, '../n8n/workflows/IMPORT-READY.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log('✅ Extracted workflow data to IMPORT-READY.json');
console.log(`   Nodes: ${output.nodes.length}`);
console.log(`   Name: ${output.name}`);
