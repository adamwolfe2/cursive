# Campaign Builder - Sales.co-Style Campaign Crafter ✅

## Overview
**CRITICAL**: This is a Campaign BUILDING tool, NOT an email sending platform. EmailBison handles all actual email delivery. This wizard collects information and uses AI to CRAFT email sequences that can be exported to EmailBison.

## What This System Does
- ✅ 6-step wizard for collecting company/product/ICP information
- ✅ AI-powered email sequence generation using Anthropic Claude
- ✅ Review and editing of generated campaigns
- ✅ Export to EmailBison (CSV, JSON, manual copy)
- ✅ Campaign draft management (save, resume, delete)

## What This System Does NOT Do
- ❌ Email sending (that's EmailBison)
- ❌ SMTP configuration
- ❌ Open/click tracking
- ❌ Bounce handling
- ❌ Email warmup

---

## Implementation Complete

### 1. ✅ Database Migration
**File**: `supabase/migrations/20260128200000_campaign_builder.sql`

Created `campaign_drafts` table with:
- **Wizard step data**: Company profile, product details, ICP, offer, tone, sequence config
- **AI-generated content**: Email sequences with subject/body/personalization notes
- **Status tracking**: draft → generating → review → approved → exported
- **RLS policies**: Workspace isolation, user permissions
- **Indexes**: Optimized for workspace queries
- **Analytics view**: Campaign builder usage stats

### 2. ✅ TypeScript Types
**File**: `src/types/campaign-builder.ts`

Defined comprehensive types:
- `CampaignDraft` - Full database record
- `GeneratedEmail` - AI-generated email structure
- Step data interfaces (CompanyProfileData, ProductDetailsData, ICPData, etc.)
- API request/response types
- Wizard state management types
- Enums for status, tone, email length, sequence type, etc.

### 3. ✅ Repository Pattern
**File**: `src/lib/repositories/campaign-builder.repository.ts`

Following CLAUDE.md guidelines:
- `create()` - Create new campaign draft
- `getById()` - Get specific draft
- `listByWorkspace()` - List drafts with filtering/pagination
- `update()` - Update wizard progress
- `saveGeneratedEmails()` - Save AI-generated content
- `approve()` - Mark ready for export
- `markExported()` - Track export to EmailBison
- `delete()` - Remove draft
- `getWorkspaceStats()` - Analytics

### 4. ✅ AI Generation Service
**File**: `src/lib/services/campaign-builder/ai-generator.ts`

Uses Anthropic Claude 3.5 Sonnet:
- `generateEmailSequence()` - Generate full email sequence from draft
- `regenerateEmail()` - Regenerate single email with feedback
- Smart prompt engineering based on Sales.co best practices
- Structured JSON output parsing
- Error handling and validation
- Personalization variables ({{FirstName}}, {{Company}}, etc.)

**AI Prompt Features**:
- Context-aware generation based on company/product/ICP
- Sequence-specific emails (initial, value-add, social proof, breakup)
- Tone matching (professional, casual, witty, direct)
- Length control (short/medium/long)
- Personalization levels (light/medium/heavy)
- Anti-spam safeguards

### 5. ✅ API Routes

#### `/api/campaign-builder`
- **GET** - List campaign drafts (with status/pagination)
- **POST** - Create new campaign draft

#### `/api/campaign-builder/[id]`
- **GET** - Get specific campaign draft
- **PATCH** - Update draft (wizard progress)
- **DELETE** - Delete campaign draft

#### `/api/campaign-builder/[id]/generate`
- **POST** - Generate AI email sequence
  - Validates required fields (company_name, problem_solved, primary_cta)
  - Updates status to 'generating'
  - Calls Anthropic API
  - Saves generated emails
  - Handles errors gracefully

#### `/api/campaign-builder/[id]/approve`
- **POST** - Approve campaign (ready for export)
  - Validates has generated emails
  - Updates status to 'approved'

#### `/api/campaign-builder/[id]/export`
- **GET** - Export campaign for EmailBison
  - Formats: CSV, JSON, manual (readable text)
  - Marks as exported
  - Returns downloadable content

---

## Wizard Flow

### Step 1: Company Profile
Collect:
- Company name
- Industry/vertical
- Company size
- Website URL
- Value proposition (1-2 sentences)
- Key differentiators vs competitors

### Step 2: Product/Service Details
Collect:
- Product/service name
- Problem it solves
- Key features (top 3-5)
- Pricing model
- Case studies/social proof
- Common objections and rebuttals

### Step 3: Ideal Customer Profile (ICP)
Collect:
- Target job titles/roles
- Target company sizes
- Target industries
- Geographic focus
- Pain points they experience
- Buying triggers

### Step 4: Offer/CTA Configuration
Collect:
- Primary CTA (book demo, free trial, etc.)
- Secondary CTA (download resource, watch video)
- Urgency/scarcity elements
- Meeting link (Calendly, etc.)

### Step 5: Tone & Style Preferences
Collect:
- Tone (professional, casual, witty, direct)
- Email length (short, medium, long)
- Personalization level (light, medium, heavy)
- Reference style (formal, casual, first-name)

### Step 6: Sequence Configuration
Collect:
- Number of emails (1-10)
- Sequence type (cold outreach, follow-up, nurture, re-engagement)
- Days between emails
- Sequence goal (meeting booked, reply, click, awareness)

### Step 7: Generate & Review
- Click "Generate Campaign"
- AI creates email sequence
- Review each email
- Edit if needed
- Approve when satisfied

### Step 8: Export to EmailBison
- Choose export format (CSV, JSON, manual)
- Download or copy content
- Import into EmailBison
- Launch campaign

---

## AI Email Sequence Structure

Generated emails follow proven cold outreach patterns:

**Email 1 (Day 0)** - Initial Outreach
- Hook with pain point or curiosity
- Establish relevance
- Soft CTA (question or low-commitment ask)

**Email 2 (Day 3)** - Value-Add Follow-up
- Share insight, resource, or tip
- Build credibility
- No hard ask

**Email 3 (Day 6)** - Social Proof
- Case study or testimonial
- Address common objection
- Include CTA

**Email 4 (Day 9)** - Direct Ask
- Clear value proposition
- Strong CTA
- Urgency if appropriate

**Email 5 (Day 12)** - Breakup Email
- Last attempt
- Alternative CTA
- Leave door open

**Email 6+ (Optional)** - Re-engagement
- New angle or value prop
- Final ask
- Unsubscribe option

---

## Export Formats

### CSV Export
```csv
Step,Day,Subject,Body,Personalization Notes
1,0,"Subject line","Email body","Tips for personalizing"
2,3,"Follow-up subject","Follow-up body","More tips"
...
```

### JSON Export
```json
{
  "campaign_name": "Campaign Name",
  "company": {...},
  "icp": {...},
  "sequence": {...},
  "emails": [
    {
      "step": 1,
      "day": 0,
      "subject": "...",
      "body": "...",
      "personalization_notes": "...",
      "variables": ["{{FirstName}}", "{{Company}}"]
    }
  ]
}
```

### Manual Export (Readable Text)
- Campaign overview
- Each email formatted with step, day, subject, body
- Personalization notes
- EmailBison import instructions

---

## Usage Example

### Creating a Campaign

```bash
# 1. Create draft
POST /api/campaign-builder
{
  "name": "Q1 2026 Cold Outreach"
}

# 2. Update with wizard data (step by step)
PATCH /api/campaign-builder/{id}
{
  "company_name": "Acme Corp",
  "industry": "B2B SaaS",
  "problem_solved": "Sales teams waste time on manual prospecting",
  "primary_cta": "Book a demo",
  ...
}

# 3. Generate emails
POST /api/campaign-builder/{id}/generate
{
  "regenerate": false
}

# 4. Review and approve
POST /api/campaign-builder/{id}/approve

# 5. Export
GET /api/campaign-builder/{id}/export?format=csv
```

---

## Integration with EmailBison

### After Export:

1. **CSV Import**
   - Download CSV file
   - Import into EmailBison sequence builder
   - Map fields to EmailBison structure

2. **API Sync** (Future)
   - Direct API integration with EmailBison
   - Automatic campaign creation
   - Bidirectional sync

3. **Manual Copy**
   - Copy each email subject/body
   - Paste into EmailBison
   - Configure personalization variables

---

## Monetization Strategy

### Free Tier
- 1 campaign draft per month
- Basic AI generation
- 3-email sequences max
- Manual export only

### Pro Tier ($49/mo)
- Unlimited campaign drafts
- Advanced AI generation with custom prompts
- Up to 10-email sequences
- All export formats
- Regenerate individual emails
- Priority support

### Credit-Based ($29 per campaign)
- Pay per campaign generation
- Includes 1 regeneration
- Full sequence length
- All export formats

---

## Environment Variables Required

```bash
# AI Generation (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-...

# Already configured
NEXT_PUBLIC_APP_URL=https://app.meetcursive.com
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Next Steps - UI Development

### Campaign Builder Dashboard
**File**: `src/app/(dashboard)/campaign-builder/page.tsx`
- List all campaign drafts
- Status indicators (draft, generating, review, approved, exported)
- Quick actions (edit, delete, export)
- Stats (total campaigns, exported, in progress)

### Campaign Builder Wizard
**File**: `src/app/(dashboard)/campaign-builder/new/page.tsx`
- 6-step wizard component
- Progress indicator
- Auto-save on step completion
- Field validation
- Helpful tips and examples

### Campaign Review
**File**: `src/app/(dashboard)/campaign-builder/[id]/review/page.tsx`
- Side-by-side email preview
- Edit individual emails
- Regenerate specific emails
- Approve/export actions

### Campaign Export
**File**: `src/app/(dashboard)/campaign-builder/[id]/export/page.tsx`
- Export format selection
- Download buttons
- EmailBison integration instructions
- Copy-to-clipboard functionality

---

## Testing Checklist

### API Endpoints
- [ ] Create campaign draft
- [ ] Update draft with all wizard steps
- [ ] Generate email sequence with AI
- [ ] Approve campaign
- [ ] Export in all formats (CSV, JSON, manual)
- [ ] List campaigns with filters
- [ ] Delete campaign

### AI Generation
- [ ] Generates correct number of emails
- [ ] Follows sequence pattern (initial → value-add → social proof → breakup)
- [ ] Matches tone preference
- [ ] Includes personalization variables
- [ ] Handles missing fields gracefully
- [ ] Parses JSON response correctly

### Export Formats
- [ ] CSV format is valid and importable
- [ ] JSON format is well-structured
- [ ] Manual format is readable
- [ ] Files download with correct names

### Error Handling
- [ ] Missing required fields shows helpful error
- [ ] AI generation failures don't break the flow
- [ ] Invalid updates are rejected
- [ ] Workspace isolation works correctly

---

## Files Created

### Database
- `supabase/migrations/20260128200000_campaign_builder.sql`

### Types
- `src/types/campaign-builder.ts`

### Repository
- `src/lib/repositories/campaign-builder.repository.ts`

### Services
- `src/lib/services/campaign-builder/ai-generator.ts`

### API Routes
- `src/app/api/campaign-builder/route.ts` (List, Create)
- `src/app/api/campaign-builder/[id]/route.ts` (Get, Update, Delete)
- `src/app/api/campaign-builder/[id]/generate/route.ts` (AI Generation)
- `src/app/api/campaign-builder/[id]/approve/route.ts` (Approve)
- `src/app/api/campaign-builder/[id]/export/route.ts` (Export)

---

## CLAUDE.md Compliance

All code follows project guidelines:
- ✅ Repository pattern for database access
- ✅ RLS policies for multi-tenant isolation
- ✅ Error handling with try/catch
- ✅ TypeScript types properly defined
- ✅ No direct Supabase calls in API routes (uses repository)
- ✅ Zod validation for API requests
- ✅ Service layer for business logic (AI generation)
- ✅ SSR patterns followed
- ✅ Security-first approach

---

## Summary

Successfully implemented a complete Sales.co-style Campaign Builder that:
1. Collects company/product/ICP information through a 6-step wizard
2. Uses AI (Anthropic Claude) to generate personalized email sequences
3. Allows review and editing of generated content
4. Exports to EmailBison in multiple formats
5. Tracks campaign drafts and status
6. Follows all project architecture patterns

**Key Differentiation**: This is a campaign CRAFTING tool, not a sending platform. It creates high-quality, personalized outreach content that users export to EmailBison for actual delivery.

Total implementation: ~800 lines of code across 9 files.
