# n8n Workflows

This directory contains n8n workflow configurations for the Raven UGC Platform.

## Directory Structure

```
n8n/
├── workflows/              # Exported workflow JSON files
│   └── ugc-video-generation-v1.json
├── credentials.example.json # Credential configuration template
└── README.md               # This file
```

## Main Workflow: Video Generation

**Workflow Name**: `ugc-video-generation-v1`
**Trigger**: Webhook POST `/webhook/ugc-video-generate`

### Flow Overview

```
1. Webhook Receiver
   ↓
2. Validate API Key
   ↓
3. Deduct Credit (Supabase function)
   ↓
4. Update Video Status → 'processing'
   ↓
5. Generate Image Prompt (OpenAI GPT-4 mini)
   ↓
6. Create Product Image (Key AI - Nano Banana)
   ↓
7. Poll Image Status (loop until ready)
   ↓
8. Analyze Generated Image (OpenAI Vision)
   ↓
9. Generate Video Prompt (OpenAI GPT-4 mini)
   ↓
10. Create Video (Key AI - Veo 3.1)
    ↓
11. Poll Video Status (loop until ready)
    ↓
12. Update Video Record → 'completed'
    ↓
13. Return Success Response

[Error Branch at any step]
    ↓
Update Video → 'failed'
    ↓
Refund Credit
    ↓
Return Error Response
```

## Required Credentials

Configure these in n8n Settings → Credentials:

### 1. OpenAI

- **Type**: OpenAI Account
- **API Key**: Your OpenAI API key

### 2. Supabase

- **Type**: Header Auth
- **Headers**:
  - `Authorization`: `Bearer {SUPABASE_SERVICE_ROLE_KEY}`
  - `apikey`: `{SUPABASE_SERVICE_ROLE_KEY}`

### 3. Key AI

- **Type**: Header Auth
- **Headers**:
  - `Authorization`: `Bearer {KEY_AI_API_KEY}`

## Environment Variables

These should be set in n8n's environment:

```bash
N8N_WEBHOOK_SECRET=your-32-char-webhook-secret
```

## Importing Workflows

1. Go to n8n dashboard
2. Click **Workflows** → **Import from File**
3. Select the JSON file from `workflows/`
4. Connect credentials to each node
5. **Activate** the workflow

## Exporting Workflows

Always export workflows for version control:

1. Open the workflow
2. Click the **⋮** menu → **Download**
3. Save to `workflows/` directory
4. Commit to Git

## Testing

### Test Webhook Manually

```bash
curl -X POST https://n8n.your-domain.com/webhook/ugc-video-generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-webhook-secret" \
  -d '{
    "user_id": "test-user-uuid",
    "video_id": "test-video-uuid",
    "product_name": "Test Product",
    "product_photo_url": "https://example.com/photo.jpg",
    "icp": "Test audience",
    "features": "Test features",
    "video_setting": "Test setting",
    "timestamp": "2025-01-16T10:00:00Z"
  }'
```

### Test with Sample Data

1. Create a test user in Supabase
2. Manually add credits via SQL
3. Create a video record with status 'pending'
4. Trigger the webhook with the video_id
5. Monitor execution in n8n

## Troubleshooting

### Webhook Not Triggering

- Check webhook is active (green toggle)
- Verify URL is correct
- Check X-API-Key header matches N8N_WEBHOOK_SECRET

### Credit Deduction Failing

- Verify Supabase service role key is correct
- Check user has credits (balance > 0)
- Test deduct_credit function directly in Supabase

### AI Generation Timeout

- Increase loop iterations (default: 20)
- Check Key AI API status
- Verify API key has sufficient credits

### Prompt Cleaning Issues

Key AI rejects prompts with newlines. Always clean prompts:

```javascript
// In Code node
const cleanPrompt = $json.prompt
  .replace(/\n/g, ' ')
  .replace(/"/g, "'")
  .trim();
```

## Best Practices

1. **Always add error branches** to external API calls
2. **Use descriptive node names** (e.g., "Generate Image - Nano Banana")
3. **Log important data** for debugging
4. **Test with small timeouts first** then increase
5. **Export workflows after changes** for Git tracking
