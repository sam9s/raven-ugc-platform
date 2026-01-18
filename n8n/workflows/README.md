# n8n Workflows

## Production Workflow

**File:** `ugc-video-generation-WORKING-v1.json`

**Status:** ✅ Production Ready (Tested Jan 18, 2025)

**Last Successful Test:** Execution 5520 - 5 min 35 sec - 100% success

---

## 🔐 API Key Configuration

**IMPORTANT:** This workflow file contains **placeholders** for API keys, not real keys.

### Why Placeholders?

- ✅ **Security**: Never commit real API keys to Git
- ✅ **Transparency**: Anyone can see the workflow structure
- ✅ **Version Control**: Safe to track changes in Git

### The Problem with n8n

n8n has `N8N_BLOCK_ENV_ACCESS_IN_NODE=true`, which means:
- ❌ Cannot use `$env.KIE_AI_API_KEY` in expressions
- ❌ Cannot read from `.env` file in workflow
- ✅ Must hardcode keys OR use deployment script

### How to Deploy (2 Options)

#### Option 1: Use Deployment Script (Recommended) ⭐

The script reads your `.env` file and creates a production-ready workflow:

```bash
# Install dependencies
cd scripts
npm install

# Run deployment script
npm run deploy-workflow
```

This creates `ugc-video-generation-DEPLOYED.json` with real API keys from your `.env` file.

**Then import the DEPLOYED file into n8n:**
1. Go to https://n8n.sam9scloud.in
2. Import `n8n/workflows/ugc-video-generation-DEPLOYED.json`
3. Activate workflow

**Note:** The DEPLOYED file is gitignored (contains real keys).

---

#### Option 2: Manual Replacement

If you don't want to use the script:

1. **Copy the template:**
   ```bash
   cp ugc-video-generation-WORKING-v1.json ugc-video-generation-DEPLOYED.json
   ```

2. **Replace placeholders** in the DEPLOYED file:
   - Find `YOUR_KIE_AI_API_KEY` → Replace with value from `.env` → `KIE_AI_API_KEY`
   - Find `YOUR_OPENAI_API_KEY` → Replace with value from `.env` → `OPENAI_API_KEY`

3. **Import DEPLOYED file** into n8n

---

### Placeholder → Environment Variable Mapping

| Placeholder | Environment Variable | Found in .env |
|-------------|---------------------|---------------|
| `YOUR_KIE_AI_API_KEY` | `KIE_AI_API_KEY` | Line 29 |
| `YOUR_OPENAI_API_KEY` | `OPENAI_API_KEY` | Line 26 |

---

## 📋 Workflow Overview

### What It Does
Generates UGC-style video advertisements from product information using:
- **OpenAI GPT-4o-mini** - Prompt generation and image analysis
- **KIE.AI FLUX Kontext** - Product image generation
- **KIE.AI Veo 3.1 Fast** - Video generation
- **Supabase** - Credit management and data storage

### Performance
- **Image Generation:** 15-20 seconds
- **Video Generation:** 3-5 minutes
- **Total Duration:** 5-6 minutes
- **Success Rate:** 100% (recent tests)

### Features
✅ Automatic polling with timeouts
✅ Error handling with credit refunds
✅ Database status updates
✅ Webhook response with generated URLs

---

## 🚀 Import Instructions

1. **Prepare API Keys** (see above)
2. **Import Workflow**
   - Go to n8n dashboard
   - Click **Workflows** → **Import from File**
   - Select `ugc-video-generation-WORKING-v1.json`
3. **Activate Workflow**
   - Toggle workflow to **Active**
   - Verify webhook URL is accessible
4. **Test**
   - Send test request (see SETUP_GUIDE.md)
   - Monitor execution in n8n

---

## 🔍 Technical Details

### API Endpoints
- **KIE.AI Image:** `POST /api/v1/flux/kontext`
- **KIE.AI Image Poll:** `GET /api/v1/flux/kontext/record-info`
- **KIE.AI Video:** `POST /api/v1/veo/create-veo-3-video`
- **KIE.AI Video Poll:** `GET /api/v1/jobs/recordInfo` (unified endpoint)

### Response Format
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "successFlag": 1,
    "response": {
      "resultImageUrl": "...",
      "videoUrl": "..."
    }
  }
}
```

**Critical:** Must check `successFlag === 1` (not `status === 'completed'`)

---

## 📚 Documentation

- [SETUP_GUIDE.md](../../SETUP_GUIDE.md) - Complete setup and testing instructions
- [WORKFLOW_SUCCESS_REPORT.md](../../WORKFLOW_SUCCESS_REPORT.md) - Technical documentation
- [NEXT_STEPS.md](../../NEXT_STEPS.md) - Future development options

---

## ⚠️ Security Notes

- **Never commit API keys to Git**
- This file uses placeholders to prevent accidental exposure
- Always use environment variables or n8n credentials in production
- The actual workflow running on n8n has real keys configured

---

**Last Updated:** January 18, 2025
**Workflow Version:** v1 (Production)
**Status:** ✅ Tested and verified working
