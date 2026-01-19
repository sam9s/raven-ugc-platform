# Architecture Decisions Record (ADR)

**Project:** Raven UGC Video Generation Platform
**Date:** January 19, 2026
**Status:** Approved

---

## Decision 1: Frontend Script Generation vs n8n Script Generation

### Context

We had two options for where UGC script generation happens:

**Option A: Frontend → OpenAI → User Reviews → n8n**
```
User fills form → Frontend calls OpenAI API (via Next.js route) →
User sees + edits script → User approves → Frontend calls n8n with script
```

**Option B: n8n Handles Everything**
```
User fills form → Frontend calls n8n → n8n calls OpenAI → n8n generates video →
User sees final video (no script review step)
```

### Decision

**We chose Option A: Frontend Script Generation**

### Reasoning

#### ✅ Pros of Option A:
1. **User Control**: User can review, edit, and approve script before spending credits
2. **Better UX**: Separates script generation (fast, 2 seconds) from video generation (slow, 5 minutes)
3. **Saved Scripts Feature**: Easy to implement - script is in database before video generation starts
4. **Flexibility**: User can regenerate script multiple times without triggering video generation
5. **Error Handling**: If script generation fails, no credits are deducted
6. **Matches User's Vision**: The UGC-ai-workflow.md document explicitly shows this separation

#### ❌ Cons of Option A:
1. **Two API Calls**: Frontend makes two separate calls (script, then video)
2. **More Frontend Code**: Need to manage script state between steps
3. **Security Consideration**: Need Next.js API route to proxy OpenAI (but this is standard practice)

#### ❌ Why We Rejected Option B:
1. **No User Control**: User can't review script before video generation starts
2. **Wasted Credits**: If user dislikes the script, they've already spent credits on video
3. **Poor UX**: User waits 5-6 minutes, then sees video they might not want
4. **Saved Scripts Hard to Implement**: Script only exists inside n8n execution, not in database
5. **Violates Separation of Concerns**: n8n should focus on video generation, not user interaction

### Consequences

**Implementation Changes Required:**
- Frontend: Add `/api/scripts/generate` route (Next.js API)
- Frontend: Add script review/edit component (Step 3 of wizard)
- Database: Add `generated_script_json` column to videos table
- n8n: Receive script from webhook instead of generating it

**Benefits Gained:**
- User satisfaction: Control over script content
- Reduced waste: No credits spent on unwanted videos
- Feature enablement: Saved scripts, script variations, A/B testing

---

## Decision 2: MVP Video Model Support

### Context

The project plan mentioned supporting multiple video models:
- Veo 3 Fast (KIE.AI)
- Veo 2 (KIE.AI)
- Sora 2 (OpenAI)
- Kling AI

### Decision

**MVP supports ONLY Veo 3 Fast**

### Reasoning

#### ✅ Pros:
1. **Faster Development**: No model selection logic needed
2. **Simpler Testing**: One video generation path to verify
3. **Cost Control**: Veo 3 Fast is cheapest (~$0.07/video)
4. **Speed**: Veo 3 Fast generates videos in 3-4 minutes (fastest)
5. **Sufficient Quality**: Good enough quality for MVP validation

#### Future Plans:
- **Phase 2**: Add Veo 2 (higher quality, 5-6 minutes)
- **Phase 3**: Add Sora 2 (premium tier, 8 minutes)
- **Phase 3**: Add Kling AI (realistic motion specialist)

### Consequences

**Simplified MVP:**
- No model selection dropdown in wizard
- No credit cost calculation (always 1 credit)
- No if/else logic in n8n workflow for model selection

**Easy to Add Later:**
- Model selection is isolated to one workflow node
- Credit costs are in configuration file
- Frontend dropdown can be added in Phase 2

---

## Decision 3: Database Schema Design

### Context

Where to store the generated UGC script?

**Option 1:** Separate `scripts` table
**Option 2:** Store in `videos` table as JSONB

### Decision

**Store script in `videos.generated_script_json` (JSONB column)**

### Reasoning

#### ✅ Pros:
1. **Simpler Queries**: No JOIN needed to get video + script
2. **Atomic Relationship**: Script is directly tied to video (1:1)
3. **Flexible Schema**: JSONB allows script structure to evolve
4. **Faster Reads**: One query instead of two

#### Future Consideration:
If we add "Saved Scripts" feature (Phase 2), we'll create a separate `saved_scripts` table:
```sql
CREATE TABLE saved_scripts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  script_json JSONB,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This allows:
- Users to save favorite scripts for reuse
- Scripts to exist independent of videos
- One script to be used for multiple videos

But for MVP, script lives in videos table.

---

## Decision 4: API Key Security

### Context

How to call OpenAI API from frontend without exposing API key?

**Option 1:** Call OpenAI directly from browser (INSECURE)
**Option 2:** Use Next.js API route as proxy (SECURE)

### Decision

**Use Next.js API route at `/api/scripts/generate`**

### Reasoning

#### ✅ Security:
- OpenAI API key stays on server (environment variable)
- Never exposed to browser/user
- User can't steal key and make unlimited requests

#### ✅ Additional Benefits:
- Add authentication check (verify user is logged in)
- Add rate limiting (prevent abuse)
- Add request validation (ensure proper input format)
- Add logging (track usage for debugging)

#### Implementation:
```typescript
// app/api/scripts/generate/route.ts
export async function POST(request: Request) {
  // 1. Authenticate user (Supabase)
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Call OpenAI with SERVER-SIDE key
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: UGC_SCRIPT_SYSTEM_PROMPT },
      { role: 'user', content: formatUserPrompt(body) }
    ]
  });

  return Response.json({ script: completion.choices[0].message.content });
}
```

**Environment Variables:**
```env
# .env.local (NEVER commit to Git)
OPENAI_API_KEY=sk-proj-...
```

---

## Decision 5: Credit Deduction Timing

### Context

When should credits be deducted?

**Option 1:** Deduct when user clicks "Generate Video"
**Option 2:** Deduct when video is completed
**Option 3:** Deduct when video starts generating (after script approved)

### Decision

**Deduct credits BEFORE video generation starts (Option 3)**

### Reasoning

#### ✅ Prevents Abuse:
- User can't cancel video mid-generation to avoid charges
- User can't spam video generation without paying

#### ✅ Atomic Transaction:
- Credit deduction and video record creation happen together
- If credits insufficient, video record is deleted

#### ✅ Automatic Refund on Failure:
- If video generation fails, credits are refunded via `refund_credit()` function
- Database transaction log shows deduction + refund

#### Flow:
```
1. User clicks "Generate Video"
2. Frontend → POST /api/videos/create
3. Next.js API creates video record (status: processing)
4. Next.js API calls deduct_credit(user_id, video_id)
   ↓ If successful:
5. Next.js API triggers n8n webhook
   ↓ If fails (insufficient credits):
5. Next.js API deletes video record
6. Returns error: "Insufficient credits"
```

---

## Decision 6: Frontend Framework Choice

### Context

Which frontend framework to use?

**Options:**
- Next.js 14 (App Router)
- Next.js 13 (Pages Router)
- Remix
- SvelteKit
- Plain React (Vite)

### Decision

**Next.js 14 with App Router**

### Reasoning

#### ✅ Pros:
1. **Built-in API Routes**: Perfect for OpenAI proxy
2. **Server Components**: Faster initial page loads
3. **Optimized for Vercel**: Best deployment experience
4. **TypeScript Support**: Excellent type safety
5. **Large Ecosystem**: shadcn/ui, Tailwind, Zod integration
6. **SSR + Client**: Best of both worlds

#### ✅ Specific Features We Use:
- **Server Actions**: For form submissions
- **API Routes**: For OpenAI/n8n proxying
- **Middleware**: For authentication checks
- **Image Optimization**: For video thumbnails

---

## Decision 7: State Management

### Context

How to manage state in video creation wizard (5 steps)?

**Options:**
- Redux
- Zustand
- Jotai
- React Context
- URL params

### Decision

**Zustand (lightweight state management)**

### Reasoning

#### ✅ Pros:
1. **Lightweight**: <1KB bundle size
2. **Simple API**: Easy to learn and use
3. **No boilerplate**: Less code than Redux
4. **TypeScript-first**: Excellent type inference
5. **DevTools**: Browser extension for debugging

#### Example:
```typescript
// stores/videoCreationStore.ts
import { create } from 'zustand';

interface VideoCreationState {
  step: number;
  formData: {
    product_name: string;
    // ... 13 fields
  };
  generatedScript: ScriptType | null;
  setFormData: (data: Partial<FormData>) => void;
  setScript: (script: ScriptType) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useVideoCreationStore = create<VideoCreationState>((set) => ({
  step: 1,
  formData: {},
  generatedScript: null,
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  setScript: (script) => set({ generatedScript: script }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step - 1 })),
  reset: () => set({ step: 1, formData: {}, generatedScript: null })
}));
```

---

## Decision 8: Polling vs WebSockets for Video Status

### Context

How should frontend get video status updates?

**Option 1:** Polling (fetch every 5 seconds)
**Option 2:** WebSockets (real-time connection)
**Option 3:** Server-Sent Events (SSE)

### Decision

**Polling (fetch /api/videos/:id/status every 5 seconds)**

### Reasoning

#### ✅ Pros of Polling:
1. **Simpler Implementation**: Just use `setInterval` in React
2. **No Server Changes**: Works with existing REST API
3. **Reliable**: No connection dropouts
4. **Lower Cost**: No WebSocket server needed
5. **Good Enough**: Video takes 5-6 minutes, 5-second delay is acceptable

#### ❌ Why Not WebSockets:
1. **Overkill**: Video status doesn't update that frequently
2. **Complex**: Need WebSocket server + fallback
3. **Cost**: Vercel charges more for WebSocket connections
4. **Reliability**: Connection can drop, need reconnection logic

#### Implementation:
```typescript
// hooks/useVideoGeneration.ts
export function useVideoGeneration(videoId: string) {
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const pollStatus = async () => {
      const response = await fetch(`/api/videos/${videoId}/status`);
      const data = await response.json();
      setStatus(data.status);

      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(intervalId);
      }
    };

    const intervalId = setInterval(pollStatus, 5000);
    return () => clearInterval(intervalId);
  }, [videoId]);

  return { status };
}
```

---

## Summary of Key Decisions

1. ✅ **Script Generation**: Frontend (Option A)
2. ✅ **MVP Model**: Veo 3 Fast only
3. ✅ **Script Storage**: JSONB in videos table
4. ✅ **API Security**: Next.js API routes
5. ✅ **Credit Timing**: Deduct before generation
6. ✅ **Framework**: Next.js 14 App Router
7. ✅ **State**: Zustand
8. ✅ **Status Updates**: Polling (5s intervals)

---

**These decisions prioritize:**
- User experience (control, speed, clarity)
- Security (API key protection)
- Simplicity (MVP scope)
- Flexibility (easy to extend later)

**Last Updated:** January 19, 2026
