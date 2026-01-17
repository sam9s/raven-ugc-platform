# Raven Solutions - UGC Ads Generator Platform
## Design Document v1.0 - PART 2

**Continuation from Part 1**

---

## 6. Frontend Requirements (continued)

### 6.3 UX Requirements (continued)

**Responsive Design:**
- Mobile-first approach
- Form stacks vertically on mobile
- Video player adapts to screen size
- Dashboard table scrolls horizontally on mobile

**Loading States:**
- Skeleton loaders for data fetching
- Disabled buttons during submissions
- Progress indicators for file uploads

**Validation:**
- Client-side validation before submission
- Product name: Required, max 100 chars
- Product photo: Required, max 5MB, jpg/png only
- ICP, features, setting: Optional but recommended
- Show inline error messages

**Success States:**
- Toast notification on video generation start
- Confetti animation on first video completion (optional)
- Clear "Video Ready!" notification

### 6.4 Design System (Lovable Guidance)

**Colors:**
- Primary: Modern blue/purple gradient
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Error: Red (#EF4444)
- Neutral: Gray scale (#F9FAFB to #111827)

**Typography:**
- Headings: Bold, modern sans-serif (Inter, Poppins)
- Body: Regular weight, good readability
- Monospace for video IDs, technical details

**Components:**
- Buttons: Rounded, clear hover states
- Cards: Subtle shadows, rounded corners
- Forms: Clear labels, helpful placeholders
- Status badges: Color-coded pills

**Accessibility:**
- WCAG AA contrast ratios
- Keyboard navigation support
- Screen reader friendly
- Focus indicators on interactive elements

### 6.5 Example User Flow

```
1. User lands on homepage
   → Sees value proposition, pricing
   → Clicks "Get Started Free"

2. Sign up page
   → Enters email, password, name
   → Receives 5 free credits
   → Redirected to dashboard

3. Dashboard
   → Sees credit balance: 5
   → Clicks "Create New Video"

4. Create form
   → Fills in product details
   → Uploads product photo
   → Selects "Nano Banana + Veo 3.1"
   → Clicks "Generate Video" (credits: 5 → 4)

5. Processing page
   → Shows real-time status
   → "Generating image..." (30 sec)
   → "Creating video..." (90 sec)
   → Total: ~2 minutes

6. Completed
   → Video player shows result
   → Downloads video
   → Returns to dashboard
   → Sees video in history table
```

---

## 7. Security & Authentication

### 7.1 Authentication Flow

**Email/Password (Phase 1):**
- Supabase handles all auth logic
- JWT tokens (access + refresh)
- Tokens stored in localStorage (Supabase SDK handles this)
- Auto-refresh before expiry

**Row-Level Security (RLS):**
- Users can ONLY see/edit their own data
- Enforced at database level (not just app level)
- Service role key bypasses RLS (backend only)

**API Key Security:**
- Frontend → n8n webhook uses `X-API-Key` header
- Key stored in environment variable (not in code)
- Rotated periodically (monthly)

### 7.2 n8n Webhook Security

**Required Headers:**
```javascript
{
  "Content-Type": "application/json",
  "X-API-Key": "your-secret-key-32-chars"
}
```

**Validation in n8n:**
```javascript
// First node after webhook
const providedKey = $input.item.json.headers['x-api-key'];
const expectedKey = '{{ $env.N8N_WEBHOOK_SECRET }}';

if (providedKey !== expectedKey) {
  return {
    json: { success: false, error: 'Unauthorized' },
    statusCode: 401
  };
}
```

**Additional Security:**
- IP Whitelisting (optional): Only allow Vercel IPs
- Rate Limiting: Max 10 requests/minute per user (via Supabase)
- HTTPS only (Let's Encrypt SSL on VPS)

### 7.3 Data Privacy

**User Data Isolation:**
- RLS ensures users can't see others' videos
- Product photos stored in Supabase Storage with auth required
- Video URLs from Key AI are public (CDN) - consider signed URLs later

**Sensitive Information:**
- Never log API keys in n8n executions
- Use n8n Credentials system (encrypted storage)
- Environment variables in `.env` (never in Git)

**GDPR Compliance (Basic):**
- User can delete account (cascades to videos, credits)
- Privacy policy on landing page (Phase 2)
- Data retention: 90 days for completed videos (Phase 2)

### 7.4 Input Validation

**Frontend Validation:**
- File type: Only jpg, png
- File size: Max 5MB
- Product name: No special characters, max 100 chars
- Text fields: Max 500 chars

**Backend Validation (n8n):**
- Validate required fields exist
- Check URL format for product_photo_url
- Sanitize user input before sending to OpenAI
- Reject requests with suspicious patterns

**Protection Against Abuse:**
- Rate limit: 10 videos/hour per user (Supabase function)
- Credit system prevents unlimited usage
- Monitor for spam patterns (manual review Phase 1)

---

## 8. Phase 1 Implementation Plan

### 8.1 Timeline: 1 Week MVP

**Day 1-2: Setup & Database**
- [ ] Create Supabase project
- [ ] Run SQL schema (all tables, functions, triggers)
- [ ] Configure authentication (email/password)
- [ ] Set up Supabase Storage bucket for product photos
- [ ] Test: Create test user, verify 5 free credits

**Day 3-4: n8n Workflow**
- [ ] Create `ugc-video-generation-v1` workflow
- [ ] Configure webhook trigger with auth
- [ ] Build main flow:
  - Credit deduction
  - Image prompt generation (OpenAI)
  - Nano Banana image generation (Key AI)
  - Video prompt generation (OpenAI)
  - Veo 3.1 video generation (Key AI)
  - Supabase updates
- [ ] Build error handling branch (refund + logging)
- [ ] Add environment variables
- [ ] Test: End-to-end generation with sample data

**Day 5-6: Frontend (Lovable)**
- [ ] Create project in Lovable
- [ ] Build pages:
  - Landing page (simple, clear value prop)
  - Login/Signup (Supabase auth integration)
  - Dashboard (credits, video history)
  - Create form (all fields)
  - Video result page (player, download)
- [ ] Integrate Supabase:
  - Auth context
  - Real-time subscriptions
  - CRUD operations
- [ ] Connect to n8n webhook
- [ ] Test: Full user journey

**Day 7: Testing & Launch**
- [ ] End-to-end testing with real product images
- [ ] Test all error scenarios:
  - Insufficient credits
  - Invalid file upload
  - AI generation timeout
  - Network errors
- [ ] Deploy frontend to Vercel
- [ ] Configure custom domain (if ready)
- [ ] Create 2-3 sample videos for demo
- [ ] Invite beta users

### 8.2 Success Criteria (Phase 1)

**Technical:**
- [ ] 90%+ generation success rate
- [ ] Average generation time < 3 minutes
- [ ] Zero credit leaks (no unpaid generations)
- [ ] Real-time status updates working

**Business:**
- [ ] 3-5 beta clients signed up
- [ ] 50+ videos generated in first week
- [ ] Positive feedback on video quality
- [ ] No critical bugs reported

**User Experience:**
- [ ] Signup to first video < 5 minutes
- [ ] Intuitive UI (no support tickets about "how to use")
- [ ] Download works on all devices

### 8.3 Phase 1 Limitations (Acceptable)

**What's NOT included:**
- ❌ Payment processing (Stripe)
- ❌ Google Drive upload
- ❌ Batch processing
- ❌ A/B testing
- ❌ Analytics dashboard
- ❌ Email notifications
- ❌ All 3 model options (only Nano + Veo)

**Workarounds:**
- Credits: Manually added via SQL
- Models: Only Nano Banana + Veo 3.1 available
- Notifications: Users refresh page for status

---

## 9. Deployment & Configuration

### 9.1 Supabase Setup

**1. Create Project:**
- Go to https://supabase.com
- Click "New Project"
- Name: `raven-ugc-platform`
- Region: Closest to your VPS (for low latency)
- Database password: Strong, save in password manager

**2. Run SQL Schema:**
- Go to SQL Editor
- Copy entire SQL from Section 3.2
- Click "Run"
- Verify tables created (check Table Editor)

**3. Configure Storage:**
```sql
-- Create storage bucket for product photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', false);

-- Storage policy: Users can upload their own photos
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Users can read own photos
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**4. Get Credentials:**
- Go to Settings → API
- Copy:
  - Project URL (NEXT_PUBLIC_SUPABASE_URL)
  - Anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - Service role key (SUPABASE_SERVICE_ROLE_KEY) - for n8n only!

**5. Configure Email (Optional - Phase 1):**
- Settings → Auth → Email Templates
- Customize signup confirmation email
- Or use default (works fine for testing)

### 9.2 n8n Setup (Hostinger VPS)

**Verify n8n Installation:**
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Check n8n is running
sudo systemctl status n8n

# If not installed, install n8n
npm install -g n8n

# Start n8n (or configure as systemd service)
n8n start
```

**Configure Environment Variables:**
```bash
# Create .env file (or use n8n's UI)
nano ~/.n8n/.env

# Add these:
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.your-domain.com
```

**Set Up SSL (Let's Encrypt):**
```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/n8n

# Add this config:
server {
    server_name n8n.your-domain.com;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d n8n.your-domain.com
```

**Add Credentials in n8n UI:**
1. Open https://n8n.your-domain.com
2. Go to Settings → Credentials → Add Credential
3. Add:
   - OpenAI Account (API key)
   - Key AI (HTTP Header Auth with Bearer token)
   - Supabase (HTTP Header Auth with service role key)

**Import Workflow:**
- Once Claude Code creates the workflow JSON
- Go to Workflows → Import from File
- Activate the workflow

### 9.3 Frontend Deployment (Vercel)

**From Lovable:**
1. Click "Export Code" in Lovable
2. Download ZIP or connect to GitHub
3. Extract and push to new GitHub repo

**Deploy to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd your-frontend-folder
vercel

# Add environment variables in Vercel dashboard:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/ugc-video-generate
NEXT_PUBLIC_N8N_WEBHOOK_KEY=your-32-char-secret
```

**Configure Domain:**
- Vercel Dashboard → Settings → Domains
- Add custom domain: `app.ravensolutions.com`
- Update DNS (A record or CNAME)

### 9.4 Environment Variables Summary

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/ugc-video-generate
NEXT_PUBLIC_N8N_WEBHOOK_KEY=generate-random-32-char-string
```

**n8n (Credentials System):**
```bash
# Add these as n8n credentials, NOT in .env
KEY_AI_API_KEY=your_key_ai_key
OPENAI_API_KEY=sk-proj-your_openai_key
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_WEBHOOK_SECRET=same-32-char-string-as-frontend
```

**Security Checklist:**
- [ ] Never commit .env files to Git
- [ ] Use different keys for dev/production
- [ ] Rotate API keys monthly
- [ ] Use service role key only in n8n (never frontend)
- [ ] Store backup of all keys in password manager

---

## 10. Future Enhancements (Phase 2+)

### 10.1 Phase 2: Production Features (Month 2)

**Payment Integration:**
- Stripe Checkout for credit purchases
- Pricing: $29/25 credits, $99/100 credits, $249/300 credits
- Webhook: Stripe → Supabase (auto-add credits)
- Invoice generation

**Google Drive Upload:**
- OAuth flow for Google account connection
- n8n workflow: Download video → Upload to Drive
- Organize in folders by date/product

**All 3 Model Options:**
- Enable Veo 3.1 only (faster, cheaper)
- Enable Sora 2 (higher quality, slower)
- Let users compare outputs

**Email Notifications:**
- Send email when video is ready
- Use Supabase Edge Functions + Resend API
- Template: "Your UGC ad for [Product] is ready!"

**Better Error Handling:**
- Retry failed generations automatically (3 attempts)
- Partial refunds if image succeeds but video fails
- User-friendly error messages

### 10.2 Phase 3: Advanced Features (Month 3+)

**Batch Processing:**
- Upload CSV with 10 products
- Generate all videos in parallel
- Download as ZIP file

**A/B Testing:**
- Generate 3 variations per product
- Different dialogue, angles, settings
- Track which performs best (manual user input)

**Analytics Dashboard:**
- Total videos created
- Average generation time
- Success rate by model
- Credit usage trends
- Most common products/industries

**Brand Kit:**
- Save brand colors, logos, fonts
- Auto-apply to all videos
- Voice/tone guidelines for AI prompts

**API Access (Enterprise):**
- REST API for programmatic access
- API keys with rate limits
- Webhook callbacks when video ready
- Usage-based pricing

**Collaboration:**
- Team accounts (multiple users, shared credits)
- Assign roles (admin, creator, viewer)
- Approval workflow (manager approves before publish)

**Video Editing:**
- Trim video length
- Add captions/subtitles (AI-generated)
- Add background music
- Export in different formats (MP4, WebM)

**White-Label:**
- Agencies can rebrand the platform
- Custom domain, logo, colors
- Higher pricing tier

### 10.3 Technical Debt to Address

**Scalability:**
- Move video storage from VPS to Cloudflare R2 (cheaper, faster)
- Implement job queue (BullMQ) for video generation
- Redis for caching (credit balances, user sessions)

**Monitoring:**
- Sentry for error tracking
- Plausible/Posthog for analytics
- Uptime monitoring (UptimeRobot)
- Cost tracking (AI API usage)

**Testing:**
- Unit tests for Supabase functions
- Integration tests for n8n workflows
- E2E tests for critical user flows (Playwright)
- Load testing (can handle 100 concurrent generations?)

**Documentation:**
- User guide (how to create best videos)
- API documentation (Swagger/OpenAPI)
- Video tutorials
- FAQ section

---

## 11. Cost Analysis

### 11.1 Infrastructure Costs (Monthly)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Supabase | Free tier | $0 | 50K MAU, 500MB DB, 1GB storage |
| Vercel | Hobby | $0 | 100GB bandwidth, unlimited sites |
| Hostinger VPS | Existing | $10-30 | Already have for n8n |
| Domain | .com | $12/year | One-time |
| **Total** | | **~$10-30/mo** | |

### 11.2 Variable Costs (Per Video)

| Item | Cost | Notes |
|------|------|-------|
| Nano Banana (image) | $0.04 | Key AI pricing |
| Veo 3.1 Fast (8sec) | $0.15 | Key AI pricing |
| OpenAI GPT-4 mini | ~$0.01 | Prompt generation (3 calls) |
| **Total per video** | **~$0.20** | |

### 11.3 Profitability Example

**Starter Plan: $29/month for 25 videos**
- Revenue: $29
- Cost: 25 × $0.20 = $5
- Infrastructure: ~$3 (allocated)
- **Profit: $21 (72% margin)**

**Pro Plan: $99/month for 100 videos**
- Revenue: $99
- Cost: 100 × $0.20 = $20
- Infrastructure: ~$10 (allocated)
- **Profit: $69 (70% margin)**

**Break-even:** 5 Starter plan customers OR 2 Pro customers

---

## 12. Support & Maintenance

### 12.1 Common Issues & Solutions

**Issue: Video generation stuck at "processing"**
- Check n8n workflow execution logs
- Verify Key AI API status
- Check if loop timeout hit (200 seconds)
- Solution: Retry manually or refund credit

**Issue: Insufficient credits error**
- Verify Supabase credits table
- Check if deduct_credit() function succeeded
- Solution: Manually add credits via SQL

**Issue: Poor video quality**
- Check image prompt (too vague?)
- Verify product photo is high quality
- Try different model (Sora 2 vs Veo)
- Solution: Iterate on prompt templates

**Issue: Webhook not triggering**
- Verify X-API-Key header is correct
- Check n8n webhook is active
- Test webhook URL directly (Postman)
- Solution: Regenerate webhook secret

### 12.2 Monitoring Checklist

**Daily:**
- [ ] Check Supabase dashboard (new signups, errors)
- [ ] Review n8n executions (any failures?)
- [ ] Monitor credit balance vs. video completions

**Weekly:**
- [ ] Analyze video success rate (should be >90%)
- [ ] Review average generation time
- [ ] Check Key AI/OpenAI spending
- [ ] User feedback (support tickets, reviews)

**Monthly:**
- [ ] Rotate API keys
- [ ] Database backup
- [ ] Review pricing vs. costs
- [ ] Plan feature updates

---

## 13. Conclusion

This design document provides the complete blueprint for building the Raven Solutions UGC Ads Generator platform. 

**Key Takeaways:**
- **Simple stack:** Lovable + Supabase + n8n = Fast MVP
- **Profitable:** 70-80% margins on credit sales
- **Scalable:** Can handle 100+ users on free/cheap infrastructure
- **Proven:** Based on Nate's successful workflow

**Next Steps:**
1. Review this document (make any changes)
2. Set up Supabase project
3. Provide Claude Code with this document to build n8n workflow
4. Build frontend in Lovable
5. Connect everything
6. Launch to beta users

**Success Metric:** If 5 people pay $29 for 25 videos each, you've validated the business. Everything after that is scaling and optimization.

---

## Appendices

### A. Glossary

- **UGC:** User-Generated Content (authentic-looking videos)
- **ICP:** Ideal Customer Profile (target audience)
- **RLS:** Row-Level Security (Supabase database security)
- **JWT:** JSON Web Token (authentication)
- **VPS:** Virtual Private Server (Hostinger hosting)
- **CDN:** Content Delivery Network (fast video serving)
- **Webhook:** HTTP endpoint that receives real-time events

### B. Reference Links

**Documentation:**
- Supabase: https://supabase.com/docs
- n8n: https://docs.n8n.io
- Key AI: https://key-ai.com/docs
- OpenAI: https://platform.openai.com/docs
- Vercel: https://vercel.com/docs

**Tools:**
- Lovable: https://lovable.dev
- GitHub: https://github.com
- Stripe: https://stripe.com/docs

### C. Contact & Support

**For Implementation Questions:**
- Project Manager: Sammy (Raven Solutions)
- Solution Architect: Claude (this document)
- Developer: Claude Code (VSCode extension)

**For Technical Issues:**
- Supabase: Discord community
- n8n: Forum + Discord
- Key AI: Email support

---

**END OF DESIGN DOCUMENT**

*This document is a living reference. Update it as the platform evolves through Phase 2, 3, and beyond.*