#!/usr/bin/env node

/**
 * This script outputs the exact command needed to create the workflow
 * via the n8n MCP tool
 */

const fs = require('fs');
const path = require('path');

const READY_PATH = path.join(__dirname, '../n8n/workflows/READY-TO-IMPORT.json');
const workflow = JSON.parse(fs.readFileSync(READY_PATH, 'utf8'));

console.log('To create this workflow in n8n, use the mcp__n8n-mcp__n8n_create_workflow tool with:');
console.log('');
console.log('Name:', workflow.name);
console.log('Nodes:', workflow.nodes.length);
console.log('Connections:', Object.keys(workflow.connections).length);
console.log('');
console.log('The workflow JSON is in: n8n/workflows/READY-TO-IMPORT.json');
console.log('');
console.log('Since the JSON is too large to pass directly, we need to:');
console.log('1. Use a chunked approach');
console.log('2. Or import manually via n8n UI');
console.log('3. Or use n8n API directly');
