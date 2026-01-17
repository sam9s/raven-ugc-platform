# Raven Solutions - UGC Ads Generator Platform
## Complete Design Document v1.0

**Last Updated:** January 16, 2026  
**Project Manager:** Sammy  
**Solution Architect:** Claude (Anthropic)  
**Developer:** Claude Code (VSCode Extension)

---

## Document Control

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 16, 2026 | Initial design document |

### Purpose
This document serves as the single source of truth for building the Raven Solutions UGC Ads Generator SaaS platform. It provides:
- Complete system architecture
- Database schema with SQL migrations
- API contracts and integration points
- Business logic and requirements
- Implementation roadmap

**Target Audience:** Claude Code (n8n workflow builder), future developers

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [n8n Workflow Logic](#4-n8n-workflow-logic)
5. [API Specifications](#5-api-specifications)
6. [Frontend Requirements](#6-frontend-requirements)
7. [Security & Authentication](#7-security--authentication)
8. [Phase 1 Implementation](#8-phase-1-implementation)
9. [Deployment & Configuration](#9-deployment--configuration)
10. [Future Enhancements](#10-future-enhancements)

---

## 1. Executive Summary

### 1.1 Product Vision
A credit-based SaaS platform that generates professional UGC-style video advertisements using AI models (Veo 3.1, Sora 2, Nano Banana), eliminating the need for human actors and traditional video production.

### 1.2 Core Value Proposition
- **Speed:** 2-3 minutes per video vs. days
- **Cost:** $0.20 per video vs. $500-5000 traditional UGC
- **Scale:** Generate hundreds of variations for A/B testing
- **Quality:** Authentic-looking videos powered by state-of-the-art AI

### 1.3 Target Market
- Primary: E-commerce brands (Shopify, Amazon sellers)
- Secondary: Digital marketing agencies
- Tertiary: Content creators, social media managers

### 1.4 Business Model
**Credit-based SaaS pricing:**

| Plan | Videos/Month | Price | Cost (20¢/video) | Margin |
|------|--------------|-------|------------------|--------|
| Starter | 25 | $29 | $5 | 83% |
| Pro | 100 | $99 | $20 | 80% |
| Agency | 300 | $249 | $60 | 76% |

**Phase 1 MVP Goal:** 3-5 beta clients, 100+ videos generated

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER                          │
│              (Lovable/React + Vercel)                     │
│                                                           │
│  • Landing page + Authentication                          │
│  • Video generation form                                  │
│  • Dashboard (credits, video history)                     │
│  • Real-time status updates                               │
└─────────────────────┬────────────────────────────────────┘
                      │
                      │ REST API + Real-time Subscriptions
                      ▼
┌──────────────────────────────────────────────────────────┐
│              AUTH & DATABASE LAYER                        │
│                   (Supabase)                              │
│                                                           │
│  • Authentication (email/password)                        │
│  • PostgreSQL Database:                                   │
│    - users, user_profiles, credits                        │
│    - videos, transactions                                 │
│  • Row-level Security (RLS)                               │
│  • Real-time subscriptions (video status)                 │
│  • Storage (product photos, thumbnails)                   │
└─────────────────────┬────────────────────────────────────┘
                      │
                      │ Webhook Triggers (HTTPS + Auth)
                      ▼
┌──────────────────────────────────────────────────────────┐
│              AUTOMATION LAYER                             │
│           (n8n - Self-hosted on VPS)                      │
│                                                           │
│  Main Workflow: Video Generation Pipeline                 │
│    1. Validate webhook request                            │
│    2. Deduct credit (Supabase function)                   │
│    3. Generate image prompt (OpenAI GPT-4 mini)           │
│    4. Create product image (Nano Banana)                  │
│    5. Analyze image (OpenAI Vision)                       │
│    6. Generate video prompt (OpenAI GPT-4 mini)           │
│    7. Create video (Veo 3.1 Fast)                         │
│    8. Update Supabase with results                        │
│    9. Handle errors + refund on failure                   │
│                                                           │
└─────────────────────┬────────────────────────────────────┘
                      │
                      │ API Calls (HTTPS)
                      ▼
┌──────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                            │
│                                                           │
│  • Key AI (image & video generation)                      │
│  • OpenAI (prompt generation, image analysis)             │
│  • VPS Storage (generated videos)                         │
│  • Google Drive API (Phase 2)                             │
│  • Stripe (Phase 2 - payments)                            │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User submits form → Frontend validates input
                            ↓
                   Uploads product photo to Supabase Storage
                            ↓
                   Creates video record in database (status: pending)
                            ↓
                   Checks credit balance (>= 1)
                            ↓
                   Triggers n8n webhook (secure, authenticated)
                            ↓
          n8n deducts credit atomically (Supabase function)
                            ↓
          Updates video status → 'processing'
                            ↓
          OpenAI generates image prompt
                            ↓
          Key AI (Nano Banana) creates image with product
                            ↓
          Wait/poll loop until image ready
                            ↓
          OpenAI analyzes generated image
                            ↓
          OpenAI generates video prompt (with dialogue)
                            ↓
          Key AI (Veo 3.1) creates video from image
                            ↓
          Wait/poll loop until video ready
                            ↓
          Updates video record: status = 'completed', video_url, etc.
                            ↓
          Frontend receives real-time update (Supabase subscription)
                            ↓
          User downloads video

[Error Branch: Refund credit, update status = 'failed', log error]
```

### 2.3 Tech Stack

| Layer | Technology | Purpose | Hosting |
|-------|-----------|---------|---------|
| Frontend | Lovable → React 18 | UI/UX | Vercel (free) |
| Styling | Tailwind CSS | Design system | N/A |
| Auth/DB | Supabase | PostgreSQL + Auth | Supabase Cloud (free tier) |
| Automation | n8n (latest) | Workflow engine | Hostinger VPS |
| AI Gateway | Key AI | Access to Veo, Sora, Nano Banana | Cloud API |
| AI Models | OpenAI GPT-4 mini | Prompt generation | OpenAI API |
| Storage | Supabase Storage | Product photos, thumbnails | Supabase |
| Monitoring | Supabase Logs | Error tracking | Supabase |

### 2.4 Why This Stack?

**Lovable (Phase 1):**
- Rapid prototyping (beautiful UI in minutes)
- Professional SaaS design out-of-the-box
- Can export code for migration to React later

**Supabase:**
- Built-in authentication (email/password)
- PostgreSQL with Row-Level Security
- Real-time subscriptions (live status updates)
- Free tier: 50K MAU, 500MB database
- No separate backend needed

**n8n (Self-hosted):**
- Full control (no monthly fees)
- Visual workflow builder
- Rich integration library
- Already hosted on Hostinger VPS

**Key AI:**
- Single API for multiple models
- Flat per-video pricing (~$0.15-0.20)
- OpenAI-compatible format
- No minimum commitments

---

## 3. Database Schema

### 3.1 Tables Overview

**Core Tables:**
1. `auth.users` - Managed by Supabase (email, password)
2. `user_profiles` - Extended user info
3. `credits` - Credit balance tracking
4. `videos` - Video generation records
5. `transactions` - Credit usage history

### 3.2 Complete SQL Schema

```sql
-- ============================================
-- SUPABASE SETUP SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: user_profiles
-- Extended user information
-- ============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- TABLE: credits
-- User credit balance tracking
-- ============================================
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credits_user ON credits(user_id);

-- RLS Policies
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON credits FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can update (via backend)
CREATE POLICY "Service role can manage credits"
  ON credits FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- TABLE: videos
-- Video generation records
-- ============================================
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Input Data
  product_name VARCHAR(255) NOT NULL,
  product_photo_url TEXT NOT NULL,
  icp TEXT,
  features TEXT,
  video_setting TEXT,
  model_selected VARCHAR(50) NOT NULL DEFAULT 'nano_veo',
  -- Options: 'nano_veo', 'veo', 'sora2'
  
  -- Generation Results
  status VARCHAR(20) DEFAULT 'pending',
  -- Options: 'pending', 'processing', 'completed', 'failed'
  image_prompt TEXT,
  video_prompt TEXT,
  generated_image_url TEXT,
  generated_video_url TEXT,
  thumbnail_url TEXT,
  
  -- Metadata
  generation_time_seconds INTEGER,
  error_message TEXT,
  credits_used INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_videos_user_created ON videos(user_id, created_at DESC);
CREATE INDEX idx_videos_status ON videos(status);

-- RLS Policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos"
  ON videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create videos"
  ON videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update videos"
  ON videos FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================
-- TABLE: transactions
-- Credit purchase/usage log
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'deduction', 'refund')),
  amount INTEGER NOT NULL,
  description TEXT,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  stripe_payment_id VARCHAR(255), -- Phase 2
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- FUNCTION: deduct_credit
-- Atomically deduct credit and log transaction
-- ============================================
CREATE OR REPLACE FUNCTION deduct_credit(
  p_user_id UUID,
  p_video_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Lock row for update
  SELECT balance INTO current_balance
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check sufficient credits
  IF current_balance < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credit
  UPDATE credits
  SET 
    balance = balance - 1,
    total_used = total_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, description, video_id)
  VALUES (
    p_user_id,
    'deduction',
    -1,
    'Video generation',
    p_video_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: refund_credit
-- Refund credit if generation fails
-- ============================================
CREATE OR REPLACE FUNCTION refund_credit(
  p_user_id UUID,
  p_video_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE credits
  SET 
    balance = balance + 1,
    total_used = total_used - 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  INSERT INTO transactions (user_id, type, amount, description, video_id)
  VALUES (
    p_user_id,
    'refund',
    1,
    'Failed generation refund',
    p_video_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: handle_new_user
-- Give 5 free credits on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO user_profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  
  -- Grant 5 free credits
  INSERT INTO credits (user_id, balance, total_purchased)
  VALUES (NEW.id, 5, 5);
  
  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'purchase', 5, 'Welcome bonus - 5 free credits');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: Updated timestamp trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.3 Sample Data

```sql
-- Example: Manually add credits to a user (admin use)
-- Replace 'user-uuid-here' with actual user ID from auth.users

UPDATE credits
SET balance = balance + 25,
    total_purchased = total_purchased + 25
WHERE user_id = 'user-uuid-here';

INSERT INTO transactions (user_id, type, amount, description)
VALUES ('user-uuid-here', 'purchase', 25, 'Manual credit purchase');
```

---

## 4. n8n Workflow Logic

### 4.1 Main Workflow: Video Generation

**Workflow Name:** `ugc-video-generation-v1`  
**Trigger:** Webhook POST `/webhook/ugc-video-generate`

#### High-Level Flow

```
1. WEBHOOK RECEIVER
   - Validate X-API-Key header
   - Extract: user_id, video_id, product_name, product_photo_url,
              icp, features, video_setting, timestamp
   - Validate required fields

2. CREDIT CHECK & DEDUCTION
   - Call Supabase function: deduct_credit(user_id, video_id)
   - If FALSE → Return 402 "Insufficient credits"
   - If TRUE → Continue

3. UPDATE VIDEO STATUS
   - Supabase UPDATE: status = 'processing'

4. GENERATE IMAGE PROMPT
   - OpenAI GPT-4 mini
   - System prompt: "Expert UGC image prompter"
   - Input: product_name, features, video_setting
   - Output: Detailed image prompt
   - Clean: Remove newlines, quotes

5. GENERATE PRODUCT IMAGE (Nano Banana)
   - HTTP POST to Key AI
   - Model: nanobanana-pro
   - Inputs: image_prompt, product_photo_url
   - Aspect ratio: 9:16
   - Get task_id

6. WAIT & POLL IMAGE STATUS
   - Wait 5 seconds
   - Check Key AI status endpoint
   - Loop until status = 'success' (max 20 loops)
   - If timeout → Error branch

7. ANALYZE GENERATED IMAGE
   - OpenAI Vision (gpt-4o-mini)
   - Input: generated_image_url
   - Output: Description of person, environment, product

8. GENERATE VIDEO PROMPT
   - OpenAI GPT-4 mini
   - System prompt: "Expert UGC video creator"
   - Inputs: product features, ICP, image analysis, setting
   - Output: Video prompt + dialogue (20-30 words)
   - Clean: Remove newlines, replace quotes

9. GENERATE VIDEO (Veo 3.1)
   - HTTP POST to Key AI
   - Model: veo3-fast
   - Inputs: video_prompt, generated_image_url
   - Duration: 8 seconds
   - Aspect ratio: 9:16
   - Get task_id

10. WAIT & POLL VIDEO STATUS
    - Wait 10 seconds
    - Check Key AI status endpoint
    - Loop until status = 'success' (max 20 loops)
    - If timeout → Error branch

11. UPDATE VIDEO RECORD (SUCCESS)
    - Supabase UPDATE:
      * status = 'completed'
      * generated_image_url
      * generated_video_url
      * thumbnail_url
      * image_prompt, video_prompt
      * generation_time_seconds
      * completed_at = NOW()

12. RESPOND TO WEBHOOK
    - Return 200 OK with video details

ERROR HANDLING BRANCH:
- Update video: status = 'failed', error_message
- Call refund_credit(user_id, video_id)
- Return 500 with error details
```

#### Key Technical Details

**Webhook Authentication:**
- Header: `X-API-Key: {N8N_WEBHOOK_SECRET}`
- Validate before processing

**Credit Deduction:**
- MUST happen before expensive AI calls
- Use Supabase function (atomic transaction)
- Prevents race conditions

**Retry Logic:**
- Image generation: Max 100 seconds (20 × 5sec)
- Video generation: Max 200 seconds (20 × 10sec)
- On timeout: Trigger error branch

**Error Handling:**
- Catch errors at ANY node
- Always refund credit on failure
- Update video status to 'failed'
- Log error_message in database
- Return meaningful error to frontend

**Prompt Cleaning:**
- Remove `\n` (newlines) → Key AI rejects them
- Replace `"` with `'` → Prevents JSON breakage
- Trim whitespace

### 4.2 Environment Variables (n8n)

```bash
# Add to n8n → Settings → Environments

# Key AI
KEY_AI_API_KEY=your_key_ai_api_key

# OpenAI
OPENAI_API_KEY=sk-your_openai_key

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # NOT anon key!

# Webhook Security
N8N_WEBHOOK_SECRET=generate_32_char_random_string

# Optional: n8n public URL
N8N_PUBLIC_URL=https://n8n.your-domain.com
```

**Security Note:** Never hardcode these in workflows. Always use n8n Credentials system.

### 4.3 Workflow Patterns to Use

**Pattern 1: Async API with Polling**
```
POST request → Get task_id → Wait → GET status → Loop if not ready
```
Use for: Nano Banana, Veo 3.1

**Pattern 2: Error Branch with Cleanup**
```
Main flow → On Error → Update DB → Refund → Respond error
```
Connect error output of ALL expensive nodes to error handler.

**Pattern 3: Data Transformation**
```
Raw API response → Code node → Clean/format → Next node
```
Use for: Cleaning prompts, calculating durations

---

## 5. API Specifications

### 5.1 Frontend → Supabase

**Authentication:**
All requests use Supabase JS client with automatic JWT handling.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

**Sign Up:**
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

**Get Credits:**
```javascript
const { data } = await supabase
  .from('credits')
  .select('balance, total_purchased, total_used')
  .eq('user_id', user.id)
  .single()
```

**Create Video Record:**
```javascript
const { data: video } = await supabase
  .from('videos')
  .insert({
    user_id: user.id,
    product_name: 'Creatine Gummies',
    product_photo_url: uploadedImageUrl,
    icp: 'Young adults',
    features: 'Delicious, easy to take',
    video_setting: 'Man in car before gym',
    model_selected: 'nano_veo',
    status: 'pending'
  })
  .select()
  .single()
```

**Real-time Status Updates:**
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
      if (payload.new.status === 'completed') {
        // Show video in UI
      }
    }
  )
  .subscribe()
```

### 5.2 Frontend → n8n Webhook

**Endpoint:** `https://your-n8n-domain.com/webhook/ugc-video-generate`

**Request:**
```javascript
const response = await fetch('https://n8n.example.com/webhook/ugc-video-generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.NEXT_PUBLIC_N8N_WEBHOOK_KEY
  },
  body: JSON.stringify({
    user_id: user.id,
    video_id: videoRecord.id,
    product_name: formData.productName,
    product_photo_url: imageUrl,
    icp: formData.icp,
    features: formData.features,
    video_setting: formData.setting,
    timestamp: new Date().toISOString()
  })
})
```

**Success Response (200):**
```json
{
  "success": true,
  "video_id": "uuid",
  "video_url": "https://cdn.key-ai.com/videos/xyz.mp4",
  "thumbnail_url": "https://cdn.key-ai.com/thumbs/xyz.jpg",
  "generation_time": "127 seconds"
}
```

**Error Response (402):**
```json
{
  "success": false,
  "error": "Insufficient credits"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Video generation timeout",
  "video_id": "uuid"
}
```

### 5.3 n8n → Key AI

**Base URL:** `https://api.key-ai.com/v1`

**Generate (Nano Banana or Veo):**
```http
POST /generations
Authorization: Bearer {KEY_AI_API_KEY}
Content-Type: application/json

{
  "model": "nanobanana-pro",  // or "veo3-fast"
  "prompt": "Detailed prompt...",
  "image_url": "https://source-image.jpg",
  "aspect_ratio": "9:16"
}

Response (202):
{
  "task_id": "abc123",
  "status": "processing"
}
```

**Check Status:**
```http
GET /generations/{task_id}

Response (200) - Success:
{
  "task_id": "abc123",
  "status": "success",
  "result": {
    "image_url": "https://cdn.key-ai.com/xyz.png",
    "video_url": "https://cdn.key-ai.com/xyz.mp4"
  }
}
```

### 5.4 n8n → OpenAI

**Chat Completion:**
```http
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer {OPENAI_API_KEY}
Content-Type: application/json

{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert UGC prompt generator..."
    },
    {
      "role": "user",
      "content": "Product: Creatine Gummies\nFeatures: ..."
    }
  ],
  "max_tokens": 500,
  "temperature": 0.7
}
```

---

## 6. Frontend Requirements

### 6.1 Pages & Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page (marketing) | No |
| `/login` | Sign in | No |
| `/signup` | Create account | No |
| `/dashboard` | User home (credits, videos) | Yes |
| `/create` | Video generation form | Yes |
| `/videos/:id` | Single video view/download | Yes |
| `/account` | Profile settings | Yes |

### 6.2 Key Components

**Dashboard:**
- Credit balance (large, prominent)
- "Create New Video" CTA button
- Video history table (recent 20)
  - Columns: Product name, Status, Created, Actions
  - Status badge (pending/processing/completed/failed)
  - Download button (if completed)

**Create Video Form:**
- Product name (text input)
- Product photo (file upload, max 5MB, jpg/png only)
- ICP - Ideal Customer Profile (textarea)
- Features (textarea, "e.g., Delicious, easy to take daily...")
- Video setting (textarea, "e.g., Young woman in coffee shop...")
- Model selector (dropdown):
  - "Nano Banana + Veo 3.1" (recommended)
  - "Veo 3.1 Only"
  - "Sora 2" (Phase 2)
- Submit button (disabled if balance < 1)

**Video Result Page:**
- Status indicator:
  - Pending: "Queued..."
  - Processing: "Generating... (real-time updates)"
  - Completed: Show video player
  - Failed: Error message + refund notice
- Video preview (HTML5 video player)
- Download button
- "Create Another" button
