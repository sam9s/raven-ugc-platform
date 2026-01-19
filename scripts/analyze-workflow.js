const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/workflows/ugc-video-generation-CLEAN.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('# Workflow Analysis\n');
console.log(`Total Nodes: ${workflow.nodes.length}\n`);

workflow.nodes.forEach((node, i) => {
  console.log(`${i + 1}. **${node.name}**`);
  console.log(`   - Type: ${node.type}`);
  console.log(`   - ID: ${node.id}`);

  // Show key parameters
  if (node.type === 'n8n-nodes-base.webhook') {
    console.log(`   - Path: /webhook/${node.parameters.path}`);
    console.log(`   - Method: ${node.parameters.httpMethod}`);
  }

  if (node.type === 'n8n-nodes-base.httpRequest') {
    console.log(`   - URL: ${node.parameters.url || 'dynamic'}`);
    console.log(`   - Method: ${node.parameters.method}`);
  }

  if (node.type === 'n8n-nodes-base.wait') {
    console.log(`   - Duration: ${node.parameters.amount} ${node.parameters.unit}`);
  }

  console.log('');
});

// Show connections
console.log('\n## Connections\n');
Object.entries(workflow.connections).forEach(([fromNode, outputs]) => {
  outputs.main.forEach((connections, outputIndex) => {
    connections.forEach(conn => {
      console.log(`${fromNode} -> ${conn.node}`);
    });
  });
});
