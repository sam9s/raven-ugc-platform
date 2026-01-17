# Raven Solutions - UGC Ads Generator Platform

## Project Overview
A professional SaaS platform that generates user-generated content (UGC) style video advertisements using AI models (Veo 3.1, Nano Banana, Sora 2). The platform eliminates the need for human actors and traditional video production.

## Architecture
- **Backend Automation**: n8n (self-hosted on Hostinger VPS)
- **Database & Auth**: Supabase (PostgreSQL + Row-Level Security)
- **Frontend**: Lovable (Phase 1) → React + Vercel (Phase 2)
- **AI APIs**: Key AI (video/image generation), OpenAI GPT-4 mini (prompt generation)
- **Storage**: Supabase Storage (product photos), VPS/Cloudflare R2 (videos)

## Development Phases
- **Phase 1** (Current): Build n8n workflow, deploy MVP
- **Phase 2**: React frontend, Stripe integration, Google Drive upload
- **Phase 3**: Batch processing, A/B testing, analytics dashboard

## Tech Stack Details
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Lovable → React 18 | UI/UX |
| Styling | Tailwind CSS | Design system |
| Auth/DB | Supabase | PostgreSQL + Auth |
| Automation | n8n | Workflow engine |
| AI Gateway | Key AI | Veo, Sora, Nano Banana |
| AI Models | OpenAI GPT-4 mini | Prompt generation |
| Hosting | Vercel + Hostinger VPS | Frontend + n8n |

## Your Role
Build production-ready n8n workflows following enterprise best practices:
- Comprehensive error handling with automatic retries
- Secure credential management (environment variables)
- Proper logging and monitoring
- Idempotent operations (safe to retry)
- Clear documentation for each workflow

## Available Resources
- **n8n MCP**: Direct access to create/edit workflows in self-hosted instance
- **n8n Skills**: Workflow patterns, expressions, best practices
- **Design Documents**: Complete architecture and implementation specs in `/docs`
- **Database Schema**: Pre-configured Supabase PostgreSQL with RLS in `/database`

## Key Files
- `/docs/design-doc-part1.md` - System architecture, database schema, workflow logic
- `/docs/design-doc-part2.md` - Frontend requirements, security, deployment
- `/database/schema.sql` - Complete Supabase SQL schema
- `/n8n/workflows/` - Exported n8n workflow JSON files

## Development Guidelines
1. **Security First**: Never hardcode credentials, use n8n credential system
2. **Error Resilience**: All external API calls must have retry logic + error branches
3. **Testing**: Test workflows with sample data before marking complete
4. **Documentation**: Comment complex logic, document assumptions
5. **Version Control**: Export workflows as JSON for Git tracking

## n8n Workflow Standards
- Use descriptive node names (e.g., "Generate Image Prompt - OpenAI" not "HTTP Request")
- Add error branches for ALL external API calls
- Use environment variables for all sensitive data
- Include comments explaining complex expressions
- Follow async API pattern: POST → Get task_id → Poll status → Get result

## API Integrations
1. **Key AI** (Image/Video Generation)
   - Endpoint: `https://api.key-ai.com/v1`
   - Models: `nanobanana-pro`, `veo3-fast`, `sora2`
   - Pattern: Submit job → Poll status → Download result

2. **OpenAI** (Prompt Generation)
   - Model: `gpt-4o-mini`
   - Uses: Image prompts, video prompts, image analysis

3. **Supabase** (Database Operations)
   - Service role key for n8n (bypasses RLS)
   - Functions: `deduct_credit()`, `refund_credit()`

## Project Standards
- Follow the design documents exactly
- Use proper variable naming (descriptive, consistent)
- Implement atomic transactions for credit operations
- Validate all external inputs
- Log errors with context for debugging
- Clean prompts before sending to AI APIs (remove newlines, escape quotes)

## Error Handling Pattern
```
Main Flow → On Error → Update DB (status: failed) → Refund Credit → Log Error → Return Error Response
```

## Current Status
- Phase 1: MVP Development
- Focus: n8n workflow for video generation
- Frontend: Will be built in Lovable after n8n workflow is complete
