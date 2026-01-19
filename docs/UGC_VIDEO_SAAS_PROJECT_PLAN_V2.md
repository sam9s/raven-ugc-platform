# 🎬 UGC VIDEO GENERATION SAAS - PROJECT PLAN V2.0

**Project Name:** UGC Video Studio
**Version:** 2.0 - Architecture Corrected
**Last Updated:** January 19, 2026

---

## 📋 CHANGELOG FROM V1.0

**Critical Architecture Changes:**
1. ✅ **Script Generation Location**: Moved from n8n to Frontend (Next.js API route)
2. ✅ **User Flow**: Added script review/edit step before video generation
3. ✅ **Database Schema**: Added `generated_script_json JSONB` column to videos table
4. ✅ **API Routes**: Added `/api/scripts/generate` for OpenAI script generation
5. ✅ **MVP Scope**: Simplified to Veo 3 Fast only, no multi-model support in Phase 1

---

## 🎯 EXECUTIVE SUMMARY

### The Problem
Creating high-quality UGC (User Generated Content) videos for advertising is:
- **Expensive**: UGC creators charge $80-$200 per video
- **Slow**: 3-5 days turnaround with revisions
- **Limited**: Difficult to A/B test variations
- **Fragmented**: Requires multiple tools

### The Solution
An end-to-end AI-powered UGC video generation platform that:
1. **Generates professional UGC scripts** using OpenAI API (DIFFERENTIATOR)
2. **Creates product images** using AI (KIE.AI FLUX)
3. **Generates UGC-style videos** from those images (KIE.AI Veo 3)
4. **Delivers in minutes** instead of days
5. **Costs 90% less** than hiring UGC creators

### Key Differentiator vs ArcAds
**We are the ONLY platform with built-in AI script generation.**
- ArcAds: User must write their own script
- Us: AI writes conversion-optimized scripts in 60 seconds

---

## 🏗️ SYSTEM ARCHITECTURE (CORRECTED)

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     COMPLETE USER FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. User Opens Frontend (Next.js)
   ↓
2. User Fills 13-Field Form (Product Info + Marketing Details)
   ↓
3. User Clicks "Generate Script"
   ↓
4. Frontend → POST /api/scripts/generate (Next.js API Route)
   ↓
5. Next.js API → OpenAI API (gpt-4o-mini)
   System Prompt: UGC Script Generator Instructions
   User Prompt: 13 fields from form
   ↓
6. OpenAI Returns Structured JSON Script:
   {
     "hook": "Okay so I've been using these...",
     "dream_outcome": "And honestly, my smile...",
     "social_proof": "Over 10,000 reviews...",
     "ease": "You literally just peel...",
     "speed": "I saw results in 3 days",
     "cta": "Link in bio to try them"
   }
   ↓
7. Frontend Displays Script in Editor
   User Can: Edit, Regenerate, or Approve
   ↓
8. User Clicks "Generate Video" (After Approving Script)
   ↓
9. Frontend → POST /api/videos/create (Next.js API Route)
   ↓
10. Next.js API:
    - Authenticate user (Supabase Auth)
    - Create video record in database
    - Save script JSON to videos.generated_script_json
    - Deduct credits via deduct_credit() function
    - Trigger n8n webhook with script
    ↓
11. Next.js API → n8n Webhook
    POST https://n8n.sam9scloud.in/webhook/ugc-video-generate-v2
    Payload: {
      user_id, video_id, product_name, model,
      ugc_script: { hook, dream_outcome, ... }
    }
    ↓
12. n8n Workflow (v2 - Script Enhanced):
    - Receive webhook with script
    - Generate image prompt (uses script.hook context)
    - Generate product image (KIE.AI FLUX)
    - Analyze image (OpenAI Vision)
    - Format video prompt (uses script sections)
    - Generate video (KIE.AI Veo 3 Fast)
    - Update database (status, URLs, generation time)
    ↓
13. Frontend Polls /api/videos/:id/status (every 5 seconds)
    ↓
14. When status = 'completed':
    - Display video player
    - Show download options
    - Credits already deducted (no refund needed on success)
```

---

## 🗄️ DATABASE SCHEMA (UPDATED)

### Key Addition: Script Storage

```sql
-- Videos table (MODIFIED)
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Product info (from form)
  product_name TEXT NOT NULL,
  product_category TEXT,
  target_audience TEXT,
  primary_pain_point TEXT,
  dream_outcome TEXT,
  unique_mechanism TEXT,
  social_proof TEXT,
  ease_of_use TEXT,
  time_to_results TEXT,
  offer_or_cta TEXT,

  -- Photo handling
  product_photo_url TEXT,
  product_photo_source TEXT, -- 'uploaded' or 'ai_generated'

  -- **NEW: Generated UGC Script Storage**
  generated_script_json JSONB,
  -- Structure: {
  --   "hook": "Okay so I've been using...",
  --   "dream_outcome": "And honestly...",
  --   "social_proof": "Over 10,000 reviews...",
  --   "ease": "You literally just...",
  --   "speed": "I saw results in 3 days",
  --   "cta": "Link in bio..."
  -- }

  -- Generation settings
  model_used TEXT DEFAULT 'veo3_fast', -- MVP: only veo3_fast
  credits_used INTEGER DEFAULT 1,      -- MVP: 1 credit per video

  -- Generated content
  image_prompt TEXT,
  generated_image_url TEXT,
  video_prompt TEXT,
  generated_video_url TEXT,
  video_duration_seconds INTEGER,

  -- Status tracking
  status TEXT DEFAULT 'processing',
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  generation_time_seconds INTEGER,

  -- n8n task IDs (for polling)
  image_task_id TEXT,
  video_task_id TEXT
);
```

### Migration Script

```sql
-- Add script storage to existing videos table
ALTER TABLE videos
ADD COLUMN generated_script_json JSONB;

-- Add check constraint for valid JSON structure
ALTER TABLE videos
ADD CONSTRAINT valid_script_structure
CHECK (
  generated_script_json IS NULL OR (
    generated_script_json ? 'hook' AND
    generated_script_json ? 'cta'
  )
);
```

---

## 🎨 FRONTEND ARCHITECTURE

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand (for wizard steps)
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe (Phase 2)

### API Routes

```typescript
// app/api/scripts/generate/route.ts
export async function POST(request: Request) {
  // 1. Authenticate user (Supabase)
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Parse and validate 13-field input
  const body = await request.json();
  const validated = scriptInputSchema.parse(body);

  // 3. Call OpenAI API (server-side, API key hidden)
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: UGC_SCRIPT_SYSTEM_PROMPT },
      { role: 'user', content: formatUserPrompt(validated) }
    ],
    response_format: { type: 'json_object' } // Structured output
  });

  // 4. Return script to frontend
  return Response.json({
    script: JSON.parse(completion.choices[0].message.content)
  });
}

// app/api/videos/create/route.ts
export async function POST(request: Request) {
  // 1. Authenticate user
  const user = await getUser();

  // 2. Parse body (includes approved script)
  const { product_name, ugc_script, model } = await request.json();

  // 3. Create video record in Supabase
  const { data: video } = await supabase
    .from('videos')
    .insert({
      user_id: user.id,
      product_name,
      generated_script_json: ugc_script, // Save script
      model_used: model || 'veo3_fast',
      credits_used: 1,
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  // 4. Deduct credits (atomic operation)
  const creditDeducted = await supabase.rpc('deduct_credit', {
    p_user_id: user.id,
    p_video_id: video.id,
    p_amount: 1
  });

  if (!creditDeducted) {
    // Insufficient credits, delete video record
    await supabase.from('videos').delete().eq('id', video.id);
    return Response.json({ error: 'Insufficient credits' }, { status: 402 });
  }

  // 5. Trigger n8n webhook
  await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.N8N_API_KEY!
    },
    body: JSON.stringify({
      user_id: user.id,
      video_id: video.id,
      product_name,
      model: model || 'veo3_fast',
      ugc_script // Pass script to n8n
    })
  });

  // 6. Return video ID to frontend
  return Response.json({
    success: true,
    video_id: video.id,
    message: 'Video generation started'
  });
}
```

---

## 🔄 N8N WORKFLOW V2 (SCRIPT ENHANCED)

### What Changed from V1 to V2

**V1 (Baseline):**
- Generated image prompts from basic product info
- Generated video prompts from image analysis only
- No UGC script context

**V2 (Script Enhanced):**
- Receives pre-generated UGC script from frontend
- Uses script context for better image generation
- Uses script sections for video prompt formatting
- More authentic UGC-style videos

### New Webhook Payload Format

```json
{
  "user_id": "42a140a2-b4c5-4e2e-92bd-449e87f52605",
  "video_id": "bbbbbbbb-cccc-dddd-eeee-000000000001",
  "product_name": "Teeth Whitening Strips",
  "model": "veo3_fast",
  "ugc_script": {
    "hook": "Okay so I've been using these teeth whitening strips for like 2 weeks now...",
    "dream_outcome": "And honestly, my smile has never looked better",
    "social_proof": "Over 10,000 five-star reviews and my dentist even noticed",
    "ease": "You literally just peel, stick, and wait 30 minutes",
    "speed": "I saw results in just 3 days, which is insane",
    "cta": "Link in bio to try them risk-free"
  }
}
```

### Modified Nodes

**NEW Node 5: Extract UGC Script**
```javascript
// Code node to parse script from webhook
const script = $json.body.ugc_script;

return {
  hook: script.hook,
  dream_outcome: script.dream_outcome,
  social_proof: script.social_proof,
  ease: script.ease,
  speed: script.speed,
  cta: script.cta
};
```

**Modified Node 8: Generate Image Prompt (with script context)**
```javascript
// System prompt now includes script context
const systemPrompt = `You are an expert at creating prompts for FLUX image generation.

Context: This image will be used in a UGC-style video with this hook:
"${script.hook}"

Generate a product photo prompt that matches the authentic, casual vibe of this script.
Focus on realistic settings, natural lighting, and relatable environments.`;
```

**Modified Node 20: Format Video Prompt from Script**
```javascript
// Instead of generating new prompt, format script sections
const videoPrompt = `
Handheld camera footage, casual UGC style.

Scene 1 (0-3s): ${script.hook}
Visual: Close-up of person holding product, natural lighting

Scene 2 (3-10s): ${script.dream_outcome}
Visual: Product in use, genuine expression

Scene 3 (10-20s): ${script.social_proof}
Visual: Product showcase with confident presentation

Scene 4 (20-30s): ${script.ease}
Visual: Simple step-by-step demonstration

Scene 5 (30-40s): ${script.speed}
Visual: Before/after suggestion, excited tone

Scene 6 (40-50s): ${script.cta}
Visual: Direct to camera, clear call-to-action

Style: Authentic UGC, vertical 9:16, natural imperfections, iPhone footage quality
`;

return { video_prompt: videoPrompt };
```

---

## 📅 IMPLEMENTATION ROADMAP

### Phase 1A: n8n Workflow Enhancement (1 Week) ✅ CURRENT PHASE

**Week 1: Days 1-2**
- [ ] Export baseline v1 workflow to Git
- [ ] Clean up repo workflow files
- [ ] Update project plan documents

**Week 1: Days 3-4**
- [ ] Clone v1 → v2 in n8n
- [ ] Add script extraction node
- [ ] Modify image prompt node (add script context)
- [ ] Modify video prompt node (use script sections)

**Week 1: Days 5-7**
- [ ] Test v2 workflow with sample script
- [ ] Document v2 changes
- [ ] Verify video quality improvement

**Success Criteria:**
- V2 workflow generates videos using script context
- No regression in video generation success rate
- Script sections visible in final video output

---

### Phase 1B: Frontend MVP (4 Weeks) 🔜 NEXT PHASE

**Week 2-3: Core Setup**
- [ ] Initialize Next.js 14 project
- [ ] Configure Supabase client (database + auth)
- [ ] Set up Tailwind CSS + shadcn/ui components
- [ ] Implement authentication flow (signup, login, logout)
- [ ] Create dashboard layout

**Week 4-5: Video Creation Wizard**
- [ ] Build 5-step wizard component:
  - Step 1: Product Info (13 fields with tooltips)
  - Step 2: Script Generation & Review (editable)
  - Step 3: Video Settings (model selection - just Veo 3 Fast for now)
  - Step 4: Review & Confirm
  - Step 5: Generation Progress (polling)
- [ ] Implement `/api/scripts/generate` route
- [ ] Implement `/api/videos/create` route
- [ ] Add video status polling hook
- [ ] Build video player component

**Week 6: Polish & Testing**
- [ ] Add credit balance display
- [ ] Create video history page
- [ ] Implement error handling
- [ ] Add loading states and animations
- [ ] End-to-end testing
- [ ] Deploy to Vercel staging

**Success Criteria:**
- User can generate script and review/edit it
- User can generate video using approved script
- Video generation completes successfully
- Credits are deducted correctly

---

### Phase 2: Payments & Expansion (4 Weeks) 🔮 FUTURE

**Features:**
- Stripe integration (buy credits)
- Saved scripts library
- Multiple video models (Veo 2, Sora 2)
- Bulk generation (10 videos at once)
- Analytics dashboard

---

## 💰 PRICING STRATEGY (TO BE FINALIZED)

### Current Cost Estimates

**Per Video (Veo 3 Fast):**
- OpenAI Script Generation (gpt-4o-mini): ~$0.001
- FLUX Image Generation: ~$0.03
- Veo 3 Fast Video Generation: ~$0.07
- Infrastructure + Storage: ~$0.01
- **Total Cost: ~$0.11 per video**

**Target Pricing (85% margin):**
- 1 credit = $0.75 (user pays)
- Cost per video: $0.11
- Gross margin: 85.3%

**MVP Credit Packages:**
- Starter: 10 credits for $7.50 ($0.75/video)
- Popular: 50 credits for $30 ($0.60/video) - 20% discount
- Pro: 200 credits for $100 ($0.50/video) - 33% discount

**Comparison to Competitors:**
- ArcAds: ~$11 per video
- Our pricing: $0.50-0.75 per video
- **Savings: 93-95% cheaper**

---

## 📊 SUCCESS METRICS

### MVP Goals (First 30 Days)

**Activation:**
- 50+ signups
- 60%+ activation rate (signup → first video)

**Quality:**
- 95%+ video generation success rate
- <6 minutes average generation time
- 4.5/5+ user satisfaction

**Business:**
- 100+ videos generated
- $500+ in credit purchases
- <$0.15 cost per video

---

## 🔐 SECURITY CONSIDERATIONS

### API Key Management

**✅ CORRECT (Secure):**
```
Frontend → Next.js API Route (/api/scripts/generate) → OpenAI API
```
- OpenAI API key stays on server
- Never exposed to browser

**❌ WRONG (Insecure):**
```
Frontend → OpenAI API (direct)
```
- Would expose API key in browser
- User could steal key and make unlimited requests

### Environment Variables

```env
# .env (SERVER ONLY - Never commit to Git)
OPENAI_API_KEY=sk-proj-...
KIE_AI_API_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
N8N_API_KEY=...
N8N_WEBHOOK_URL=https://n8n.sam9scloud.in/webhook/ugc-video-generate-v2
WEBHOOK_SECRET=...
```

---

## 📚 DOCUMENTATION FILES

### Current Documentation

1. **UGC-ai-workflow.md** ✅
   - 13-field input schema
   - OpenAI prompt strategy
   - Script structure definition

2. **SYSTEM_FLOW_CONCEPT.md** ✅
   - Conceptual end-to-end flow
   - How webhook works
   - Credit system mechanics

3. **WORKFLOW_EXPLAINED.md** ✅
   - 35-node breakdown of v1 workflow
   - Technical details

4. **THIS FILE (UGC_VIDEO_SAAS_PROJECT_PLAN_V2.md)** ✅
   - Complete project plan with corrected architecture

### To Be Created

5. **ARCHITECTURE_DECISIONS.md** (Next)
   - Why we chose Option A
   - Frontend vs backend script generation trade-offs

6. **N8N_WORKFLOW_V2_CHANGES.md** (Next)
   - Detailed v1 → v2 migration guide
   - New nodes and modifications

7. **API_DOCUMENTATION.md** (Phase 1B)
   - Complete API reference
   - Request/response examples

---

## ✅ NEXT IMMEDIATE ACTIONS

**Today (Phase 1A Start):**
1. ✅ Update this project plan
2. 🔄 Export baseline v1 workflow from n8n
3. 🔄 Clone v1 → v2 in n8n
4. 🔄 Add script handling to v2
5. 🔄 Test v2 with sample script

**Tomorrow:**
6. Document v2 changes
7. Create architecture decisions doc
8. Plan Phase 1B frontend development

---

## 🎯 KEY TAKEAWAYS

1. **Script generation happens in frontend** (via Next.js API route), NOT in n8n
2. **User reviews script** before video generation starts
3. **n8n receives approved script** and uses it for context
4. **MVP uses Veo 3 Fast only** - keep it simple
5. **Database stores script JSON** for future reference/reuse
6. **Security**: API keys never exposed to browser

---

**Last Updated:** January 19, 2026
**Version:** 2.0
**Status:** Phase 1A In Progress
