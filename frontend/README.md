# Frontend (Phase 2)

This directory will contain the React frontend for the Raven UGC Platform.

## Current Status: Phase 1

For Phase 1, the frontend is being built using **Lovable** for rapid prototyping.

## Phase 2 Migration

Once the MVP is validated, the frontend will be migrated to:

- **Framework**: React 18 + Next.js
- **Styling**: Tailwind CSS
- **State Management**: React Context + Supabase subscriptions
- **Hosting**: Vercel

## Planned Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── page.tsx         # Landing page
│   │   ├── login/
│   │   ├── signup/
│   │   ├── dashboard/
│   │   ├── create/
│   │   └── videos/[id]/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── forms/           # Form components
│   │   └── layout/          # Layout components
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── api.ts           # API utilities
│   └── hooks/
│       ├── useAuth.ts       # Authentication hook
│       └── useCredits.ts    # Credits management hook
├── public/
├── package.json
├── tailwind.config.js
└── next.config.js
```

## Pages

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page | No |
| `/login` | Sign in | No |
| `/signup` | Create account | No |
| `/dashboard` | User home | Yes |
| `/create` | Video generation form | Yes |
| `/videos/:id` | Video result view | Yes |
| `/account` | Profile settings | Yes |

## Key Features

### Dashboard
- Credit balance display
- "Create New Video" CTA
- Video history table
- Status badges (pending/processing/completed/failed)

### Create Form
- Product name input
- Product photo upload (max 5MB, jpg/png)
- ICP textarea
- Features textarea
- Video setting textarea
- Model selector dropdown
- Submit button (disabled if no credits)

### Video Result
- Real-time status updates via Supabase subscriptions
- Video player (when completed)
- Download button
- Error display (when failed)

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/ugc-video-generate
NEXT_PUBLIC_N8N_WEBHOOK_KEY=your-webhook-secret
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

See `/docs/DEPLOYMENT.md` for Vercel deployment instructions.

## Design System

- **Colors**: Modern blue/purple gradient primary
- **Typography**: Inter or Poppins
- **Components**: Rounded buttons, card shadows
- **Responsive**: Mobile-first approach

## Coming in Phase 2

- [ ] Stripe payment integration
- [ ] Google Drive upload
- [ ] Email notifications
- [ ] Multiple model selection
- [ ] Better error messages
