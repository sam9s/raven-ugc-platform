const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const videoId = 'bbbbbbbb-cccc-dddd-eeee-000000000001';

https.get({
  hostname: 'crgbmbotbmzfibzupdhi.supabase.co',
  path: `/rest/v1/videos?id=eq.${videoId}&select=*`,
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
  }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const videos = JSON.parse(data);
    if (videos.length > 0) {
      const v = videos[0];
      console.log('\n📹 Video Generation Status:');
      console.log('  Video ID:', v.id);
      console.log('  Status:', v.status);
      console.log('  Product:', v.product_name);
      console.log('  Image URL:', v.generated_image_url || '(pending)');
      console.log('  Video URL:', v.generated_video_url || '(pending)');
      console.log('  Error:', v.error_message || 'none');
      console.log('  Generation Time:', v.generation_time_seconds ? `${v.generation_time_seconds}s` : 'pending');
      console.log('  Created:', new Date(v.created_at).toLocaleString());
      console.log('  Updated:', new Date(v.updated_at).toLocaleString());
    } else {
      console.log('Video not found');
    }
  });
});
