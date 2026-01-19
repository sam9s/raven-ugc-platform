const https = require('https');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : require('uuid');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const userId = '42a140a2-b4c5-4e2e-92bd-449e87f52605';
const videoId = uuidv4 ? uuidv4() : require('crypto').randomUUID();

console.log('Creating test video record...');
console.log('  User ID:', userId);
console.log('  Video ID:', videoId);

// First create the video record in database
const createVideo = {
  hostname: 'crgbmbotbmzfibzupdhi.supabase.co',
  path: '/rest/v1/videos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Prefer': 'return=minimal'
  }
};

const videoData = JSON.stringify({
  id: videoId,
  user_id: userId,
  status: 'processing',
  product_name: 'Wireless Earbuds Pro',
  product_category: 'tech'
});

const req1 = https.request(createVideo, (res) => {
  if (res.statusCode === 201) {
    console.log('✅ Video record created\n');
    console.log('Testing workflow...\n');
    
    // Now test the workflow
    const testData = JSON.stringify({
      user_id: userId,
      video_id: videoId,
      product_name: 'Wireless Earbuds Pro',
      product_category: 'tech',
      features: '40-hour battery life, noise cancellation, IPX7 waterproof',
      target_audience: 'fitness enthusiasts and commuters',
      product_photo_url: 'https://placeholder.com/test.jpg'
    });
    
    const testOpts = {
      hostname: 'n8n.sam9scloud.in',
      path: '/webhook/ugc-video-generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.N8N_WEBHOOK_SECRET
      }
    };
    
    const req2 = https.request(testOpts, (res2) => {
      let data = '';
      res2.on('data', c => data += c);
      res2.on('end', () => {
        console.log('Workflow Response:');
        console.log(data);
      });
    });
    
    req2.on('error', e => console.error('Test error:', e.message));
    req2.write(testData);
    req2.end();
  } else {
    console.log('Failed to create video:', res.statusCode);
  }
});

req1.on('error', e => console.error('Database error:', e.message));
req1.write(videoData);
req1.end();
