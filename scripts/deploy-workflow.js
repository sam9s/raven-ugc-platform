#!/usr/bin/env node

/**
 * Deploy Workflow Script
 *
 * This script takes the template workflow from Git (with placeholders)
 * and deploys it to n8n with real API keys from .env file.
 *
 * Why this is needed:
 * - n8n blocks $env variable access (N8N_BLOCK_ENV_ACCESS_IN_NODE=true)
 * - We can't commit real API keys to Git (security risk)
 * - This script bridges the gap: Git template + .env = deployed workflow
 *
 * Usage:
 *   node scripts/deploy-workflow.js
 */

const fs = require('fs');
const path = require('path');

// Load .env file from project root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Paths
const TEMPLATE_PATH = path.join(__dirname, '../n8n/workflows/ugc-video-generation-WORKING-v1.json');
const OUTPUT_PATH = path.join(__dirname, '../n8n/workflows/ugc-video-generation-DEPLOYED.json');

console.log('🚀 Deploying Workflow with Real API Keys...\n');

// Read template
console.log('📄 Reading template from Git...');
let workflowTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// Check for required env vars
const requiredVars = {
  'KIE_AI_API_KEY': process.env.KIE_AI_API_KEY,
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
};

let missingVars = [];
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    missingVars.push(key);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\nPlease check your .env file.');
  process.exit(1);
}

// Replace placeholders with real values
console.log('🔑 Injecting API keys from .env...');

workflowTemplate = workflowTemplate.replace(
  /YOUR_KIE_AI_API_KEY/g,
  process.env.KIE_AI_API_KEY
);

workflowTemplate = workflowTemplate.replace(
  /YOUR_OPENAI_API_KEY/g,
  process.env.OPENAI_API_KEY
);

// Write deployed version
console.log('💾 Writing deployed workflow...');
fs.writeFileSync(OUTPUT_PATH, workflowTemplate, 'utf8');

console.log('\n✅ Deployment complete!\n');
console.log('📦 Deployed workflow: n8n/workflows/ugc-video-generation-DEPLOYED.json');
console.log('\n📋 Next steps:');
console.log('   1. Go to n8n dashboard: https://n8n.sam9scloud.in');
console.log('   2. Import: n8n/workflows/ugc-video-generation-DEPLOYED.json');
console.log('   3. Activate the workflow');
console.log('\n⚠️  Note: The DEPLOYED.json file is gitignored (contains real API keys)');
