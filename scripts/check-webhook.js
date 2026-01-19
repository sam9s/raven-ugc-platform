const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

https.get({
  hostname: 'n8n.sam9scloud.in',
  path: '/api/v1/workflows/HfhfnaAh6pm2moJ3',
  headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const workflow = JSON.parse(data);
    const webhook = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
    console.log('Webhook Configuration:');
    console.log('  Path:', webhook.parameters.path);
    console.log('  Method:', webhook.parameters.httpMethod);
    console.log('  Webhook ID:', webhook.webhookId);
    console.log('\nFull webhook URL:', `https://n8n.sam9scloud.in/webhook/${webhook.parameters.path}`);
  });
});
