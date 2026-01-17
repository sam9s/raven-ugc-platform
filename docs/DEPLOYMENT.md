# Raven UGC Platform - Deployment Guide

## Overview

This guide covers deploying all components of the Raven UGC Platform:

1. Supabase (Database & Auth)
2. n8n (Workflow Automation)
3. Frontend (Vercel)

---

## 1. Supabase Setup

### 1.1 Create Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Configure:
   - **Name**: `raven-ugc-platform`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your n8n VPS for low latency
4. Click **"Create new project"**
5. Wait for project to provision (~2 minutes)

### 1.2 Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New query"**
3. Copy the entire contents of `database/schema.sql`
4. Click **"Run"**
5. Verify in **Table Editor**:
   - `user_profiles` table exists
   - `credits` table exists
   - `videos` table exists
   - `transactions` table exists

### 1.3 Verify Functions

In SQL Editor, run:

```sql
-- Check functions were created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public';
```

Expected functions:
- `deduct_credit`
- `refund_credit`
- `handle_new_user`
- `update_updated_at`

### 1.4 Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Configure settings:
   - **Enable email confirmations**: OFF (for testing) / ON (for production)
   - **Minimum password length**: 8

### 1.5 Configure Storage

1. Go to **Storage**
2. Create bucket:
   - **Name**: `product-photos`
   - **Public**: OFF (private)
3. The RLS policies should already be created from schema.sql

### 1.6 Get API Keys

1. Go to **Settings** → **API**
2. Copy these values to your `.env`:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **WARNING**: Never expose the service_role key in frontend code!

### 1.7 Test Setup

1. Create a test user via SQL:

```sql
-- This simulates the signup flow
-- In production, users sign up through the frontend
```

2. Or sign up through the Supabase Auth UI:
   - Go to **Authentication** → **Users**
   - Click **"Add user"**
   - Check that profile and credits were created automatically

---

## 2. n8n Setup (Hostinger VPS)

### 2.1 Verify n8n Installation

SSH into your VPS:

```bash
ssh user@your-vps-ip

# Check n8n is running
sudo systemctl status n8n

# If not running, start it
sudo systemctl start n8n

# Check version
n8n --version
```

### 2.2 Configure Environment Variables

Edit n8n environment file:

```bash
sudo nano /etc/n8n/.env
# or
nano ~/.n8n/.env
```

Add these settings:

```bash
# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password

N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https

# Webhook URL (your public domain)
WEBHOOK_URL=https://n8n.your-domain.com

# Timezone
GENERIC_TIMEZONE=UTC

# Execution settings
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
```

Restart n8n:

```bash
sudo systemctl restart n8n
```

### 2.3 Configure SSL with Nginx

Install Nginx and Certbot:

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/n8n
```

Add:

```nginx
server {
    listen 80;
    server_name n8n.your-domain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for long-running workflows
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Get SSL certificate:

```bash
sudo certbot --nginx -d n8n.your-domain.com
```

### 2.4 Configure n8n Credentials

1. Open https://n8n.your-domain.com
2. Go to **Settings** → **Credentials**
3. Add the following credentials:

**OpenAI Account:**
- Type: OpenAI
- API Key: Your OpenAI API key

**Supabase (HTTP Header Auth):**
- Type: Header Auth
- Name: `Authorization`
- Value: `Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY`

Also add:
- Name: `apikey`
- Value: `YOUR_SUPABASE_SERVICE_ROLE_KEY`

**Key AI (HTTP Header Auth):**
- Type: Header Auth
- Name: `Authorization`
- Value: `Bearer YOUR_KEY_AI_API_KEY`

### 2.5 Import Workflow

1. Go to **Workflows**
2. Click **Import from File**
3. Select the workflow JSON from `n8n/workflows/`
4. Configure the webhook path: `/webhook/ugc-video-generate`
5. **Activate** the workflow

### 2.6 Test Webhook

Using curl or Postman:

```bash
curl -X POST https://n8n.your-domain.com/webhook/ugc-video-generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-webhook-secret" \
  -d '{
    "user_id": "test-user-id",
    "video_id": "test-video-id",
    "product_name": "Test Product",
    "product_photo_url": "https://example.com/photo.jpg",
    "icp": "Test audience",
    "features": "Test features",
    "video_setting": "Test setting",
    "timestamp": "2025-01-16T10:00:00Z"
  }'
```

---

## 3. Frontend Deployment (Vercel)

### 3.1 Export from Lovable (Phase 1)

1. Build your frontend in Lovable
2. Click **"Export Code"**
3. Download as ZIP or connect to GitHub

### 3.2 Push to GitHub

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend"
git remote add origin https://github.com/sam9s/raven-ugc-frontend.git
git push -u origin main
```

### 3.3 Deploy to Vercel

**Option A: Vercel CLI**

```bash
npm i -g vercel
vercel login
cd frontend
vercel
```

**Option B: Vercel Dashboard**

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import from GitHub
4. Select your frontend repository
5. Configure build settings (usually auto-detected)

### 3.4 Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/ugc-video-generate
NEXT_PUBLIC_N8N_WEBHOOK_KEY=your-32-char-webhook-secret
```

### 3.5 Configure Custom Domain

1. Go to Project Settings → Domains
2. Add your domain: `app.ravensolutions.com`
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

---

## 4. DNS Configuration

### Required DNS Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | n8n | YOUR_VPS_IP | 3600 |
| CNAME | app | cname.vercel-dns.com | 3600 |

### Example (Cloudflare)

1. Log in to Cloudflare
2. Select your domain
3. Go to DNS
4. Add records:
   - **A record**: n8n → VPS IP address
   - **CNAME record**: app → cname.vercel-dns.com

---

## 5. Post-Deployment Checklist

### Security

- [ ] All API keys are in environment variables (not in code)
- [ ] Service role key is only used in n8n (not frontend)
- [ ] HTTPS is enabled on all endpoints
- [ ] n8n has basic auth enabled
- [ ] Webhook secret is configured and validated

### Functionality

- [ ] User can sign up and receives 5 free credits
- [ ] User can upload product photo to Supabase Storage
- [ ] User can create video record in database
- [ ] n8n webhook receives requests correctly
- [ ] Credit deduction works atomically
- [ ] Video generation completes successfully
- [ ] Real-time status updates work
- [ ] Error handling refunds credits properly

### Monitoring

- [ ] Check Supabase dashboard for errors
- [ ] Check n8n execution logs
- [ ] Monitor API costs (Key AI, OpenAI)
- [ ] Set up uptime monitoring (optional)

---

## 6. Troubleshooting

### n8n Webhook Not Receiving Requests

1. Check webhook is active (green toggle)
2. Verify HTTPS certificate is valid
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Test with curl from local machine

### Supabase RLS Blocking Requests

1. Verify you're using service_role key for n8n
2. Check RLS policies in SQL Editor
3. Test query directly in Supabase dashboard

### Video Generation Timeout

1. Check Key AI API status
2. Increase polling timeout in n8n workflow
3. Check n8n execution logs for errors

### Frontend Can't Connect to Supabase

1. Verify environment variables in Vercel
2. Check CORS settings in Supabase
3. Verify anon key is correct (not service role)

---

## 7. Scaling Considerations

### When to Scale

- **Supabase**: Upgrade when approaching free tier limits
- **n8n**: Add more workers for concurrent executions
- **Vercel**: Upgrade for higher bandwidth

### Recommendations

1. **Supabase Pro** ($25/mo): When you exceed 50K MAU
2. **Dedicated VPS**: When n8n needs more resources
3. **Cloudflare R2**: Move video storage off VPS

---

## 8. Backup Procedures

### Database Backup

```sql
-- Export via Supabase dashboard
-- Or use pg_dump from CLI
pg_dump -h YOUR_HOST -U postgres -d postgres > backup.sql
```

### n8n Workflow Backup

1. Go to each workflow
2. Click **"Download"** to export as JSON
3. Store in `n8n/workflows/` and commit to Git

### Environment Variables Backup

Keep a secure copy of all environment variables in a password manager (1Password, Bitwarden, etc.)

---

## Support

- **Supabase**: [Discord](https://discord.supabase.com)
- **n8n**: [Forum](https://community.n8n.io)
- **Vercel**: [Documentation](https://vercel.com/docs)
