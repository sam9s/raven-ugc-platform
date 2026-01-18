# n8n Workflows

## Production Workflow

**File:** `ugc-video-generation-WORKING-v1.json`

**Status:** ✅ Production Ready (Tested Jan 18, 2025)

**Last Successful Test:** Execution 5520 - 5 min 35 sec - 100% success

---

## 🔐 API Key Configuration

**IMPORTANT:** Before importing this workflow into n8n, you must replace the placeholder API keys with your actual keys.

### Required Keys

The workflow contains these placeholders that need to be replaced:

1. **`YOUR_KIE_AI_API_KEY`** - Replace with your KIE.AI API key
   - Found in: Authorization headers for image and video polling nodes
   - Example: `75bd6a9ed7febaae49414f961d04e0a4`

2. **`YOUR_OPENAI_API_KEY`** - Replace with your OpenAI API key
   - Found in: OpenAI credential configuration
   - Format: `sk-proj-...`

### How to Configure

#### Option 1: Manual Find & Replace (Recommended)
1. Open `ugc-video-generation-WORKING-v1.json` in a text editor
2. Find `YOUR_KIE_AI_API_KEY` and replace with actual KIE.AI key
3. Find `YOUR_OPENAI_API_KEY` and replace with actual OpenAI key
4. Save the file
5. Import into n8n

#### Option 2: Using sed (Linux/Mac/Git Bash)
```bash
# Replace KIE.AI API key
sed -i 's/YOUR_KIE_AI_API_KEY/your-actual-kie-ai-key/g' ugc-video-generation-WORKING-v1.json

# Replace OpenAI API key
sed -i 's/YOUR_OPENAI_API_KEY/your-actual-openai-key/g' ugc-video-generation-WORKING-v1.json
```

#### Option 3: After Import in n8n
1. Import the workflow as-is
2. Open each node that says "Invalid credentials"
3. Configure the credentials manually in n8n UI
4. Save the workflow

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
