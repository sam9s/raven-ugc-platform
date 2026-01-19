const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const opts = {
  hostname: 'n8n.sam9scloud.in',
  path: '/api/v1/workflows/iJ24oWpgg52IvNt1',
  headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
};

https.get(opts, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const wf = JSON.parse(data);
    const deductNode = wf.nodes.find(n => n.name === 'Deduct Credit');
    console.log('Deduct Credit Node:');
    console.log(JSON.stringify(deductNode, null, 2));
  });
}).on('error', e => console.error(e.message));
