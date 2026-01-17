# Raven UGC Platform - API Documentation

## Overview

This document describes all API integrations used by the Raven UGC Platform.

## Table of Contents

1. [Frontend → Supabase](#frontend--supabase)
2. [Frontend → n8n Webhook](#frontend--n8n-webhook)
3. [n8n → Key AI](#n8n--key-ai)
4. [n8n → OpenAI](#n8n--openai)
5. [n8n → Supabase](#n8n--supabase)

---

## Frontend → Supabase

### Authentication

All requests use the Supabase JS client with automatic JWT handling.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

### Sign Up

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure123',
  options: {
    data: { full_name: 'John Doe' }
  }
})
// Auto-triggers: handle_new_user() → 5 free credits
```

### Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure123'
})
```

### Get User Credits

```javascript
const { data } = await supabase
  .from('credits')
  .select('balance, total_purchased, total_used')
  .eq('user_id', user.id)
  .single()
```

### Create Video Record

```javascript
const { data: video } = await supabase
  .from('videos')
  .insert({
    user_id: user.id,
    product_name: 'Creatine Gummies',
    product_photo_url: uploadedImageUrl,
    icp: 'Young adults interested in fitness',
    features: 'Delicious, easy to take daily',
    video_setting: 'Man in car before gym',
    model_selected: 'nano_veo',
    status: 'pending'
  })
  .select()
  .single()
```

### Get User Videos

```javascript
const { data: videos } = await supabase
  .from('videos')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(20)
```

### Real-time Status Updates

```javascript
const channel = supabase
  .channel('video-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'videos',
      filter: `id=eq.${videoId}`
    },
    (payload) => {
      console.log('Video updated:', payload.new)
      if (payload.new.status === 'completed') {
        // Show video player
      } else if (payload.new.status === 'failed') {
        // Show error message
      }
    }
  )
  .subscribe()

// Cleanup when done
channel.unsubscribe()
```

### Upload Product Photo

```javascript
const { data, error } = await supabase.storage
  .from('product-photos')
  .upload(`${user.id}/${filename}`, file, {
    contentType: file.type,
    upsert: false
  })

// Get public URL
const { data: urlData } = supabase.storage
  .from('product-photos')
  .getPublicUrl(`${user.id}/${filename}`)
```

---

## Frontend → n8n Webhook

### Endpoint

```
POST https://n8n.your-domain.com/webhook/ugc-video-generate
```

### Headers

```javascript
{
  'Content-Type': 'application/json',
  'X-API-Key': process.env.NEXT_PUBLIC_N8N_WEBHOOK_KEY
}
```

### Request Body

```json
{
  "user_id": "uuid-of-user",
  "video_id": "uuid-of-video-record",
  "product_name": "Creatine Gummies",
  "product_photo_url": "https://supabase.co/storage/...",
  "icp": "Young adults interested in fitness",
  "features": "Delicious, easy to take daily, no chalky taste",
  "video_setting": "Young man sitting in car before gym workout",
  "timestamp": "2025-01-16T10:30:00Z"
}
```

### Success Response (200)

```json
{
  "success": true,
  "video_id": "uuid-of-video",
  "video_url": "https://cdn.key-ai.com/videos/xyz.mp4",
  "thumbnail_url": "https://cdn.key-ai.com/thumbs/xyz.jpg",
  "generation_time": "127 seconds"
}
```

### Error Responses

**402 - Insufficient Credits**
```json
{
  "success": false,
  "error": "Insufficient credits",
  "credits_required": 1,
  "credits_available": 0
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}
```

**500 - Generation Failed**
```json
{
  "success": false,
  "error": "Video generation timeout",
  "video_id": "uuid-of-video",
  "refunded": true
}
```

### Example Implementation

```javascript
async function triggerVideoGeneration(videoData) {
  const response = await fetch(
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_N8N_WEBHOOK_KEY
      },
      body: JSON.stringify({
        user_id: user.id,
        video_id: videoData.id,
        product_name: videoData.product_name,
        product_photo_url: videoData.product_photo_url,
        icp: videoData.icp,
        features: videoData.features,
        video_setting: videoData.video_setting,
        timestamp: new Date().toISOString()
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }

  return response.json()
}
```

---

## n8n → Key AI

### Base URL

```
https://api.key-ai.com/v1
```

### Authentication

```
Authorization: Bearer {KEY_AI_API_KEY}
```

### Generate Image (Nano Banana)

**Request**
```http
POST /generations
Content-Type: application/json
Authorization: Bearer {KEY_AI_API_KEY}

{
  "model": "nanobanana-pro",
  "prompt": "A young fitness enthusiast holding a bottle of creatine gummies...",
  "image_url": "https://example.com/product-photo.jpg",
  "aspect_ratio": "9:16"
}
```

**Response (202 - Accepted)**
```json
{
  "task_id": "task_abc123xyz",
  "status": "processing",
  "estimated_time": 30
}
```

### Generate Video (Veo 3.1)

**Request**
```http
POST /generations
Content-Type: application/json
Authorization: Bearer {KEY_AI_API_KEY}

{
  "model": "veo3-fast",
  "prompt": "A young man in his car says enthusiastically: 'These creatine gummies are a game-changer!'...",
  "image_url": "https://cdn.key-ai.com/generated-image.png",
  "duration": 8,
  "aspect_ratio": "9:16"
}
```

**Response (202 - Accepted)**
```json
{
  "task_id": "task_xyz789abc",
  "status": "processing",
  "estimated_time": 120
}
```

### Check Status

**Request**
```http
GET /generations/{task_id}
Authorization: Bearer {KEY_AI_API_KEY}
```

**Response - Processing**
```json
{
  "task_id": "task_abc123xyz",
  "status": "processing",
  "progress": 45
}
```

**Response - Success**
```json
{
  "task_id": "task_abc123xyz",
  "status": "success",
  "result": {
    "image_url": "https://cdn.key-ai.com/images/abc123.png",
    "video_url": "https://cdn.key-ai.com/videos/abc123.mp4",
    "thumbnail_url": "https://cdn.key-ai.com/thumbs/abc123.jpg"
  }
}
```

**Response - Failed**
```json
{
  "task_id": "task_abc123xyz",
  "status": "failed",
  "error": "Content policy violation"
}
```

### Available Models

| Model | Type | Use Case | Approx. Cost |
|-------|------|----------|--------------|
| `nanobanana-pro` | Image | Product placement images | $0.04 |
| `veo3-fast` | Video | Fast 8-second videos | $0.15 |
| `veo3` | Video | Higher quality videos | $0.25 |
| `sora2` | Video | Premium quality | $0.40 |

---

## n8n → OpenAI

### Endpoint

```
POST https://api.openai.com/v1/chat/completions
```

### Authentication

```
Authorization: Bearer {OPENAI_API_KEY}
```

### Generate Image Prompt

**Request**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert UGC (user-generated content) image prompt creator. Create detailed prompts for AI image generation that show real people using products naturally."
    },
    {
      "role": "user",
      "content": "Create an image prompt for:\nProduct: Creatine Gummies\nFeatures: Delicious, easy to take, no chalky taste\nSetting: Young man in car before gym\n\nThe image should look like authentic UGC content, not an advertisement."
    }
  ],
  "max_tokens": 500,
  "temperature": 0.7
}
```

### Analyze Generated Image (Vision)

**Request**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Describe this image in detail. Focus on: the person's appearance, their expression, the environment, and how the product is positioned. This will be used to generate a video."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://cdn.key-ai.com/generated-image.png"
          }
        }
      ]
    }
  ],
  "max_tokens": 300
}
```

### Generate Video Prompt

**Request**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert UGC video script writer. Create natural, authentic video prompts with dialogue. The video should feel like real user content, not scripted advertising."
    },
    {
      "role": "user",
      "content": "Create a video prompt (8 seconds) for:\nProduct: Creatine Gummies\nFeatures: Delicious, easy to take\nTarget audience: Young fitness enthusiasts\nImage description: A young man in his 20s sitting in a car, holding the product, smiling\n\nInclude natural dialogue (20-30 words). The person should speak directly to camera like they're talking to a friend."
    }
  ],
  "max_tokens": 400,
  "temperature": 0.8
}
```

### Response Format

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "A young man in his 20s sits in his car..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

---

## n8n → Supabase

### Authentication

Use the **Service Role Key** (not anon key) for n8n operations. This bypasses RLS.

```
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
apikey: {SUPABASE_SERVICE_ROLE_KEY}
```

### Call deduct_credit Function

**Request**
```http
POST {SUPABASE_URL}/rest/v1/rpc/deduct_credit
Content-Type: application/json
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
apikey: {SUPABASE_SERVICE_ROLE_KEY}

{
  "p_user_id": "user-uuid",
  "p_video_id": "video-uuid"
}
```

**Response**
```json
true   // Credit deducted successfully
false  // Insufficient credits
```

### Call refund_credit Function

**Request**
```http
POST {SUPABASE_URL}/rest/v1/rpc/refund_credit
Content-Type: application/json
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
apikey: {SUPABASE_SERVICE_ROLE_KEY}

{
  "p_user_id": "user-uuid",
  "p_video_id": "video-uuid"
}
```

### Update Video Status

**Request**
```http
PATCH {SUPABASE_URL}/rest/v1/videos?id=eq.{video-uuid}
Content-Type: application/json
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
apikey: {SUPABASE_SERVICE_ROLE_KEY}
Prefer: return=minimal

{
  "status": "processing"
}
```

### Update Video with Results

**Request**
```http
PATCH {SUPABASE_URL}/rest/v1/videos?id=eq.{video-uuid}
Content-Type: application/json
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
apikey: {SUPABASE_SERVICE_ROLE_KEY}
Prefer: return=minimal

{
  "status": "completed",
  "generated_image_url": "https://cdn.key-ai.com/image.png",
  "generated_video_url": "https://cdn.key-ai.com/video.mp4",
  "thumbnail_url": "https://cdn.key-ai.com/thumb.jpg",
  "image_prompt": "Generated prompt text...",
  "video_prompt": "Generated prompt text...",
  "generation_time_seconds": 127,
  "completed_at": "2025-01-16T10:32:07Z"
}
```

### Update Video with Error

**Request**
```http
PATCH {SUPABASE_URL}/rest/v1/videos?id=eq.{video-uuid}
Content-Type: application/json
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
apikey: {SUPABASE_SERVICE_ROLE_KEY}
Prefer: return=minimal

{
  "status": "failed",
  "error_message": "Video generation timeout after 200 seconds"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 202 | Accepted (async) | Start polling |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check API key |
| 402 | Payment Required | Insufficient credits |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry with backoff |

### Retry Strategy

```javascript
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

async function fetchWithRetry(url, options, retries = 0) {
  try {
    const response = await fetch(url, options)
    if (response.status === 429 && retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY * (retries + 1))
      return fetchWithRetry(url, options, retries + 1)
    }
    return response
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY * (retries + 1))
      return fetchWithRetry(url, options, retries + 1)
    }
    throw error
  }
}
```

---

## Rate Limits

| Service | Limit | Notes |
|---------|-------|-------|
| Key AI | 60 req/min | Per API key |
| OpenAI | 60 req/min | GPT-4 mini tier |
| Supabase | 500 req/min | Free tier |
| n8n Webhook | Custom | Set via rate limiter |

---

## Security Considerations

1. **Never expose service role keys** in frontend code
2. **Always validate X-API-Key** in n8n webhooks
3. **Use HTTPS** for all API calls
4. **Rotate API keys** monthly
5. **Log errors** but never log sensitive data (keys, passwords)
