# Raven UGC Platform

**AI-Powered Video Ad Generator**

A SaaS platform that generates professional UGC-style (User-Generated Content) video advertisements using AI models, eliminating the need for human actors and traditional video production.

## Features

- **AI-Powered Video Generation**: Create authentic-looking UGC videos using Veo 3.1, Nano Banana, and Sora 2
- **Credit-Based System**: Pay-as-you-go model with transparent pricing
- **Real-Time Status Updates**: Track video generation progress live
- **Multiple AI Models**: Choose the best model for your needs
- **Secure & Scalable**: Built on enterprise-grade infrastructure

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend Automation | n8n (self-hosted) |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| Frontend | Lovable → React + Vercel |
| AI Video/Image | Key AI (Veo 3.1, Nano Banana, Sora 2) |
| AI Prompts | OpenAI GPT-4 mini |
| Storage | Supabase Storage + Cloudflare R2 |

## Prerequisites

- Node.js 20+
- n8n instance (self-hosted or cloud)
- Supabase account
- API Keys:
  - Key AI API key
  - OpenAI API key
  - GitHub Personal Access Token (for development)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/sam9s/raven-ugc-platform.git
cd raven-ugc-platform
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Set Up Supabase Database

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the schema from `database/schema.sql`
4. Copy your API keys to `.env`

### 4. Configure n8n

1. Access your n8n instance
2. Import workflows from `n8n/workflows/`
3. Configure credentials (Key AI, OpenAI, Supabase)
4. Activate the workflow

### 5. Deploy Frontend (Phase 2)

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
raven-ugc-platform/
├── .gitignore              # Git ignore rules
├── .env.example            # Environment variable template
├── claude.md               # Claude Code system prompt
├── README.md               # This file
├── docs/
│   ├── design-doc-part1.md # Architecture & database schema
│   ├── design-doc-part2.md # Frontend & deployment specs
│   ├── API.md              # API documentation
│   └── DEPLOYMENT.md       # Deployment guide
├── n8n/
│   ├── workflows/          # n8n workflow JSON exports
│   ├── credentials.example.json
│   └── README.md           # n8n setup instructions
├── database/
│   ├── schema.sql          # Supabase SQL schema
│   └── migrations/         # Database migrations
├── frontend/               # React frontend (Phase 2)
│   └── README.md
└── scripts/                # Utility scripts
    └── README.md
```

## Development Workflow

1. **Read the design docs** in `/docs` to understand the architecture
2. **Set up Supabase** with the provided schema
3. **Build n8n workflows** following the specifications
4. **Test with sample data** before production use
5. **Export workflows as JSON** for version control

## Key Workflows

### Video Generation Pipeline

1. Receive webhook with video request
2. Validate and deduct credit
3. Generate image prompt (OpenAI)
4. Create product image (Nano Banana)
5. Analyze image (OpenAI Vision)
6. Generate video prompt (OpenAI)
7. Create video (Veo 3.1)
8. Update database with results

See `docs/design-doc-part1.md` Section 4 for detailed workflow logic.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `N8N_API_URL` | n8n instance URL | Yes |
| `N8N_API_KEY` | n8n API key | Yes |
| `N8N_WEBHOOK_SECRET` | Webhook authentication secret | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `KEY_AI_API_KEY` | Key AI API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |

See `.env.example` for the complete list.

## API Documentation

See `docs/API.md` for detailed API specifications including:
- Frontend → Supabase integration
- Frontend → n8n webhook calls
- n8n → Key AI requests
- n8n → OpenAI requests

## Deployment

See `docs/DEPLOYMENT.md` for deployment instructions covering:
- Supabase setup
- n8n configuration on VPS
- Frontend deployment to Vercel
- SSL/TLS configuration

## Development Phases

- **Phase 1** (Current): n8n workflow + Lovable MVP
- **Phase 2**: React frontend, Stripe payments, Google Drive integration
- **Phase 3**: Batch processing, A/B testing, analytics dashboard

## Contributing

This is a private project. For team members:
1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Wait for review

## License

MIT License - See LICENSE file for details.

## Contact

**Raven Solutions**
- Project Manager: Sammy
- Solution Architect: Claude (Anthropic)
- Developer: Claude Code

---

Built with AI by Raven Solutions
