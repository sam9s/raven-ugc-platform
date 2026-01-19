#!/usr/bin/env node

/**
 * Fix v2 workflow by restoring from backup and applying production fixes
 * Fixes:
 * 1. Video duration: Add "duration": "45s"
 * 2. Aspect ratio: Change "aspect_ratio": "16:9" to "aspectRatio": "9:16"
 * 3. Token limit: Change max_tokens from 300 to 500
 */

const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '../n8n/workflows/ugc-video-generation-v2-before-fixes.json');

console.log('📦 Loading v2 workflow backup...');
const workflow = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('   Workflow:', workflow.name);
console.log('   ID:', workflow.id);
console.log('   Nodes:', workflow.nodes.length);

// Fix 1 & 2: Update "Generate Video - KIE.AI" node
console.log('');
console.log('🔧 Applying fixes...');

const videoNode = workflow.nodes.find(n => n.name === 'Generate Video - KIE.AI');
if (videoNode) {
  const oldBody = videoNode.parameters.jsonBody;

  // Replace aspect_ratio with aspectRatio and add duration
  const newBody = oldBody
    .replace(/aspect_ratio: '16:9'/g, "aspectRatio: '9:16', duration: '45s'");

  videoNode.parameters.jsonBody = newBody;
  console.log('   ✅ Fixed video node: aspectRatio 9:16, duration 45s');
}

// Fix 3: Update "Analyze Image - OpenAI" node
const openaiNode = workflow.nodes.find(n => n.name === 'Analyze Image - OpenAI');
if (openaiNode) {
  const oldBody = openaiNode.parameters.jsonBody;
  const newBody = oldBody.replace(/max_tokens: 300/g, 'max_tokens: 500');

  openaiNode.parameters.jsonBody = newBody;
  console.log('   ✅ Fixed OpenAI node: max_tokens 500');
}

// Save fixed workflow
const outputPath = path.join(__dirname, '../n8n/workflows/ugc-video-generation-v2-fixed.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));

console.log('');
console.log('💾 Fixed workflow saved to:', outputPath);
console.log('');
console.log('Next step: Import this workflow back to n8n');
