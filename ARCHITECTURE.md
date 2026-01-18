# Raven UGC Platform - Architecture Overview

## 🔄 How the Workflow Deployment Works

### The Challenge

n8n has `N8N_BLOCK_ENV_ACCESS_IN_NODE=true`, which means:
- ❌ Cannot use `$env.VARIABLE_NAME` in expressions
- ❌ Cannot read from environment variables in code nodes
- ✅ Must either hardcode keys OR use a deployment process

### Our Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. Git Repository (Safe to commit)
   ├── .env (gitignored - YOUR local secrets)
   ├── n8n/workflows/
   │   └── ugc-video-generation-WORKING-v1.json
   │       ↑
   │       Contains: YOUR_KIE_AI_API_KEY (placeholder)
   │                 YOUR_OPENAI_API_KEY (placeholder)

2. Run Deployment Script
   $ cd scripts
   $ npm run deploy-workflow

   Script does:
   ├── Reads: .env file (your real API keys)
   ├── Reads: ugc-video-generation-WORKING-v1.json (template)
   ├── Replaces: YOUR_KIE_AI_API_KEY → actual KIE_AI_API_KEY
   ├── Replaces: YOUR_OPENAI_API_KEY → actual OPENAI_API_KEY
   └── Writes: ugc-video-generation-DEPLOYED.json ✅

3. DEPLOYED File (gitignored - contains real keys)
   └── n8n/workflows/
       └── ugc-video-generation-DEPLOYED.json
           ↑
           Contains: 75bd6a9ed7febaae49414f961d04e0a4 (real key)
                     sk-proj-... (real key)

4. Import to n8n
   ├── Go to: https://n8n.sam9scloud.in
   ├── Import: ugc-video-generation-DEPLOYED.json
   └── Activate workflow ✅

┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User Request
    ↓
Webhook (n8n)
    ↓
Workflow Executes (with real hardcoded API keys)
    ├── OpenAI: sk-proj-... (from DEPLOYED file)
    └── KIE.AI: 75bd6a9e... (from DEPLOYED file)
    ↓
Video Generated ✅
```

---

## 📂 File Structure & Purpose

```
raven-ugc-platform/
├── .env                              # Real API keys (gitignored)
│   ├── KIE_AI_API_KEY=75bd6a9e...
│   └── OPENAI_API_KEY=sk-proj-...
│
├── .gitignore
│   ├── .env                          # ✅ Protected
│   ├── *-DEPLOYED.json               # ✅ Protected
│   └── .mcp.json                     # ✅ Protected
│
├── n8n/workflows/
│   ├── ugc-video-generation-WORKING-v1.json
│   │   Purpose: Template for version control
│   │   Contains: Placeholders (YOUR_KIE_AI_API_KEY)
│   │   Safe to commit: ✅ YES
│   │
│   ├── ugc-video-generation-DEPLOYED.json
│   │   Purpose: Production workflow with real keys
│   │   Contains: Real API keys from .env
│   │   Safe to commit: ❌ NO (gitignored)
│   │
│   └── README.md
│       Purpose: Explains deployment process
│
└── scripts/
    ├── deploy-workflow.js            # Deployment automation
    ├── package.json                  # Script dependencies
    └── README.md                     # Script documentation
```

---

## 🔐 Security Model

### What's in Git (Public)
✅ **Safe Files:**
- Workflow template with placeholders
- Documentation
- Deployment scripts
- Database schema

❌ **Never Committed:**
- `.env` file (real API keys)
- `*-DEPLOYED.json` (workflows with real keys)
- `.mcp.json` (MCP server config with keys)
- `node_modules/`

### What's on n8n Server (Private)
- `ugc-video-generation-DEPLOYED.json` imported as active workflow
- Real API keys hardcoded in workflow nodes
- No environment variable access needed

---

## 🚀 Deployment Workflow

### Initial Setup (One Time)
```bash
# 1. Clone repository
git clone https://github.com/sam9s/raven-ugc-platform.git
cd raven-ugc-platform

# 2. Create .env file with your API keys
cp .env.example .env
# Edit .env with real keys

# 3. Install dependencies
cd scripts
npm install
```

### Every Time You Update the Workflow
```bash
# 1. Make changes to the template
# Edit: n8n/workflows/ugc-video-generation-WORKING-v1.json
# (Use placeholders for API keys)

# 2. Commit to Git
git add n8n/workflows/ugc-video-generation-WORKING-v1.json
git commit -m "Update workflow: [description]"
git push

# 3. Generate deployment version
cd scripts
npm run deploy-workflow

# 4. Import to n8n
# - Go to n8n dashboard
# - Import: n8n/workflows/ugc-video-generation-DEPLOYED.json
# - Activate workflow
```

---

## 🔄 Update Flow Diagram

```
Developer makes workflow changes
            ↓
Edit WORKING-v1.json (with placeholders)
            ↓
Commit to Git ✅
            ↓
Run: npm run deploy-workflow
            ↓
Script reads .env + WORKING-v1.json
            ↓
Generates DEPLOYED.json (with real keys)
            ↓
Import DEPLOYED.json into n8n
            ↓
Activate workflow in n8n
            ↓
Production ready! ✅
```

---

## 🤔 Why This Approach?

### Alternative Approaches Considered

| Approach | Why NOT Used |
|----------|--------------|
| **Use n8n credentials system** | Credentials are stored per-installation, not in workflow JSON. Makes version control harder. |
| **Use n8n environment variables** | n8n blocks `$env` access with `N8N_BLOCK_ENV_ACCESS_IN_NODE=true` for security. |
| **Commit real keys to Git** | ❌ Security risk! Keys would be public on GitHub. |
| **Manual find/replace** | Error-prone, not reproducible, wastes time. |

### Why Our Approach is Best

✅ **Security:** Real keys never committed to Git
✅ **Reproducible:** Script ensures consistency
✅ **Version Control:** Template tracked in Git
✅ **Automation:** One command deploys workflow
✅ **Maintainable:** Easy to update and redeploy
✅ **Team-Friendly:** New developers just run the script

---

## 📝 Environment Variables Reference

### Required in .env

| Variable | Purpose | Example |
|----------|---------|---------|
| `KIE_AI_API_KEY` | KIE.AI API authentication | `75bd6a9ed7febaae49414f961d04e0a4` |
| `OPENAI_API_KEY` | OpenAI API authentication | `sk-proj-...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access | `eyJhbG...` |
| `N8N_WEBHOOK_SECRET` | Webhook security | `nHChN19v...` |

### Placeholder Mapping

| Placeholder in Template | Environment Variable | Used In Workflow |
|------------------------|---------------------|------------------|
| `YOUR_KIE_AI_API_KEY` | `KIE_AI_API_KEY` | Poll Image Status, Poll Video Status |
| `YOUR_OPENAI_API_KEY` | `OPENAI_API_KEY` | OpenAI Credentials |

---

## 🛠 Troubleshooting

### "Missing required environment variables"
**Cause:** `.env` file not found or missing keys
**Fix:**
```bash
# Check .env exists in project root
ls -la .env

# Verify it contains required keys
grep "KIE_AI_API_KEY" .env
grep "OPENAI_API_KEY" .env
```

### "DEPLOYED.json still has placeholders"
**Cause:** Script didn't find the keys in .env
**Fix:**
```bash
# Run script with debugging
node scripts/deploy-workflow.js

# Check for error messages about missing vars
```

### "Workflow fails in n8n with 'Unauthorized'"
**Cause:** Imported WORKING file instead of DEPLOYED
**Fix:**
- Make sure you import `ugc-video-generation-DEPLOYED.json`
- NOT `ugc-video-generation-WORKING-v1.json`

---

## 🎯 Key Takeaways

1. **WORKING file = Template** (safe for Git, has placeholders)
2. **DEPLOYED file = Production** (gitignored, has real keys)
3. **Deployment script = Bridge** (reads .env, generates DEPLOYED)
4. **Always import DEPLOYED** into n8n, never WORKING
5. **Update flow:** Edit WORKING → Commit → Deploy → Import

---

**Last Updated:** January 18, 2025
**Status:** ✅ Production deployment process established
