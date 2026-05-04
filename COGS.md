# Cursive — Cost of Goods Sold (COGS)

**Last updated:** 2026-05-04
**Owner:** Adam
**Purpose:** Single source of truth for what it costs to run Cursive each month and per client. Strict costs only.

---

## Summary

| Bucket | Monthly |
|---|---|
| **Fixed platform overhead (normalized)** | **$3,077** |
| **Fixed platform overhead (current bill)** | **$3,310** |
| **Variable cost per client onboarded** | **~$0.20** |
| **Variable cost per dollar collected** | **2.9% + $0.30** (Stripe) |

The current bill is higher than normalized because Vercel Fluid Provisioned Memory is misconfigured (running active vs. per-user). Fix in flight.

---

## 1. Fixed Monthly Overhead

### Sales / Distribution Stack

| Tool | Cost | Purpose |
|---|---|---|
| Audience Lab | $1,986.00/mo | Pixel identification + audience building |
| GoHighLevel (GHL) | $497.00/mo | CRM, pipeline, snapshots for client delivery |
| EmailBison | $449.10/mo | Outbound email infrastructure |
| Google Workspace | $33.00/mo | Email, Drive, Calendar |
| **Subtotal** | **$2,965.10/mo** | |

### Infrastructure Stack

| Tool | Normalized | Current | Purpose |
|---|---|---|---|
| Vercel | ~$60.00/mo | $292.95/mo | App + marketing hosting |
| Supabase Pro | $45.00/mo | $44.11 projected | Postgres, auth, storage |
| Cursive domain (Namecheap, $12.99/yr) | $1.08/mo | $1.08/mo | Primary domain |
| **Subtotal** | **$106.08/mo** | **$338.14/mo** | |

### Shared Tools (Allocated 1/8 across AM Collective projects)

| Tool | Full Cost | Allocated to Cursive |
|---|---|---|
| Clerk | ~$25/mo | $3.00/mo |
| Resend | ~$20/mo | $3.00/mo |
| **Subtotal** | | **$6.00/mo** |

### One-Time Setup (Already Paid)

| Item | Cost |
|---|---|
| Stripe custom branding | $10.00 |

### Total Fixed Monthly Overhead

| Scenario | Total |
|---|---|
| **Normalized (post Vercel fix)** | **$3,077.18/mo** |
| Current bill (with Vercel anomaly) | $3,310.13/mo |

---

## 2. Variable Cost Per Client (Cursive-Borne)

Sourced from `src/app/admin/api-costs/CostDashboard.tsx`. Anthropic Claude Sonnet 4 pricing: $3/1M input tokens, $15/1M output tokens.

| Pipeline Step | Input Tokens | Output Tokens | Cost |
|---|---|---|---|
| AI Intake Parsing (internal intake only) | 3,000 | 2,000 | $0.039 |
| ICP Enrichment + Copy Research | 2,500 | 3,000 | $0.053 |
| Angle Selection | 2,000 | 1,500 | $0.029 |
| Copy Writing (3 sequences) | 4,000 | 5,000 | $0.087 |
| Auto-Fix (~30% trigger rate) | 3,000 | 4,000 | $0.021 |
| Copy Regeneration (on feedback) | 5,000 | 5,000 | $0.090 |

| Scenario | Per-Client Cost |
|---|---|
| Standard onboarding (no regen) | **~$0.19** |
| With regeneration round | **~$0.28** |

---

## 3. Per-Transaction Cost

| Item | Rate |
|---|---|
| Stripe processing | 2.9% + $0.30 per charge |

---

## 4. Pass-Through Costs (Client-Paid)

Clients always cover their own infrastructure at-cost.

| Item | Cost |
|---|---|
| Email inbox | $3.50/inbox/mo |
| Sending domain | ~$12.99/yr (Namecheap) |

---

## 5. Not Currently a Cost

These are on free tiers or unused at meaningful volume. Listed for completeness — add to Section 1 if/when they cross into paid:

OpenAI, Gemini, Tavily, Perplexity, Serper, Firecrawl, BuiltWith, Clay, Fal.ai, Inngest, Sentry, PostHog.

---

## Appendix — Source of Numbers

| Number | Source |
|---|---|
| Audience Lab $1,986/mo | Vendor invoice |
| GoHighLevel $497/mo | Vendor invoice |
| EmailBison $449.10/mo | Vendor invoice |
| Vercel current $292.95 | Vercel billing dashboard, Apr 2026 cycle |
| Supabase $32–$44/mo | Past invoices Jan–May 2026 |
| Google Workspace $33/mo | Vendor invoice |
| Namecheap domain $12.99/yr | Vendor invoice |
| Stripe custom branding $10 one-time | Stripe |
| Anthropic per-step token estimates | `src/app/admin/api-costs/CostDashboard.tsx` |
| Sonnet 4 token pricing | Anthropic public pricing |
| Stripe processing 2.9% + $0.30 | Stripe standard rate |
| Inbox cost $3.50, retail $7–8 | Negotiated vendor rate |
