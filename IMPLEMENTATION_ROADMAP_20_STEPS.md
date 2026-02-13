# 20-Step Implementation Roadmap: Cursive Production Excellence

## Context

**Completed:**
- ✅ Phase 1-6: Platform Excellence Roadmap (deployed)
- ✅ Tier 1: Lead magnet, import processing, admin pixel mapper
- ✅ Tier 2: Lead Database Search + Segment Builder (critical bugs fixed)

**Current State:**
- 280M+ database access working
- Credit-based monetization functional
- Workspace isolation verified
- TypeScript: 0 errors

**Next:** Transform Cursive into a production-scale, revenue-generating platform

---

## Strategic Priorities

1. **Revenue Generation** - Features that drive $$$
2. **User Retention** - Keep customers engaged
3. **Scale Readiness** - Handle 10x growth
4. **Admin Efficiency** - Reduce support burden
5. **Data Quality** - Increase lead value

---

## PHASE 1-5: Complete Tier 3 + Critical Infrastructure (Week 1)

### Step 1: Persist Saved Segments to Database
**Priority:** HIGH | **Impact:** User Retention | **Time:** 2-3 hours

**Why:** Users lose saved segments on page refresh (current: component state only)

**Implementation:**
```sql
-- Migration: 20260213_saved_segments.sql
CREATE TABLE saved_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  last_count INTEGER DEFAULT 0,
  last_run TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_segments_workspace ON saved_segments(workspace_id, status);
CREATE INDEX idx_saved_segments_user ON saved_segments(user_id);
```

**API Endpoints:**
- `GET /api/segments` - List user's segments
- `POST /api/segments` - Create segment
- `PATCH /api/segments/[id]` - Update segment
- `DELETE /api/segments/[id]` - Delete segment
- `POST /api/segments/[id]/run` - Execute segment (preview/pull)

**Frontend Updates:**
- Load segments from API on mount
- Autosave on segment changes
- Show "Last run: X mins ago"
- Quick run button per segment

**Success Metrics:**
- Segments persist across sessions ✅
- Users can run saved segments 1-click ✅
- Average segments per user tracked

---

### Step 2: Batch Enrichment Uploader
**Priority:** HIGH | **Impact:** Revenue | **Time:** 4-5 hours

**Why:** Users have existing lead lists they want to enrich (monetization opportunity)

**User Flow:**
1. Upload CSV (email, phone, name, company)
2. Preview: "Found 245/300 matches, 15 credits"
3. Purchase enrichment
4. Download enriched CSV with 40+ data points

**Implementation:**

**Frontend:** `src/app/(app)/batch-enrichment/page.tsx`
```typescript
interface BatchJob {
  id: string
  filename: string
  total_rows: number
  matched_rows: number
  credit_cost: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  created_at: string
}

// Features:
// - CSV drag & drop upload
// - Column mapping UI (map CSV cols to AL fields)
// - Preview matches + credit cost
// - Process button (deducts credits)
// - Job progress tracker
// - Download enriched CSV
```

**API:** `src/app/api/audiencelab/batch-enrichment/route.ts`
```typescript
// POST /api/audiencelab/batch-enrichment
// - Parse CSV
// - Call AL batch enrichment API
// - Store job in batch_enrichment_jobs table
// - Return job_id for polling

// GET /api/audiencelab/batch-enrichment/[jobId]
// - Poll AL for job status
// - Return progress + results when complete

// GET /api/audiencelab/batch-enrichment/[jobId]/download
// - Generate enriched CSV
// - Stream to download
```

**Database:**
```sql
CREATE TABLE batch_enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  al_job_id TEXT, -- Audience Labs job ID
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  matched_rows INTEGER,
  credits_cost DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  input_file_url TEXT,
  output_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Credit Pricing:**
- $0.10 per enriched record (cheaper than individual pulls)
- Minimum 100 records

**Success Metrics:**
- CSV uploads per week
- Enrichment revenue
- Match rate % (aim for 70%+)

---

### Step 3: Import Job Dashboard
**Priority:** MEDIUM | **Impact:** Admin Efficiency | **Time:** 3-4 hours

**Why:** Track batch imports, retry failures, monitor AL integration health

**Features:**
- View all batch import jobs (pixel events, CSV uploads, enrichments)
- Filter by status: pending, processing, completed, failed
- Retry failed jobs
- View error logs
- Stats: total imported, success rate, avg processing time

**Implementation:**

**Frontend:** `src/app/admin/audiencelab/jobs/page.tsx`
```typescript
interface ImportJob {
  id: string
  type: 'pixel_events' | 'csv_upload' | 'batch_enrichment'
  workspace: { name: string, slug: string }
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_records: number
  processed_records: number
  failed_records: number
  created_at: string
  duration_ms: number
  error_message?: string
}

// Features:
// - Real-time job list with auto-refresh
// - Retry button for failed jobs
// - View detailed logs per job
// - Export job history CSV
```

**API:** `src/app/api/admin/audiencelab/jobs/route.ts`
```typescript
// GET /api/admin/audiencelab/jobs
// - List all jobs across workspaces
// - Filter by status, type, date range
// - Pagination

// POST /api/admin/audiencelab/jobs/[id]/retry
// - Reprocess failed job
// - Reset status to pending
// - Trigger Inngest function
```

**Unified Jobs Table:**
```sql
CREATE TABLE audiencelab_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_records INTEGER,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_status ON audiencelab_jobs(status, created_at DESC);
CREATE INDEX idx_jobs_workspace ON audiencelab_jobs(workspace_id);
```

---

### Step 4: AL Integration Monitoring Dashboard
**Priority:** MEDIUM | **Impact:** Production Reliability | **Time:** 3-4 hours

**Why:** Proactive monitoring prevents customer issues

**Metrics to Track:**
- API response times (avg, p95, p99)
- Error rates by endpoint
- Credit usage per workspace
- Pixel event processing lag
- Database search success rate
- Batch job completion rate

**Implementation:**

**Frontend:** `src/app/admin/audiencelab/monitoring/page.tsx`
```typescript
// Dashboard sections:
// 1. Health Overview
//    - API status (green/yellow/red)
//    - Last 24h error rate
//    - Avg response time

// 2. Performance Metrics
//    - Response time chart (last 7 days)
//    - Error rate trend
//    - Throughput (requests/min)

// 3. Resource Usage
//    - Credits consumed per workspace
//    - Top credit spenders
//    - Pixel events queued

// 4. Recent Errors
//    - Last 50 errors with details
//    - Quick retry action
```

**Metrics Table:**
```sql
CREATE TABLE audiencelab_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'api_response_time', 'error_rate', etc
  endpoint TEXT,
  value DECIMAL(10,2),
  metadata JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_type_time ON audiencelab_metrics(metric_type, recorded_at DESC);
```

**Background Job:** Log metrics every 5 minutes
```typescript
// src/inngest/functions/log-al-metrics.ts
export const logALMetrics = inngest.createFunction(
  { id: 'log-al-metrics' },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    // Query last 5 min API calls
    // Calculate avg response time, error rate
    // Store in audiencelab_metrics
  }
)
```

---

### Step 5: Atomic Credit Transactions
**Priority:** MEDIUM | **Impact:** Data Integrity | **Time:** 2 hours

**Why:** Prevent race conditions on concurrent credit deductions

**Problem:** Two simultaneous requests could overdraw credits

**Solution:** Postgres RPC with row-level locking

```sql
-- Migration: 20260213_atomic_credit_deductions.sql

CREATE OR REPLACE FUNCTION deduct_credits(
  p_workspace_id UUID,
  p_amount DECIMAL,
  p_action_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE(
  success BOOLEAN,
  new_balance DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Lock row for update
  UPDATE workspaces
  SET credits_balance = credits_balance - p_amount
  WHERE id = p_workspace_id AND credits_balance >= p_amount
  RETURNING credits_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::DECIMAL,
      'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  -- Log usage
  INSERT INTO credit_usage (workspace_id, credits_used, action_type, metadata)
  VALUES (p_workspace_id, p_amount, p_action_type, p_metadata);

  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    v_new_balance,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Refund function
CREATE OR REPLACE FUNCTION refund_credits(
  p_workspace_id UUID,
  p_amount DECIMAL,
  p_reason TEXT
) RETURNS DECIMAL AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  UPDATE workspaces
  SET credits_balance = credits_balance + p_amount
  WHERE id = p_workspace_id
  RETURNING credits_balance INTO v_new_balance;

  INSERT INTO credit_usage (workspace_id, credits_used, action_type, metadata)
  VALUES (p_workspace_id, -p_amount, 'refund', jsonb_build_object('reason', p_reason));

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
```

**Update API Routes:**
```typescript
// Replace inline credit deduction with RPC call
const { data: result } = await supabase.rpc('deduct_credits', {
  p_workspace_id: workspace.id,
  p_amount: actualCost,
  p_action_type: 'al_database_pull',
  p_metadata: { filters, lead_count: newRecords.length }
})

if (!result[0].success) {
  return NextResponse.json(
    { error: result[0].error_message },
    { status: 402 }
  )
}
```

---

## PHASE 6-10: Revenue Features + Self-Service (Week 2)

### Step 6: Credit Purchase Flow
**Priority:** CRITICAL | **Impact:** Revenue | **Time:** 4-5 hours

**Why:** Users need to buy credits to use premium features

**Implementation:**

**Frontend:** `src/app/(app)/credits/page.tsx`
```typescript
// Credit packages:
const packages = [
  { credits: 100, price: 49, per_credit: 0.49, label: 'Starter' },
  { credits: 500, price: 199, per_credit: 0.40, label: 'Growth', popular: true },
  { credits: 1000, price: 349, per_credit: 0.35, label: 'Pro' },
  { credits: 5000, price: 1499, per_credit: 0.30, label: 'Enterprise' },
]

// Features:
// - Package cards with pricing
// - Current balance display
// - Stripe Checkout integration
// - Transaction history
// - Auto-reload option
```

**API:** `src/app/api/credits/checkout/route.ts`
```typescript
// POST /api/credits/checkout
// - Create Stripe Checkout session
// - Store pending purchase in DB
// - Redirect to Stripe

// Webhook: /api/webhooks/stripe
// - On checkout.session.completed
// - Credit workspace balance
// - Send receipt email
// - Log transaction
```

**Database:**
```sql
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  credits_purchased INTEGER NOT NULL,
  amount_paid_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Pricing Strategy:**
- Volume discounts (30%+ at 5k credits)
- No expiration on credits
- Auto-reload at threshold (optional)

---

### Step 7: Usage Analytics Dashboard
**Priority:** HIGH | **Impact:** User Retention | **Time:** 3-4 hours

**Why:** Users need visibility into credit spend, lead quality, ROI

**Frontend:** `src/app/(app)/analytics/page.tsx`
```typescript
// Sections:
// 1. Credit Usage Overview
//    - Total spent this month
//    - Credits remaining
//    - Burn rate (credits/day)
//    - Projected depletion date

// 2. Lead Acquisition Breakdown
//    - Leads by source (database, marketplace, pixel)
//    - Cost per lead by source
//    - Duplicate rate

// 3. Top Performing Segments
//    - Most-run saved segments
//    - Avg leads per segment
//    - Best ROI segments

// 4. Pixel Performance (if customer has pixel)
//    - Events captured
//    - Unique visitors
//    - Identity resolution rate
```

**API:** `src/app/api/analytics/usage/route.ts`
```typescript
// Aggregate queries:
// - Credit usage by day (last 30 days)
// - Lead sources breakdown
// - Segment performance
// - Pixel event stats
```

**Charts:**
- Credit spend trend (line chart)
- Lead sources (donut chart)
- Daily acquisition (bar chart)

---

### Step 8: Self-Service Pixel Onboarding
**Priority:** HIGH | **Impact:** Growth | **Time:** 4-5 hours

**Why:** Remove admin bottleneck, let customers provision pixels themselves

**User Flow:**
1. User clicks "Add Website Pixel"
2. Enters website name + URL
3. System provisions pixel via AL API
4. Shows install instructions + pixel script
5. Verifies pixel firing (test endpoint)

**Implementation:**

**Frontend:** `src/app/(app)/pixels/new/page.tsx`
```typescript
// Form fields:
// - Website name
// - Website URL (validated)
// - Webhook URL (optional, defaults to Cursive)

// After creation:
// - Show pixel script to copy
// - Installation guide (WordPress, Shopify, HTML)
// - Test pixel button
// - Status: "Installing" → "Active" (when first event received)
```

**API:** `src/app/api/pixels/route.ts`
```typescript
// POST /api/pixels
// - Call AL API: provisionCustomerPixel()
// - Store in audiencelab_pixels table
// - Return pixel_id + script

// GET /api/pixels/[id]/test
// - Check if events received in last 5 minutes
// - Return status: connected | waiting
```

**Pixel Install Guide Component:**
```typescript
// Show platform-specific instructions
// - Generic HTML (copy-paste into <head>)
// - WordPress (plugin instructions)
// - Shopify (theme.liquid placement)
// - Google Tag Manager (custom HTML tag)
```

**Success Metrics:**
- Pixels created per week
- % pixels that go active (receive events)
- Time to first event

---

### Step 9: Lead Scoring & Prioritization
**Priority:** MEDIUM | **Impact:** Lead Quality | **Time:** 3-4 hours

**Why:** Help users focus on best leads (increase conversion)

**Scoring Factors:**
1. **Deliverability** (from AL): email/phone verified
2. **Engagement** (if from pixel): pages viewed, time on site
3. **Firmographic** (from AL): company size, industry match
4. **Recency**: newer leads score higher
5. **Intent signals**: job title matches ICP

**Implementation:**

**Scoring Algorithm:**
```typescript
function calculateLeadScore(lead: Lead): number {
  let score = 0

  // Deliverability (max 30 points)
  if (lead.email_verified) score += 20
  if (lead.phone_verified) score += 10

  // Engagement (max 30 points) - if from pixel
  if (lead.source === 'audiencelab_pixel') {
    score += Math.min(lead.pages_viewed * 3, 20)
    score += Math.min(lead.time_on_site_seconds / 60, 10) // 1 pt per min
  }

  // Firmographic (max 25 points)
  if (lead.company_size?.match(/201-500|501-1000/)) score += 15
  if (PRIORITY_INDUSTRIES.includes(lead.industry)) score += 10

  // Recency (max 15 points)
  const daysOld = daysSince(lead.created_at)
  score += Math.max(15 - daysOld, 0)

  return Math.min(score, 100)
}
```

**Database:**
```sql
ALTER TABLE leads ADD COLUMN score INTEGER DEFAULT 0;
CREATE INDEX idx_leads_score ON leads(workspace_id, score DESC);

-- Recalculate scores nightly
CREATE OR REPLACE FUNCTION recalculate_lead_scores() RETURNS void AS $$
BEGIN
  -- Run scoring algorithm on all leads
  -- Update scores
END;
$$ LANGUAGE plpgsql;
```

**Frontend Updates:**
- Show score badge on lead cards
- Filter by score range (80-100, 60-79, etc)
- Sort by score (default)
- Score trend chart

---

### Step 10: Email Sequence Builder
**Priority:** MEDIUM | **Impact:** User Engagement | **Time:** 5-6 hours

**Why:** Automate lead nurturing, increase conversions

**Features:**
- Drag-and-drop sequence builder
- Trigger: lead added to segment
- Actions: send email, wait X days, add tag, remove from sequence
- Email templates with variables {{first_name}}, {{company_name}}
- Track: open rate, click rate, reply rate

**Implementation:**

**Frontend:** `src/app/(app)/sequences/builder/page.tsx`
```typescript
interface SequenceStep {
  id: string
  type: 'email' | 'wait' | 'condition'
  config: {
    template_id?: string
    wait_days?: number
    condition?: string
  }
}

// Visual canvas with nodes & connections
// Libraries: react-flow or similar
```

**Database:**
```sql
CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  trigger_type TEXT, -- 'segment_added', 'manual', 'webhook'
  trigger_config JSONB,
  steps JSONB NOT NULL, -- Array of SequenceStep
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES email_sequences(id),
  lead_id UUID REFERENCES leads(id),
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Email Sending:**
- Use SendGrid/Resend API
- Track opens via pixel
- Track clicks via redirect links
- Store events in email_events table

---

## PHASE 11-15: Partner Features + Marketplace (Week 3)

### Step 11: Partner Lead Upload Portal
**Priority:** HIGH | **Impact:** Supply | **Time:** 4-5 hours

**Why:** Scale lead inventory via affiliates/partners

**Partner Flow:**
1. Partner signs up (separate onboarding)
2. Uploads CSV with leads
3. Sets price per lead
4. System validates quality
5. Admin approves
6. Leads appear in marketplace

**Implementation:**

**Frontend:** `src/app/partner/upload/page.tsx`
```typescript
// Upload form:
// - CSV drag & drop
// - Preview: X valid leads, Y duplicates, Z invalid
// - Set price per lead
// - Category/industry tags
// - Quality guarantee checkbox

// Validation rules:
// - Email format valid
// - Phone format valid (optional)
// - No duplicates in batch
// - Min 50 leads per upload
```

**API:** `src/app/api/partner/leads/upload/route.ts`
```typescript
// POST /api/partner/leads/upload
// 1. Parse CSV
// 2. Validate each row
// 3. Check duplicates (global)
// 4. Calculate quality score
// 5. Create pending submission
// 6. Notify admin for approval
```

**Database:**
```sql
CREATE TABLE partner_lead_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id),
  filename TEXT NOT NULL,
  total_leads INTEGER,
  valid_leads INTEGER,
  duplicate_leads INTEGER,
  price_per_lead DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  quality_score INTEGER,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
```

**Quality Scoring:**
- Email deliverability check (via ZeroBounce API)
- Data completeness (phone, company, title)
- Freshness (leads < 90 days old)
- No duplicates

---

### Step 12: Marketplace Advanced Filters
**Priority:** MEDIUM | **Impact:** User Experience | **Time:** 3 hours

**Why:** Help buyers find perfect leads faster

**New Filters:**
- Lead age (last 7 days, 30 days, 90 days)
- Price range ($0.10-$5.00)
- Quality score (80+, 90+, 95+)
- Data completeness (has phone, has LinkedIn, etc)
- Industry multi-select
- Geography (state, city, zip)
- Company size
- Job seniority

**Implementation:**

**Frontend:** Update marketplace page with filter sidebar
```typescript
// Filters state:
const [filters, setFilters] = useState({
  price_min: 0,
  price_max: 5,
  quality_min: 80,
  age_days: 30,
  has_phone: false,
  has_linkedin: false,
  industries: [],
  states: [],
  company_sizes: [],
})
```

**API:** Add query params to marketplace endpoint
```typescript
// GET /api/marketplace?price_min=0.5&quality_min=90&industry=Technology
// Use Postgres WHERE clauses with indexes
```

**Performance:**
- Add composite indexes for common filter combos
- Cache popular searches (Redis)

---

### Step 13: Bulk Lead Actions
**Priority:** MEDIUM | **Impact:** Admin Efficiency | **Time:** 2-3 hours

**Why:** Save time on repetitive tasks

**Actions:**
- Bulk approve/reject leads
- Bulk assign to campaign
- Bulk export to CSV
- Bulk tag
- Bulk delete

**Implementation:**

**Frontend:** Add checkboxes to lead table
```typescript
// Select all checkbox
// Individual checkboxes per row
// Action bar appears when >0 selected
// Actions: Approve, Reject, Export, Delete, Tag, Assign to Campaign
```

**API:** `src/app/api/leads/bulk/route.ts`
```typescript
// POST /api/leads/bulk
// Body: { action, lead_ids: [...] }

switch (action) {
  case 'approve':
    await supabase
      .from('leads')
      .update({ verification_status: 'approved' })
      .in('id', lead_ids)
      .eq('workspace_id', workspace_id)
    break

  case 'export':
    // Generate CSV
    // Stream download
    break

  // ... other actions
}
```

**Limits:**
- Max 1000 leads per bulk action
- Show progress bar for large batches

---

### Step 14: Lead Deduplication Engine
**Priority:** HIGH | **Impact:** Data Quality | **Time:** 4 hours

**Why:** Prevent duplicate purchases, improve data quality

**Deduplication Strategy:**

**Level 1: Exact Match**
- Email match (case-insensitive)
- Phone match (normalized: +1-555-123-4567 → 5551234567)

**Level 2: Fuzzy Match**
- Name + Company similarity (85%+ match)
- Using trigram similarity or Levenshtein distance

**Implementation:**

**Migration: Add deduplication hash:**
```sql
ALTER TABLE leads ADD COLUMN dedup_hash TEXT;
CREATE UNIQUE INDEX idx_leads_dedup_hash ON leads(workspace_id, dedup_hash);

-- Generate hash from email + normalized phone
CREATE OR REPLACE FUNCTION generate_dedup_hash(
  p_email TEXT,
  p_phone TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN md5(
    LOWER(COALESCE(p_email, '')) ||
    regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g')
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate on insert
CREATE TRIGGER trg_leads_dedup_hash
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_dedup_hash();
```

**Fuzzy Matching (optional):**
```sql
-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Find similar leads
SELECT id, first_name, last_name, company_name,
       similarity(company_name, 'Acme Corp') as sim
FROM leads
WHERE similarity(company_name, 'Acme Corp') > 0.6
ORDER BY sim DESC;
```

**Admin Tool:** Merge duplicate leads
```typescript
// /admin/leads/duplicates
// - Find potential duplicates
// - Show side-by-side comparison
// - Merge button (keeps best data from both)
```

---

### Step 15: Webhook Notifications
**Priority:** MEDIUM | **Impact:** Integration | **Time:** 3 hours

**Why:** Let customers integrate Cursive with their CRM/tools

**Events to Emit:**
- `lead.created` - New lead added
- `lead.updated` - Lead data changed
- `lead.scored` - Score recalculated
- `pixel.event` - Website visitor action
- `credit.low` - Balance below threshold
- `sequence.completed` - Email sequence finished

**Implementation:**

**Database:**
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types
  secret TEXT NOT NULL, -- For HMAC signature
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Webhook Service:**
```typescript
// src/lib/webhooks/deliver.ts
export async function deliverWebhook(
  workspace_id: string,
  event_type: string,
  payload: any
) {
  // Find active webhooks for this workspace & event
  const webhooks = await getWebhooks(workspace_id, event_type)

  for (const webhook of webhooks) {
    // Sign payload with HMAC
    const signature = createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    // Deliver via Inngest (retry + backoff)
    await inngest.send({
      name: 'webhook.deliver',
      data: {
        webhook_id: webhook.id,
        url: webhook.url,
        payload,
        signature,
      }
    })
  }
}
```

**Frontend:** Webhook management UI
```typescript
// /app/(app)/settings/webhooks
// - Add webhook (URL + events)
// - Test webhook button
// - View delivery logs
// - Retry failed deliveries
```

---

## PHASE 16-20: Production Hardening + Scale (Week 4)

### Step 16: Rate Limiting & Abuse Prevention
**Priority:** HIGH | **Impact:** Security | **Time:** 3-4 hours

**Why:** Prevent API abuse, protect infrastructure

**Rate Limits:**
- API calls: 100/min per workspace
- Credit purchases: 5/hour per workspace
- Lead exports: 10/day per workspace
- Pixel provisioning: 3/day per workspace

**Implementation:**

**Upstash Redis for rate limiting:**
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'ratelimit:api',
})

export const creditPurchaseLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'ratelimit:purchase',
})
```

**Apply to routes:**
```typescript
// Middleware
const { success, limit, reset, remaining } = await apiRateLimit.limit(
  workspace_id
)

if (!success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', reset },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      }
    }
  )
}
```

**Abuse Detection:**
- Flag workspaces with >1000 API calls/hour
- Auto-pause if suspicious patterns
- Admin notification

---

### Step 17: Database Performance Optimization
**Priority:** HIGH | **Impact:** Scale | **Time:** 3-4 hours

**Why:** Handle 10x data growth without slowdowns

**Optimizations:**

**1. Add Missing Indexes:**
```sql
-- Lead queries
CREATE INDEX CONCURRENTLY idx_leads_created_score
  ON leads(workspace_id, created_at DESC, score DESC);

CREATE INDEX CONCURRENTLY idx_leads_source_status
  ON leads(workspace_id, source, verification_status);

-- Marketplace queries
CREATE INDEX CONCURRENTLY idx_leads_marketplace_price
  ON leads(is_marketplace_listed, marketplace_price)
  WHERE is_marketplace_listed = true;

-- Pixel events
CREATE INDEX CONCURRENTLY idx_pixel_events_workspace_created
  ON audiencelab_events(workspace_id, created_at DESC)
  WHERE processed = true;
```

**2. Partitioning Large Tables:**
```sql
-- Partition audiencelab_events by month
CREATE TABLE audiencelab_events_2026_02
  PARTITION OF audiencelab_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Auto-create partitions via cron
```

**3. Materialized Views for Dashboards:**
```sql
-- Workspace stats view
CREATE MATERIALIZED VIEW workspace_stats AS
SELECT
  workspace_id,
  COUNT(*) FILTER (WHERE source = 'audiencelab_pixel') as pixel_leads,
  COUNT(*) FILTER (WHERE source = 'audiencelab_database') as database_leads,
  COUNT(*) FILTER (WHERE source = 'marketplace') as marketplace_leads,
  SUM(score) / NULLIF(COUNT(*), 0) as avg_score,
  MAX(created_at) as last_lead_at
FROM leads
GROUP BY workspace_id;

CREATE UNIQUE INDEX ON workspace_stats(workspace_id);

-- Refresh hourly
CREATE OR REPLACE FUNCTION refresh_workspace_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY workspace_stats;
END;
$$ LANGUAGE plpgsql;
```

**4. Query Optimization:**
```sql
-- Use EXPLAIN ANALYZE to find slow queries
EXPLAIN ANALYZE
SELECT * FROM leads
WHERE workspace_id = 'xxx'
  AND verification_status = 'approved'
ORDER BY created_at DESC
LIMIT 50;

-- Add covering indexes where needed
```

---

### Step 18: Error Tracking & Alerting
**Priority:** MEDIUM | **Impact:** Reliability | **Time:** 2-3 hours

**Why:** Catch issues before users report them

**Implementation:**

**Sentry Integration:**
```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization']
    }
    return event
  },
})
```

**Custom Alerts:**
```typescript
// Alert when:
// - Credit balance depleted
// - Pixel stops sending events
// - API error rate >5%
// - Database query >2s

// Send to:
// - Slack webhook
// - Email
// - PagerDuty (for critical)
```

**Health Check Endpoint:**
```typescript
// /api/health
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    audiencelab_api: await checkALApi(),
    stripe: await checkStripe(),
    redis: await checkRedis(),
  }

  const healthy = Object.values(checks).every(c => c === 'ok')

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  )
}
```

**Uptime Monitoring:**
- BetterUptime or UptimeRobot
- Monitor /api/health every 1 min
- Alert if down >2 min

---

### Step 19: Documentation & Onboarding
**Priority:** MEDIUM | **Impact:** User Success | **Time:** 4-5 hours

**Why:** Reduce support burden, increase activation

**Documentation Hub:** `/docs`

**Sections:**

1. **Getting Started**
   - Quick start guide (5 min to first lead)
   - How credits work
   - Pricing explained

2. **Features**
   - Lead Database Search
   - Segment Builder
   - Batch Enrichment
   - Email Sequences
   - Pixel Installation
   - Marketplace

3. **API Reference**
   - Authentication
   - Endpoints
   - Webhooks
   - Rate limits
   - SDKs (optional)

4. **Integrations**
   - HubSpot
   - Salesforce
   - Zapier
   - Make (Integromat)

5. **Best Practices**
   - Lead scoring strategies
   - Segment examples
   - Email templates
   - Conversion optimization

**Interactive Onboarding:**
```typescript
// First login checklist:
// ☐ Buy credits
// ☐ Search database
// ☐ Create segment
// ☐ Install pixel
// ☐ Set up webhook

// Show progress: "3/5 complete"
// Reward: Bonus 10 credits on completion
```

**Video Tutorials:**
- 2 min: "Your first database search"
- 3 min: "Building smart segments"
- 4 min: "Installing the pixel"
- 5 min: "Setting up email sequences"

---

### Step 20: Production Launch Checklist
**Priority:** CRITICAL | **Impact:** Go-Live | **Time:** 1 day

**Final Pre-Launch Tasks:**

**Security:**
- ✅ All API routes have auth checks
- ✅ RLS policies tested on all tables
- ✅ Rate limiting enabled
- ✅ CSRF protection active
- ✅ Secrets rotated
- ✅ HTTPS enforced
- ✅ Security headers configured

**Performance:**
- ✅ All indexes created
- ✅ Materialized views refreshing
- ✅ CDN configured (Vercel)
- ✅ Image optimization enabled
- ✅ Database connection pooling
- ✅ Redis caching active

**Monitoring:**
- ✅ Sentry configured
- ✅ Uptime monitoring active
- ✅ Error alerting set up
- ✅ Performance monitoring
- ✅ Log aggregation (Datadog/LogDNA)

**Business:**
- ✅ Stripe production mode
- ✅ Terms of Service live
- ✅ Privacy Policy live
- ✅ Pricing page accurate
- ✅ Support email configured
- ✅ Refund policy documented

**Backups:**
- ✅ Database daily backups
- ✅ Point-in-time recovery enabled
- ✅ Backup restoration tested
- ✅ Disaster recovery plan

**Testing:**
- ✅ E2E tests passing
- ✅ Load testing completed (can handle 100 concurrent users)
- ✅ Staging environment mirrors production
- ✅ Rollback plan ready

**Launch Day:**
1. Deploy to production
2. Smoke test critical flows
3. Enable monitoring dashboards
4. Notify early access users
5. Monitor for first 24h
6. Collect feedback
7. Iterate quickly on issues

---

## Success Metrics by Phase

**Phase 1-5 (Infrastructure):**
- Segments persist: 100% retention
- Batch jobs complete: >95% success rate
- API response time: <500ms p95
- Zero race conditions on credits

**Phase 6-10 (Revenue):**
- Credit purchases: >$10k MRR by month 2
- Self-service pixels: 50+ created/month
- Lead score accuracy: >70% (manual validation)
- Email sequences: 20% open rate, 3% reply rate

**Phase 11-15 (Marketplace):**
- Partner uploads: 100k leads/month
- Lead quality: >85 avg score
- Duplicate rate: <5%
- Webhook deliveries: >99% success

**Phase 16-20 (Scale):**
- API uptime: >99.9%
- Database queries: <200ms p95
- Error rate: <0.1%
- Support tickets: <10/week (self-service working)

---

## Timeline Summary

| Week | Phases | Focus | Outcome |
|------|--------|-------|---------|
| 1 | 1-5 | Infrastructure + Tier 3 | Solid foundation |
| 2 | 6-10 | Revenue features | Monetization live |
| 3 | 11-15 | Marketplace scale | Supply + demand |
| 4 | 16-20 | Production hardening | Launch ready |

**Total: 4 weeks to production-scale platform**

---

## Risk Mitigation

**Technical Risks:**
- AL API changes → Maintain integration tests
- Database scale → Partition + materialize early
- Race conditions → Use RPC everywhere

**Business Risks:**
- Low lead quality → Strict partner validation
- Credit fraud → Stripe Radar + manual review
- Churn → Usage analytics + engagement emails

**Operational Risks:**
- Downtime → Multi-region deployment
- Data loss → Daily backups + PITR
- Support overload → Comprehensive docs + chatbot

---

## Next Steps

**Ready to start?** Pick a phase:

1. **Quick Wins** (Start with Steps 1, 6, 8) - 1 day for high impact
2. **Revenue First** (Steps 6-10) - Focus on monetization
3. **Sequential** (Steps 1-20 in order) - Methodical approach
4. **Parallel** (Multiple steps simultaneously) - Fastest completion

**Your call!** Which approach fits your timeline and priorities?
