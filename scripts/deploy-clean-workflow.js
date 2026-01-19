#!/usr/bin/env node

/**
 * Deploy Clean Workflow with Real API Keys
 * Reads the CLEAN workflow and injects API keys from .env
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CLEAN_PATH = path.join(__dirname, '../n8n/workflows/ugc-video-generation-CLEAN.json');
const OUTPUT_PATH = path.join(__dirname, '../n8n/workflows/READY-TO-IMPORT.json');

console.log('🚀 Preparing workflow for n8n import...\n');

// Read clean workflow
const workflow = JSON.parse(fs.readFileSync(CLEAN_PATH, 'utf8'));

// Convert to JSON string for replacement
let workflowStr = JSON.stringify(workflow, null, 2);

// Replace placeholders
console.log('🔑 Injecting API keys...');
workflowStr = workflowStr.replace(/YOUR_KIE_AI_API_KEY/g, process.env.KIE_AI_API_KEY);
workflowStr = workflowStr.replace(/YOUR_OPENAI_API_KEY/g, process.env.OPENAI_API_KEY);

// Parse back to object
const readyWorkflow = JSON.parse(workflowStr);

// Prepare for n8n_create_workflow MCP tool
const importPayload = {
  name: readyWorkflow.name + " (Restored)",
  nodes: readyWorkflow.nodes,
  connections: readyWorkflow.connections,
  settings: readyWorkflow.settings || {}
};

// Write ready-to-import version
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(importPayload, null, 2), 'utf8');

console.log('\n✅ Workflow ready for import!');
console.log(`   Name: ${importPayload.name}`);
console.log(`   Nodes: ${importPayload.nodes.length}`);
console.log(`   File: READY-TO-IMPORT.json`);
console.log('\n📋 Next: Use n8n MCP tool to create workflow');
