# UGC Video Generation Workflow - Complete Flow Explanation

**Workflow ID:** `HfhfnaAh6pm2moJ3`
**Status:** ✅ Working (tested January 18, 2026)
**Total Nodes:** 35
**Average Duration:** 5-6 minutes

---

## 🎯 Overview

This workflow takes product information via webhook → generates UGC-style image → generates UGC-style video → saves results to database.

**Key Features:**
- ✅ Credit-based system with automatic deduction/refund
- ✅ Async polling for AI generation (image: 15-20s, video: 3-5 minutes)
- ✅ Complete error handling with database status updates
- ✅ Automatic refunds on failure

---

## 📊 Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK REQUEST RECEIVED                      │
│              POST /webhook/ugc-video-generate                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Validate API Key│
                    │  (X-API-Key)    │
                    └─────────────────┘
                        │         │
                   ✅ Valid    ❌ Invalid
                        │         │
                        │         └──> [401 Unauthorized Response]
                        ▼
                ┌─────────────────┐
                │ Validate Fields │
                │ (user_id,       │
                │  video_id, etc) │
                └─────────────────┘
                    │         │
               ✅ Valid    ❌ Missing
                    │         │
                    │         └──> [400 Bad Request Response]
                    ▼
            ┌───────────────────┐
            │  Deduct Credit    │
            │  (Supabase RPC)   │
            │  p_user_id        │
            │  p_video_id       │
            └───────────────────┘
                    │
                    ▼
            ┌───────────────────┐
            │ Check Credit      │
            │ Deducted?         │
            └───────────────────┘
                │         │
           ✅ Yes      ❌ No
                │         │
                │         └──> [402 Payment Required Response]
                │
                ▼
    ┌─────────────────────────────────────────┐
    │  STAGE 1: IMAGE GENERATION              │
    └─────────────────────────────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Generate Image   │
        │ Prompt           │
        │ (OpenAI GPT-4o)  │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Extract Prompt   │
        │ from Response    │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Generate Image   │
        │ (KIE.AI FLUX)    │
        │ Submit Job       │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Get Image        │
        │ Task ID          │
        └──────────────────┘
                │
                ▼
      ╔═════════════════════╗
      ║  WAIT 10 SECONDS    ║
      ╚═════════════════════╝
                │
                ▼
        ┌──────────────────┐
        │ Poll Image Status│
        │ (KIE.AI API)     │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Check Image      │
        │ Status           │
        └──────────────────┘
                │
        ┌───────┴────────┐
        │                │
    ✅ Ready      ❌ Not Ready
        │                │
        │                └──> Loop back to WAIT
        │
        ▼
    ┌───────┴────────┐
    │                │
  ✅ Success    ❌ Error
    │                │
    │                └──> [Update DB: failed]
    │                     [Refund Credit]
    │                     [Respond: Image Failed]
    │
    ▼
    ┌─────────────────────────────────────────┐
    │  STAGE 2: VIDEO GENERATION              │
    └─────────────────────────────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Analyze Image    │
        │ (OpenAI Vision)  │
        │ Get Setting/Mood │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Extract Video    │
        │ Prompt           │
        │ (Code Node)      │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Generate Video   │
        │ (KIE.AI Veo 3.1) │
        │ Submit Job       │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Get Video        │
        │ Task ID          │
        └──────────────────┘
                │
                ▼
      ╔═════════════════════╗
      ║  WAIT 15 SECONDS    ║
      ╚═════════════════════╝
                │
                ▼
        ┌──────────────────┐
        │ Poll Video Status│
        │ (KIE.AI API)     │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Check Video      │
        │ Status           │
        └──────────────────┘
                │
        ┌───────┴────────┐
        │                │
    ✅ Ready      ❌ Not Ready
        │                │
        │                └──> Loop back to WAIT
        │
        ▼
    ┌─────────────────────────────────────────┐
    │  STAGE 3: SAVE RESULTS                  │
    └─────────────────────────────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Update Video     │
        │ Record           │
        │ (Supabase PATCH) │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Check if Refund  │
        │ Needed           │
        └──────────────────┘
                │
        ┌───────┴────────┐
        │                │
  ✅ No Refund    ❌ Need Refund
        │                │
        │                └──> [Execute Refund]
        │                     [Supabase RPC]
        │
        ▼
    ┌───────────────────────┐
    │ Respond Success       │
    │ (return image_url,    │
    │  video_url,           │
    │  generation_time)     │
    └───────────────────────┘
```

---

## 🔍 Detailed Node-by-Node Breakdown

### **1. Webhook Trigger**
- **Type:** `n8n-nodes-base.webhook`
- **Path:** `/webhook/ugc-video-generate`
- **Method:** POST
- **What it does:** Receives incoming requests and extracts data
- **Output:**
  ```json
  {
    "headers": { "x-api-key": "..." },
    "body": {
      "user_id": "uuid",
      "video_id": "uuid",
      "product_name": "...",
      "features": "...",
      "target_audience": "..."
    }
  }
  ```

---

### **2. Validate API Key**
- **Type:** `n8n-nodes-base.if`
- **Condition:** `$json.headers['x-api-key'] === 'nHChN19vbgeSPiDMkfQWsmZ3u2TcBK6y'`
- **What it does:** Security check - ensures request has valid API key
- **On Success:** Continue to field validation
- **On Failure:** Return 401 Unauthorized

---

### **3. Validate Fields**
- **Type:** `n8n-nodes-base.code`
- **What it does:** Checks if all required fields are present
- **Required Fields:**
  - `user_id` (UUID)
  - `video_id` (UUID)
  - `product_name` (string)
  - `product_photo_url` (URL)
- **Output:**
  ```json
  {
    ...previousData,
    "validation": {
      "isValid": true/false,
      "missingFields": []
    }
  }
  ```

---

### **4. Check Fields Valid**
- **Type:** `n8n-nodes-base.if`
- **Condition:** `$json.validation.isValid === true`
- **On Success:** Proceed to credit deduction
- **On Failure:** Return 400 Bad Request with missing fields list

---

### **5. Deduct Credit**
- **Type:** `n8n-nodes-base.httpRequest`
- **Method:** POST
- **URL:** `https://crgbmbotbmzfibzupdhi.supabase.co/rest/v1/rpc/deduct_credit`
- **Body:**
  ```json
  {
    "p_user_id": "uuid",
    "p_video_id": "uuid"
  }
  ```
- **What it does:**
  - Calls Supabase RPC function
  - Deducts 1 credit from user's balance atomically
  - Creates transaction record
  - **IMPORTANT:** Requires video record to exist in database first
- **Returns:** `true` (success) or `false` (insufficient credits)

---

### **6. Check Credit Result**
- **Type:** `n8n-nodes-base.code`
- **What it does:** Parses the deduction result
- **Logic:**
  ```javascript
  const response = $input.first().json;
  const creditDeducted = (response === true);
  ```
- **Output:**
  ```json
  {
    ...previousData,
    "creditDeducted": true/false,
    "startTime": Date.now()
  }
  ```

---

### **7. Credit Deducted?**
- **Type:** `n8n-nodes-base.if`
- **Condition:** `$json.creditDeducted === true`
- **On Success:** Start image generation
- **On Failure:** Return 402 Payment Required

---

## 🖼️ IMAGE GENERATION STAGE (Nodes 8-18)

### **8. Generate Image Prompt**
- **Type:** `n8n-nodes-base.httpRequest`
- **API:** OpenAI Chat Completion
- **Model:** `gpt-4o-mini`
- **What it does:** Generates a detailed FLUX image prompt from product info
- **Input Variables:**
  - `$json.body.product_name`
  - `$json.body.product_category`
- **Returns:** JSON with `choices[0].message.content` containing the prompt

---

### **9. Extract Image Prompt**
- **Type:** `n8n-nodes-base.code`
- **What it does:** Extracts the prompt text from OpenAI response
- **Code:**
  ```javascript
  const openaiResp = $input.first().json;
  const imagePrompt = openaiResp.choices[0].message.content.trim();
  return [{ json: { ...prevData, imagePrompt } }];
  ```

---

### **10. Generate Image - KIE.AI**
- **Type:** `n8n-nodes-base.httpRequest`
- **API:** KIE.AI FLUX Kontext
- **URL:** `https://api.kie.ai/api/v1/flux/kontext/generate`
- **Body:**
  ```json
  {
    "prompt": "...",
    "aspectRatio": "1:1",
    "outputFormat": "jpeg",
    "model": "flux-kontext-pro"
  }
  ```
- **Returns:** `{ data: { taskId: "..." } }`

---

### **11. Get Image Task ID**
- **Type:** `n8n-nodes-base.code`
- **Extracts:** `taskId` from KIE.AI response
- **Output:**
  ```json
  {
    ...prevData,
    "imageTaskId": "task-id-here",
    "imageAttempts": 0
  }
  ```

---

### **12. Wait for Image**
- **Type:** `n8n-nodes-base.wait`
- **Duration:** 10 seconds
- **What it does:** Pauses execution to allow image generation to progress

---

### **13. Poll Image Status**
- **Type:** `n8n-nodes-base.httpRequest`
- **URL:** `https://api.kie.ai/api/v1/flux/kontext/record-info?taskId={{imageTaskId}}`
- **What it does:** Checks if image generation is complete
- **Returns:**
  ```json
  {
    "data": {
      "successFlag": 1,  // 1 = success, 0 = pending
      "response": {
        "resultImageUrl": "https://..."
      }
    }
  }
  ```

---

### **14. Check Image Status**
- **Type:** `n8n-nodes-base.code`
- **What it does:** Parses poll response and determines if complete
- **Logic:**
  ```javascript
  let imageComplete = false;
  let imageUrl = '';
  let hasError = false;

  if (pollResp.data.successFlag === 1) {
    imageUrl = pollResp.data.response.resultImageUrl;
    imageComplete = true;
  }

  if (attempts >= 30) {  // Timeout after 5 minutes
    hasError = true;
    imageComplete = true;
  }
  ```
- **Output:**
  ```json
  {
    ...prevData,
    "generatedImageUrl": "url or empty",
    "imageComplete": true/false,
    "imageAttempts": number,
    "hasImageError": true/false,
    "imageErrorMessage": "error or empty"
  }
  ```

---

### **15. Image Ready?**
- **Type:** `n8n-nodes-base.if`
- **Condition:** `$json.imageComplete === true` OR `$json.imageAttempts >= 12`
- **On True:** Check if success or error
- **On False:** Loop back to "Wait for Image"

---

### **16. Image Generation Failed?**
- **Type:** `n8n-nodes-base.if`
- **Condition:** `$json.hasImageError === true`
- **On True:** Update database as failed → Refund credit → Respond error
- **On False:** Continue to video generation

---

### **17-19. Error Handling Nodes**
- **Update Failed Status:** PATCH to videos table with status='failed'
- **Refund Credit:** Calls `refund_credit()` RPC function
- **Respond Image Failed:** Returns 500 error with message

---

## 🎬 VIDEO GENERATION STAGE (Nodes 20-27)

### **20. Analyze Image - OpenAI**
- **Type:** `n8n-nodes-base.httpRequest`
- **API:** OpenAI Vision (GPT-4o with image input)
- **What it does:** Analyzes the generated image to extract setting/mood for video
- **Input:**
  ```json
  {
    "model": "gpt-4o-mini",
    "messages": [{
      "role": "user",
      "content": [
        { "type": "text", "text": "Analyze this image..." },
        { "type": "image_url", "image_url": { "url": "$json.generatedImageUrl" } }
      ]
    }]
  }
  ```
- **Returns:** Detailed description of image setting, lighting, mood

---

### **21. Extract Video Prompt**
- **Type:** `n8n-nodes-base.code`
- **What it does:** Creates video generation prompt based on:
  - Product name
  - Features
  - Target audience
  - Image analysis (setting/mood)
- **Code Logic:**
  ```javascript
  // Parse image analysis
  const settingMatch = imageAnalysis.match(/SETTING[^:]*:\s*([^\n]+)/i);
  const moodMatch = imageAnalysis.match(/MOOD[^:]*:\s*([^\n]+)/i);

  // Convert features to first-person
  const firstPersonFeatures = features.split(',').map(f =>
    `The ${f.toLowerCase()} is honestly amazing`
  ).join(', ');

  // Build video prompt
  const videoPrompt = `First-person POV testimonial...`;
  ```
- **Output:**
  ```json
  {
    "videoPrompt": "detailed prompt",
    "productName": "...",
    "settingUsed": "...",
    "moodUsed": "..."
  }
  ```

---

### **22. Generate Video - KIE.AI**
- **Type:** `n8n-nodes-base.httpRequest`
- **URL:** `https://api.kie.ai/api/v1/veo/generate`
- **Body:**
  ```json
  {
    "prompt": "videoPrompt",
    "model": "veo3_fast",
    "aspect_ratio": "16:9",
    "imageUrls": ["generatedImageUrl"],
    "generationType": "REFERENCE_2_VIDEO"
  }
  ```
- **Returns:** `{ data: { taskId: "..." } }`

---

### **23-27. Video Polling Loop**
Similar to image polling:
- **Get Video Task ID**
- **Wait 15 seconds** (longer than image wait)
- **Poll Video Status** (unified endpoint: `/api/v1/jobs/recordInfo`)
- **Check Video Status**
- **Video Ready?** (with loop back or continue)

**Key Difference:** Video takes longer (3-5 minutes vs 15-20 seconds for images)

---

## 💾 SAVE RESULTS STAGE (Nodes 28-35)

### **28. Update Video Record**
- **Type:** `n8n-nodes-base.httpRequest`
- **Method:** PATCH
- **URL:** `https://crgbmbotbmzfibzupdhi.supabase.co/rest/v1/videos?id=eq.{{video_id}}`
- **Body:**
  ```json
  {
    "status": "completed" or "failed",
    "image_prompt": "...",
    "video_prompt": "...",
    "generated_image_url": "...",
    "generated_video_url": "...",
    "error_message": null or "error text",
    "completed_at": "ISO timestamp",
    "generation_time_seconds": number
  }
  ```

---

### **29. Check if Refund Needed**
- **Type:** `n8n-nodes-base.code`
- **Logic:**
  ```javascript
  const needsRefund = data.hasImageError || data.hasVideoError || !data.videoComplete;
  ```

---

### **30. Needs Refund?**
- **Type:** `n8n-nodes-base.if`
- **If true:** Execute refund before responding
- **If false:** Respond with success

---

### **31. Execute Refund**
- **Type:** `n8n-nodes-base.httpRequest`
- **URL:** `https://crgbmbotbmzfibzupdhi.supabase.co/rest/v1/rpc/refund_credit`
- **Body:**
  ```json
  {
    "p_user_id": "uuid",
    "p_video_id": "uuid"
  }
  ```
- **What it does:**
  - Adds 1 credit back to user balance
  - Creates refund transaction record

---

### **32. Respond Success**
- **Type:** `n8n-nodes-base.respondToWebhook`
- **Response:**
  ```json
  {
    "success": true/false,
    "message": "...",
    "credit_refunded": true/false,
    "data": {
      "video_id": "uuid",
      "image_url": "https://...",
      "video_url": "https://...",
      "image_prompt": "...",
      "video_prompt": "...",
      "generation_time_seconds": 335,
      "error": null or "error message"
    }
  }
  ```

---

## 📋 Critical Data Flow

### What data is passed through the workflow?

**Initial Input:**
```json
{
  "user_id": "42a140a2-b4c5-4e2e-92bd-449e87f52605",
  "video_id": "bbbbbbbb-cccc-dddd-eeee-000000000001",
  "product_name": "Wireless Earbuds Pro",
  "product_category": "tech",
  "features": "40-hour battery life, noise cancellation, IPX7 waterproof",
  "target_audience": "fitness enthusiasts",
  "product_photo_url": "https://placeholder.com/test.jpg"
}
```

**After Credit Deduction:**
```json
{
  ...inputData,
  "creditDeducted": true,
  "startTime": 1768734003206
}
```

**After Image Generation:**
```json
{
  ...previousData,
  "imagePrompt": "iPhone photo of Wireless Earbuds...",
  "imageTaskId": "task-abc123",
  "generatedImageUrl": "https://cdn.kie.ai/images/xyz.jpg",
  "imageComplete": true,
  "hasImageError": false
}
```

**After Video Generation:**
```json
{
  ...previousData,
  "imageAnalysis": "Setting: Car interior...",
  "videoPrompt": "First-person POV testimonial...",
  "videoTaskId": "task-def456",
  "generatedVideoUrl": "https://cdn.kie.ai/videos/abc.mp4",
  "videoComplete": true,
  "hasVideoError": false
}
```

---

## ⚠️ Critical Dependencies

### **1. Video Record Must Exist First**
The `deduct_credit()` function inserts into `transactions` table with `video_id` foreign key.
**Required:** Video record must exist in `videos` table before calling workflow.

### **2. Polling Mechanism**
- **Image:** 10-second intervals, max 12 attempts (2 minutes timeout)
- **Video:** 15-second intervals, max 20 attempts (5 minutes timeout)

### **3. Success Detection**
**KIE.AI Response Format:**
```json
{
  "data": {
    "successFlag": 1,  // MUST check this, NOT "status"
    "response": {
      "resultImageUrl": "...",
      "videoUrl": "..."
    }
  }
}
```

### **4. Error Handling Paths**
- Invalid API Key → 401 (no credit deduction)
- Missing Fields → 400 (no credit deduction)
- Insufficient Credits → 402 (no credit deduction)
- Image Generation Fails → 500 (credit refunded)
- Video Generation Fails → 500 (credit refunded)

---

## 🔧 How to Test

### **Step 1: Create Video Record**
```sql
INSERT INTO videos (id, user_id, status, product_name, product_photo_url)
VALUES (
  'test-uuid-here',
  'user-uuid-here',
  'processing',
  'Test Product',
  'https://placeholder.com/test.jpg'
);
```

### **Step 2: Send Webhook Request**
```bash
curl -X POST "https://n8n.sam9scloud.in/webhook/ugc-video-generate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: nHChN19vbgeSPiDMkfQWsmZ3u2TcBK6y" \
  -d '{
    "user_id": "user-uuid-here",
    "video_id": "test-uuid-here",
    "product_name": "Test Product",
    "product_category": "tech",
    "features": "feature1, feature2",
    "target_audience": "customers",
    "product_photo_url": "https://placeholder.com/test.jpg"
  }'
```

### **Step 3: Monitor Progress**
```sql
-- Check credit balance
SELECT balance FROM credits WHERE user_id = 'user-uuid-here';

-- Check video status
SELECT status, generated_image_url, generated_video_url, error_message
FROM videos WHERE id = 'test-uuid-here';
```

---

## 📝 Notes on Current Implementation

### ✅ What Works Well
1. **Atomic credit transactions** - No race conditions
2. **Automatic refunds on failure** - Users don't lose credits
3. **Detailed error handling** - Each failure path is handled
4. **Async polling** - Doesn't block on long-running operations
5. **Database status updates** - Full audit trail

### ⚠️ Potential Issues to Watch
1. **Hardcoded API keys** - Must use deployment script to update
2. **No retry logic** - If KIE.AI API is down, workflow fails immediately
3. **Fixed timeouts** - Image: 2min, Video: 5min (not configurable)
4. **Webhook timeout** - HTTP client may timeout before workflow completes

---

**Last Updated:** January 18, 2026
**Status:** ✅ Working baseline (no UGC enhancements)
