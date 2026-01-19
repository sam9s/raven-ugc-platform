#!/usr/bin/env node

/**
 * Import workflow to n8n via API
 * Reads the DEPLOYED.json file and creates it in n8n
 */

const fs = require('fs');
const path = require('path');

const DEPLOYED_PATH = path.join(__dirname, '../n8n/workflows/ugc-video-generation-DEPLOYED.json');

console.log('📦 Reading deployed workflow...');
const workflowData = JSON.parse(fs.readFileSync(DEPLOYED_PATH, 'utf8'));

// Extract the essential fields for n8n_create_workflow
const workflowPayload = {
  name: workflowData.name || "UGC Video Generation - v1 (Restored)",
  nodes: workflowData.nodes,
  connections: workflowData.connections,
  settings: workflowData.settings || {}
};

// Output as JSON for the MCP tool to consume
console.log(JSON.stringify(workflowPayload, null, 2));
