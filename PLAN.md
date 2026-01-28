# Lead Marketplace Implementation Plan

## Executive Summary

This document outlines the implementation plan for building a two-sided lead marketplace on the existing Cursive platform. The good news: **significant infrastructure already exists**. This plan focuses on extending and connecting existing systems rather than rebuilding.

---

## Codebase Audit Summary

### What Already Exists

#### 1. Partner Infrastructure ✅
- `partners` table with API keys, payout rates, balances
- `partner_earnings` table for commission tracking
- `payouts` and `payout_requests` tables for Stripe Connect
- `lead_conversions` table for attribution
- Leads table has `partner_id` column
- Stripe Connect fields on partners (stripe_account_id, balances)

#### 2. Lead Routing System ✅
- `client_profiles` - buyer targeting with SIC codes, geography, caps
- `lead_sources` - tracks origins (pixel, upload, API, CSV)
- `lead_assignments` - routing decisions with delivery tracking
- `unroutable_leads` - failed routing with retry logic
- `upload_jobs` - CSV upload processing with field mapping
- `routing_audit_log` - comprehensive audit trail
- `lead_dedupe_keys` - email/phone/name+address deduplication
- `industry_categories` - 20+ categories with SIC codes seeded

#### 3. User Targeting ✅
- `user_targeting` - self-service buyer targeting preferences
- `user_lead_assignments` - leads assigned to users
- Lead caps (daily, weekly, monthly)

#### 4. Lead Purchase Foundations ✅
- `lead_purchases` table
- `buyers` table

#### 5. Core Infrastructure ✅
- Supabase Auth with multi-tenant middleware
- Repository pattern for data access
- Inngest background jobs (20+ functions)
- Stripe subscriptions
- Comprehensive RLS policies
- shadcn/ui + Tailwind CSS styling

### What Needs to Be Built

| Feature | Status | Priority |
|---------|--------|----------|
| Extended RBAC (partner role) | Partial | High |
| Partner Portal UI | Not started | High |
| Email Verification Integration | Not started | High |
| Lead Scoring System | Partial (lead_score exists) | High |
| Freshness Decay | Not started | Medium |
| Marketplace Browse UI | Not started | High |
| Credits System | Not started | Medium |
| Commission Calculation | Partial (tables exist) | High |
| Referral System | Not started | Medium |
| Admin Dashboard Enhancements | Partial | Medium |

---

## Key Architectural Decisions

### Decision 1: Partner vs User Model
**Choice**: Partners remain in separate `partners` table, NOT merged with `users`.

**Rationale**:
- Partners table already has specialized fields (API key, payout balances, Stripe Connect)
- Different auth flow (API key vs session-based)
- Cleaner separation of concerns
- Partners can later optionally have linked user accounts for portal access

### Decision 2: Email Verification Provider
**Choice**: MillionVerifier

**Rationale**:
- Cost-effective: $6/10K emails
- Simple REST API
- Batch processing support
- Good accuracy reputation

### Decision 3: Lead Exclusivity
**Choice**: Non-exclusive. Leads can be purchased by multiple buyers.

**Rationale**:
- Maximizes revenue per lead
- Partners earn commission on each sale
- Industry standard (Apollo, ZoomInfo model)
- Exclusive leads could be a premium tier later

### Decision 4: Catch-All Emails
**Choice**: Include in marketplace but flag and price 15% lower.

**Rationale**:
- Excluding reduces inventory significantly (~20-30%)
- Catch-all doesn't mean invalid, just higher risk
- Transparent pricing lets buyers decide

### Decision 5: Seed Data Attribution
**Choice**: Pre-partner seed data is platform-owned, no partner attribution.

**Rationale**:
- Prevents gaming (uploading duplicates of seed data)
- Clear separation of platform vs partner inventory
- Partners can still upload net-new leads

### Decision 6: Freshness Decay
**Choice**: Sigmoid decay curve

**Formula**:
```
freshness_score = max_score * (1 / (1 + e^(k * (days - midpoint))))

Where:
- max_score = 100
- k = 0.15 (steepness)
- midpoint = 30 days (50% decay point)
```

**Result**:
- Day 0: ~100
- Day 14: ~90
- Day 30: ~50
- Day 45: ~15
- Day 60+: ~5 (floor)

### Decision 7: Commission Holdback
**Choice**: 14-day holdback before commissions become payable.

**Rationale**:
- Protects against chargebacks
- Industry standard
- Short enough to maintain partner trust

### Decision 8: Partner Approval Flow
**Choice**: Auto-approve signup, manual review after first 100 leads.

**Rationale**:
- Lower friction for partner onboarding
- Quality gates kick in after real data submitted
- Can suspend quickly if quality issues arise

---

## Implementation Phases

### Phase 1: Database Schema Extensions
**Estimated effort**: 2-3 hours

#### 1.1 Extend Users Table for RBAC
```sql
-- Add partner-related fields to users (for partner portal access)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_partner_id UUID REFERENCES partners(id);
```

#### 1.2 Extend Leads Table for Marketplace
```sql
-- Marketplace-specific fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 100;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_result JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS hash_key VARCHAR(64);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_sold_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketplace_price DECIMAL(10,4);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_marketplace_listed BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS seniority_level VARCHAR(20);
```

#### 1.3 Create Marketplace Tables
```sql
-- marketplace_purchases (enhanced lead_purchases)
CREATE TABLE marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_workspace_id UUID NOT NULL REFERENCES workspaces(id),
  buyer_user_id UUID NOT NULL REFERENCES users(id),
  total_leads INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL, -- 'credits', 'stripe'
  stripe_payment_intent_id TEXT,
  credits_used INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  filters_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- marketplace_purchase_items (line items)
CREATE TABLE marketplace_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES marketplace_purchases(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  price_at_purchase DECIMAL(10,4) NOT NULL,
  partner_id UUID REFERENCES partners(id),
  commission_amount DECIMAL(10,4),
  commission_status VARCHAR(20) DEFAULT 'pending_holdback',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- workspace_credits
CREATE TABLE workspace_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- credit_purchases
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  credits INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES users(id),
  referrer_partner_id UUID REFERENCES partners(id),
  referred_user_id UUID REFERENCES users(id),
  referred_partner_id UUID REFERENCES partners(id),
  referral_type VARCHAR(20) NOT NULL, -- 'user_to_user', 'partner_to_partner'
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  milestones_achieved JSONB DEFAULT '[]',
  rewards_issued JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);
```

#### 1.4 Extend Partners Table
```sql
-- Partner quality and commission fields
ALTER TABLE partners ADD COLUMN IF NOT EXISTS verification_pass_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS duplicate_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_score INTEGER DEFAULT 70;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_tier VARCHAR(20) DEFAULT 'standard';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS base_commission_rate DECIMAL(5,4) DEFAULT 0.30;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bonus_commission_rate DECIMAL(5,4) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS referred_by_partner_id UUID REFERENCES partners(id);
```

---

### Phase 2: RBAC & Permission System
**Estimated effort**: 2-3 hours

#### 2.1 Create Permission Helpers
- `src/lib/auth/permissions.ts`
- Functions: `canUploadLeads()`, `canPurchaseLeads()`, `canViewPartnerData()`, etc.
- Role hierarchy: owner > admin > member
- Partner checks via `linked_partner_id` or separate partner auth

#### 2.2 Partner Authentication
- Partner portal auth via API key header OR linked user session
- Middleware to extract partner context
- API key validation using existing `validate_partner_api_key()` function

#### 2.3 Update API Routes
- Add permission checks to all relevant endpoints
- Partner-specific routes under `/api/partner/*`

---

### Phase 3: Partner Portal
**Estimated effort**: 6-8 hours

#### 3.1 Partner Dashboard (`/partner`)
- Total leads uploaded
- Leads sold count / revenue
- Partner score with breakdown
- Earnings overview (pending, available, paid)
- Quick stats cards

#### 3.2 Upload Interface (`/partner/upload`)
- Drag-and-drop CSV upload
- Column mapping UI (using existing `upload_jobs.field_mappings`)
- Preview first 20 rows
- Industry selection dropdown
- Upload progress with real-time stats
- Rejection reasons download

#### 3.3 Upload History (`/partner/uploads`)
- List of all uploads
- Per-upload stats (accepted, rejected, duplicates)
- Download rejected rows
- See sold leads from each upload

#### 3.4 Earnings Dashboard (`/partner/earnings`)
- Earnings breakdown by period
- Pending vs available balance
- Payout history
- Stripe Connect setup flow
- Request payout button

#### 3.5 Partner Settings (`/partner/settings`)
- Profile information
- Referral link
- Notification preferences

---

### Phase 4: Email Verification Integration
**Estimated effort**: 3-4 hours

#### 4.1 MillionVerifier Service
- `src/lib/services/email-verification.service.ts`
- Single and batch verification
- Rate limiting / queue management

#### 4.2 Verification Queue
- Inngest function: `lead/verify-email`
- Batch processing (100 emails per call)
- Status updates: pending → valid/invalid/catch_all/risky
- Webhook for async results (if MV supports)

#### 4.3 Re-verification Job
- Cron job to re-verify stale leads (60+ days unsold)
- Flag leads that become invalid

---

### Phase 5: Lead Scoring System
**Estimated effort**: 3-4 hours

#### 5.1 Intent Score Calculation
```typescript
function calculateIntentScore(lead: Lead): number {
  let score = 0;

  // Job title seniority
  if (lead.seniority_level === 'c_suite') score += 25;
  else if (lead.seniority_level === 'vp') score += 20;
  else if (lead.seniority_level === 'director') score += 15;
  else if (lead.seniority_level === 'manager') score += 10;
  else score += 5;

  // Company size
  const size = lead.company_employee_count || 0;
  if (size > 500) score += 25;
  else if (size > 200) score += 20;
  else if (size > 50) score += 15;
  else if (size > 10) score += 10;
  else score += 5;

  // Has direct work email (not generic)
  if (lead.email && !isGenericEmail(lead.email)) score += 15;
  else score -= 10;

  // Has verified phone
  if (lead.phone) score += 20;

  // Email domain matches company
  if (emailMatchesCompanyDomain(lead.email, lead.company_domain)) score += 10;

  // Data completeness
  if (isDataComplete(lead)) score += 10;

  return Math.min(100, Math.max(1, score));
}
```

#### 5.2 Freshness Score Decay
- Inngest cron job: daily freshness recalculation
- Sigmoid decay formula implementation
- Update `freshness_score` on all marketplace leads

#### 5.3 Price Calculation
```typescript
function calculateLeadPrice(lead: Lead): number {
  const basePrice = 0.05;

  // Intent multiplier
  let intentMultiplier = 1;
  if (lead.intent_score >= 67) intentMultiplier = 2.5;
  else if (lead.intent_score >= 34) intentMultiplier = 1.5;

  // Freshness multiplier
  let freshnessMultiplier = 1;
  if (lead.freshness_score >= 80) freshnessMultiplier = 1.5;
  else if (lead.freshness_score < 30) freshnessMultiplier = 0.5;

  let price = basePrice * intentMultiplier * freshnessMultiplier;

  // Add-ons
  if (lead.phone) price += 0.03;
  if (lead.verification_status === 'valid') price += 0.02;
  if (lead.verification_status === 'catch_all') price -= 0.01;

  return Math.round(price * 10000) / 10000;
}
```

---

### Phase 6: Marketplace UI
**Estimated effort**: 8-10 hours

#### 6.1 Browse Page (`/marketplace`)
- Sidebar filters:
  - Industry (multi-select)
  - Location (cascading: country → state → city)
  - Company size
  - Job title seniority
  - Intent score (slider or buckets)
  - Freshness
  - Has phone (toggle)
  - Email verified (toggle)
- Results grid with lead preview cards
- Obfuscated contact info
- Selection checkboxes
- Bulk add with filters

#### 6.2 Lead Preview Card
- Name, job title, company
- Industry badge
- Location
- Intent score indicator
- Freshness indicator
- Phone indicator
- Price

#### 6.3 Cart/Checkout (`/marketplace/checkout`)
- Selected leads summary
- Price breakdown
- Payment options:
  - Use credits (if balance > 0)
  - Stripe checkout
- Purchase confirmation
- Download CSV after purchase

#### 6.4 Purchase History (`/marketplace/purchases`)
- List of all purchases
- Filters used
- Re-download CSV (90 days)

#### 6.5 API Routes
- `GET /api/marketplace/leads` - Browse with filters
- `POST /api/marketplace/purchase` - Process purchase
- `GET /api/marketplace/purchases` - Purchase history
- `GET /api/marketplace/purchases/:id/download` - CSV download

---

### Phase 7: Credits System
**Estimated effort**: 2-3 hours

#### 7.1 Credit Packages
```typescript
const CREDIT_PACKAGES = [
  { credits: 1000, price: 75, pricePerCredit: 0.075 },
  { credits: 5000, price: 300, pricePerCredit: 0.06 },
  { credits: 10000, price: 500, pricePerCredit: 0.05 },
  { credits: 25000, price: 1000, pricePerCredit: 0.04 },
];
```

#### 7.2 Credit Purchase Flow
- Stripe checkout for credit packages
- Webhook handler to add credits on payment success
- Display balance in header

#### 7.3 Credit Deduction
- Deduct from balance before charging Stripe
- Partial credit + card payment support

---

### Phase 8: Commission System
**Estimated effort**: 4-5 hours

#### 8.1 Commission Calculation
```typescript
function calculateCommission(
  salePrice: number,
  partner: Partner,
  lead: Lead
): { rate: number; amount: number; bonuses: string[] } {
  let rate = partner.base_commission_rate; // 30% default
  const bonuses: string[] = [];

  // Fresh sale bonus (sold within 7 days of upload)
  const daysSinceUpload = daysBetween(lead.created_at, new Date());
  if (daysSinceUpload <= 7) {
    rate += 0.10;
    bonuses.push('fresh_sale');
  }

  // High verification rate bonus
  if (partner.verification_pass_rate >= 95) {
    rate += 0.05;
    bonuses.push('high_verification');
  }

  // Volume bonus
  if (partner.total_leads_uploaded >= 10000) {
    rate += 0.05;
    bonuses.push('volume');
  }

  // Cap at 50%
  rate = Math.min(rate, 0.50);

  return {
    rate,
    amount: salePrice * rate,
    bonuses
  };
}
```

#### 8.2 Purchase Processing
On purchase complete:
1. Mark leads as sold (increment `sold_count`)
2. Create `marketplace_purchase_items` records
3. For each partner-attributed lead:
   - Calculate commission
   - Create `partner_earnings` record
   - Increment partner `pending_balance`
4. Reveal full contact info to buyer
5. Generate CSV for download
6. Send confirmation email

#### 8.3 Weekly Payout Job
- Inngest cron: every Monday at 2am UTC
- Process commissions where `created_at < NOW() - 14 days`
- For partners with `available_balance >= $50`:
  - Create Stripe Transfer to Connect account
  - Mark commissions as `paid`
  - Send notification email

---

### Phase 9: Referral Programs
**Estimated effort**: 3-4 hours

#### 9.1 User Referral Program
- Generate unique code: `cursive.ai/signup?ref=USER_CODE`
- Store code in cookie (30 days)
- Rewards:
  - Signup: 50 credits to referrer
  - First purchase: 200 credits referrer, 100 to referred
  - $500 cumulative spend: 500 additional credits

#### 9.2 Partner Referral Program
- Partner code: `cursive.ai/partner?ref=PARTNER_CODE`
- Milestone rewards:
  - 1K verified leads: $50
  - $500 in commissions: $100
  - $2,000 in commissions: $250

#### 9.3 Referral Dashboard
- `/referrals` page for both users and partners
- Copy link button
- Pending/converted referrals
- Rewards earned

---

### Phase 10: Admin Dashboard Enhancements
**Estimated effort**: 5-6 hours

#### 10.1 Platform Overview (`/admin`)
- Total leads in marketplace
- Weekly lead additions
- Weekly revenue
- Active partners / buyers
- Revenue trend chart
- Industry distribution

#### 10.2 Lead Inventory (`/admin/leads`)
- All leads with admin filters
- Partner filter
- Sold/unsold filter
- Verification status filter
- Bulk actions (archive, re-verify, delete)

#### 10.3 Partner Management (`/admin/partners`)
- Partner list with stats
- Individual partner view
- Score adjustment
- Suspend/unsuspend
- Payout management

#### 10.4 Financial Dashboard (`/admin/financial`)
- Gross revenue
- Commissions paid
- Net revenue
- Pending payouts
- Credit packages sold

#### 10.5 Audit Log (`/admin/audit`)
- Track sensitive actions
- Role changes
- Pricing changes
- Partner suspensions

---

## File Structure for New Features

```
src/
├── app/
│   ├── partner/                    # NEW
│   │   ├── page.tsx               # Dashboard
│   │   ├── upload/
│   │   │   └── page.tsx           # Upload interface
│   │   ├── uploads/
│   │   │   └── page.tsx           # Upload history
│   │   ├── earnings/
│   │   │   └── page.tsx           # Earnings dashboard
│   │   └── settings/
│   │       └── page.tsx           # Partner settings
│   │
│   ├── marketplace/                # NEW
│   │   ├── page.tsx               # Browse leads
│   │   ├── checkout/
│   │   │   └── page.tsx           # Cart/checkout
│   │   ├── purchases/
│   │   │   └── page.tsx           # Purchase history
│   │   └── credits/
│   │       └── page.tsx           # Buy credits
│   │
│   ├── referrals/
│   │   └── page.tsx               # Referral dashboard
│   │
│   └── api/
│       ├── partner/
│       │   ├── dashboard/route.ts
│       │   ├── upload/route.ts
│       │   ├── uploads/route.ts
│       │   ├── earnings/route.ts
│       │   └── stripe-connect/route.ts
│       │
│       ├── marketplace/
│       │   ├── leads/route.ts
│       │   ├── purchase/route.ts
│       │   └── purchases/route.ts
│       │
│       ├── credits/
│       │   ├── balance/route.ts
│       │   └── purchase/route.ts
│       │
│       └── referrals/
│           └── route.ts
│
├── components/
│   ├── partner/                    # NEW
│   │   ├── upload-wizard.tsx
│   │   ├── column-mapper.tsx
│   │   ├── earnings-chart.tsx
│   │   └── partner-score-card.tsx
│   │
│   └── marketplace/                # NEW
│       ├── lead-filters.tsx
│       ├── lead-card.tsx
│       ├── lead-grid.tsx
│       ├── cart-summary.tsx
│       └── credit-balance.tsx
│
├── lib/
│   ├── services/
│   │   ├── email-verification.service.ts  # NEW
│   │   ├── lead-scoring.service.ts        # NEW
│   │   ├── commission.service.ts          # NEW
│   │   └── referral.service.ts            # NEW
│   │
│   └── repositories/
│       ├── marketplace.repository.ts      # NEW
│       ├── partner-portal.repository.ts   # NEW
│       └── referral.repository.ts         # NEW
│
└── inngest/
    └── functions/
        ├── email-verification.ts          # NEW
        ├── freshness-decay.ts             # NEW
        ├── weekly-payout.ts               # NEW
        └── partner-score-calc.ts          # NEW
```

---

## Environment Variables Needed

```env
# Email Verification (MillionVerifier)
MILLIONVERIFIER_API_KEY=xxx

# Stripe Connect
STRIPE_CONNECT_CLIENT_ID=ca_xxx
STRIPE_CONNECT_RETURN_URL=https://cursive.ai/partner/settings

# Referral System
REFERRAL_COOKIE_DAYS=30
MAX_REFERRAL_CREDITS_PER_MONTH=1000

# Commission Settings (can be in DB instead)
BASE_COMMISSION_RATE=0.30
MAX_COMMISSION_RATE=0.50
COMMISSION_HOLDBACK_DAYS=14
MIN_PAYOUT_AMOUNT=50
```

---

## Testing Strategy

### Unit Tests
- Commission calculation logic
- Price calculation logic
- Intent/freshness scoring
- Deduplication hash generation

### Integration Tests
- Partner upload flow (CSV → validation → dedup → verification queue)
- Purchase flow (select → pay → reveal → download)
- Commission flow (purchase → calculation → holdback → payout)
- Referral attribution

### E2E Tests
- Partner portal upload workflow
- Marketplace browse and purchase
- Stripe checkout success/failure
- Admin partner management

---

## Rollout Plan

### Week 1: Foundation
- Phase 1: Database migrations
- Phase 2: RBAC setup
- Phase 3: Partner portal (basic)

### Week 2: Core Features
- Phase 4: Email verification
- Phase 5: Scoring system
- Phase 6: Marketplace UI (basic)

### Week 3: Transactions
- Phase 7: Credits system
- Phase 8: Commission system

### Week 4: Polish
- Phase 9: Referrals
- Phase 10: Admin enhancements
- Testing and bug fixes

---

## Risk Mitigation

### Risk: Email verification costs spike
**Mitigation**: Implement verification budget caps, batch efficiently, cache results

### Risk: Partners upload garbage data
**Mitigation**: Quality gates, auto-suspension on high rejection rates, score-based commission tiers

### Risk: Buyers discover partner network
**Mitigation**: Strict data isolation, no partner metadata in buyer API responses, code review checks

### Risk: Commission calculation errors
**Mitigation**: Comprehensive unit tests, audit logging, manual review capability

### Risk: Stripe Connect compliance
**Mitigation**: Use Express accounts (Stripe handles KYC), proper onboarding flow

---

## Success Metrics

### Partner Side
- Partner signup rate
- Leads uploaded per partner per month
- Verification pass rate (target: >90%)
- Partner retention rate

### Buyer Side
- Marketplace page views
- Lead preview to purchase conversion
- Average purchase size
- Repeat purchase rate

### Financial
- Gross marketplace revenue
- Net revenue after commissions
- Credit package revenue
- Revenue per lead

---

## Open Items for Discussion

1. **Bulk discount tiers** - Implement now or later?
2. **Real-time verification** - Queue (async) vs inline (sync)?
3. **Partner tiers** - Implement Bronze/Silver/Gold now?
4. **Lead exclusivity** - Offer as premium option?
5. **Marketplace search** - Full-text search on company name?

---

*Last Updated: 2026-01-28*
*Status: Ready for implementation*
