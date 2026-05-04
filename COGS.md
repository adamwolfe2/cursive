# Cursive — Cost of Goods Sold (COGS) & Margin Model

**Last updated:** 2026-05-04
**Owner:** Adam
**Audience:** Maggie + leadership
**Purpose:** Single source of truth for what it costs to run Cursive, what it costs to deliver each client, and the margin we hold at each pricing tier. Use this to forecast, price new deals, and protect margin.

---

## TL;DR

| Bucket | Monthly | Notes |
|---|---|---|
| **Fixed platform overhead (normalized)** | **~$2,677** | What Cursive pays every month regardless of client count |
| **Fixed platform overhead (current bill)** | **~$2,910** | Vercel currently $293 due to misconfigured fluid provisioning — fix in flight |
| **Variable cost per client onboarded** | **~$0.20** | Claude API for the full enrichment + copy generation pipeline |
| **Variable cost per dollar collected** | **2.9% + $0.30** | Stripe processing |
| **Pass-through to client (no Cursive cost)** | $3.50/inbox/mo, ~$13/domain/yr | Negotiated rate; retail standard is $7–$8/inbox → margin opportunity |

**Break-even at current overhead:** ~3 Starter clients ($1,000 MRR each) covers all fixed costs.
**Gross margin at Starter pricing (1 client):** ~91% after allocated overhead at scale (30 clients).

---

## 1. Fixed Monthly Overhead

These costs are paid every month regardless of how many clients we have. Spread across the active client book.

### Sales / Distribution Stack

| Tool | Cost | Purpose | Notes |
|---|---|---|---|
| **Audience Lab** | $1,986.00/mo | Pixel identification + audience building (the IP) | Largest single line item — 74% of fixed overhead |
| **EmailBison** | $449.10/mo | Outbound email infrastructure / sending platform | Covers all client sending under one account |
| **GoHighLevel (GHL)** | $97.00/mo | CRM, pipeline, snapshots for client delivery | Snapshot template reused across all client subaccounts |
| **Google Workspace** | $33.00/mo | Email, Drive, Calendar | |
| **Subtotal** | **$2,565.10/mo** | | |

### Infrastructure Stack

| Tool | Cost (normalized) | Cost (current) | Purpose | Notes |
|---|---|---|---|---|
| **Vercel** | ~$60.00/mo | $292.95/mo | App + marketing hosting, edge, builds | Current bill inflated by misconfigured Fluid Provisioned Memory (running active vs. per-user). Fix in progress. Normalized estimate based on observed pre-spike usage (Feb–Mar) ~$30–80/mo. |
| **Supabase Pro** | $45.00/mo | $44.11 projected | Postgres, auth, storage, RLS | Avg of last 5 invoices: $34.97, $32.35, $34.86, $41.87, $44.11 → ~$37–45 trend. Pro plan base $25 + compute |
| **Domain (cursive — Namecheap)** | $1.08/mo | — | Cursive's own primary domain | $12.99/yr amortized |
| **Subtotal (normalized)** | **$106.08/mo** | $338.03 (current) | | |

### Shared Tools (allocated)

These are shared across multiple AM Collective projects. Allocated at 1/8 (assumes 8 active project surfaces).

| Tool | Full Cost | Allocated to Cursive | Purpose |
|---|---|---|---|
| **Clerk** (auth) | ~$25/mo | $3.00/mo | Admin / portal auth |
| **Resend** (transactional email) | ~$20/mo | $3.00/mo | Notifications, magic links |
| **Subtotal** | | **$6.00/mo** | |

### One-Time Setup Costs (already paid — fully amortized)

| Item | Cost |
|---|---|
| Stripe custom branding | $10.00 |

### Total Fixed Monthly Overhead

| Scenario | Total/mo |
|---|---|
| **Normalized (post Vercel fix)** | **$2,677.18** |
| Current bill (with Vercel anomaly) | $2,910.13 |

---

## 2. Variable Cost Per Client (Cursive-Borne)

These costs scale with client count. Cursive eats them — they are NOT passed through.

### Per-Onboarding AI Pipeline (Anthropic Claude Sonnet 4)

Sourced from `src/app/admin/api-costs/CostDashboard.tsx`. Pricing: $3/1M input tokens, $15/1M output tokens.

| Pipeline Step | Input Tokens | Output Tokens | Cost |
|---|---|---|---|
| AI Intake Parsing (internal intake only) | 3,000 | 2,000 | $0.039 |
| ICP Enrichment + Copy Research | 2,500 | 3,000 | $0.053 |
| Angle Selection | 2,000 | 1,500 | $0.029 |
| Copy Writing (3 sequences) | 4,000 | 5,000 | $0.087 |
| Auto-Fix (~30% trigger rate) | 3,000 | 4,000 | $0.021 |
| Copy Regeneration (on feedback, optional) | 5,000 | 5,000 | $0.090 |

**Full standard onboarding (no regen):** **~$0.19 / client**
**With regeneration round:** **~$0.28 / client**

### Per-Transaction Cost

| Item | Rate |
|---|---|
| Stripe processing | 2.9% + $0.30 per charge |

**Worked example — Starter @ $1,000/mo:** Stripe takes $29.30 → Cursive nets $970.70 from gross MRR.

### NOT Currently a Cost

These are on free tiers, dev-only, or unused at meaningful volume:

- OpenAI, Gemini, Tavily, Perplexity, Serper, Firecrawl, BuiltWith, Clay, Fal.ai
- Inngest (free tier)
- Sentry, PostHog (free tier or shared)

If/when any cross into paid territory, add to Section 1.

---

## 3. Pass-Through Costs (Client-Paid, Margin Opportunity)

**Current rule:** clients always cover their own infrastructure at-cost. This is the policy today.

### Inbox Infrastructure

| Item | Cursive Negotiated Cost | Retail Standard | Markup Opportunity |
|---|---|---|---|
| Email inbox | **$3.50/inbox/mo** | $7.00–$8.00/inbox/mo | **$4.00/inbox/mo profit** if billed at retail |

### Sending Domain Infrastructure

| Item | Cost | Notes |
|---|---|---|
| Domain registration | ~$12.99/yr (~$1.08/mo) | Namecheap; same vendor as Cursive's own domain |

### Margin Opportunity If We Mark Inboxes Up to Retail

| Tier | Inboxes | At-cost monthly | At-retail monthly | Cursive monthly profit |
|---|---|---|---|---|
| Starter | 6 | $21.00 | $45.00 | **+$24.00** |
| Growth | 15 | $52.50 | $112.50 | **+$60.00** |
| Scale | 30 | $105.00 | $225.00 | **+$120.00** |
| Enterprise | 60 | $210.00 | $450.00 | **+$240.00** |

**Strategic options:**
1. Keep at-cost as a sales lever ("we don't mark up your infrastructure")
2. Mark up to retail and capture margin (~$24–$240/mo per client)
3. Hybrid: at-cost on Starter (acquisition lever), full retail on Scale/Enterprise

---

## 4. Standard Pricing Tiers (Reference)

Pulled from `src/app/admin/deal-calculator/pricing-config.ts` — these are the templated tiers. All real deals are custom; use these as anchors.

### Outbound Tiers

| Tier | Domains | Inboxes | Emails/mo | Setup Fee | Monthly Price |
|---|---|---|---|---|---|
| Starter | 3 | 6 | 5,000 | $500 | $1,000 |
| Growth | 5 | 15 | 15,000 | $1,000 | $2,500 |
| Scale | 10 | 30 | 50,000 | $1,500 | $5,000 |
| Enterprise | 20 | 60 | Unlimited | $2,500 | $10,000 |

### Service Packages (Add-ons / Standalone)

| Package | Setup | Monthly | Notes |
|---|---|---|---|
| Super Pixel | $250 | $500 | Website visitor ID + audience building |
| Audience / Lead Lists | $0 | $750 | Enriched ICP-targeted lead lists |
| List Enrichment | $0 | $500 | Add-on |
| Paid Ads Activation | $250 | $500 | Sync audiences to ad platforms |
| Data Delivery | $0 | $250 | CSV / Sheets / CRM sync |

### Service Tiers (Enterprise DFY)

| Tier | Monthly | Description |
|---|---|---|
| Cursive Data | $1,000 | Custom lead research, 500–1,500 leads/mo |
| Cursive Outbound | $2,500 | Data + custom email sequences, AI personalization, dedicated manager |
| Cursive Automated Pipeline | $5,000 | Multi-channel, AI SDR, meeting booking, CRM integration |
| Cursive Venture Studio | $25,000 | Full growth team + strategic + equity option |

### Bundle Discounts (currently configured)

- Pixel + Outbound bundle: **10% off**
- 3+ services: additional **5% off**

---

## 5. Per-Client Gross Margin (Single Client View)

Direct variable cost per client per month (Cursive-borne) is essentially $0.20 (AI) + Stripe fees. The dominant cost is **allocated overhead**, which depends on how many clients we have.

### Allocated Overhead Per Client (Normalized $2,677/mo)

| Active Clients | Overhead allocation per client/mo |
|---|---|
| 5 | $535.44 |
| 10 | $267.72 |
| 15 | $178.48 |
| 20 | $133.86 |
| 30 | $89.24 |
| 50 | $53.54 |
| 100 | $26.77 |

### Gross Margin by Tier @ 30 Active Clients ($89/client overhead allocation)

| Tier | MRR | Stripe (2.9% + $0.30) | AI variable | Allocated overhead | **Gross profit** | **Gross margin** |
|---|---|---|---|---|---|---|
| Starter | $1,000 | $29.30 | $0.20 | $89.24 | **$881.26** | **88.1%** |
| Growth | $2,500 | $72.80 | $0.20 | $89.24 | **$2,337.76** | **93.5%** |
| Scale | $5,000 | $145.30 | $0.20 | $89.24 | **$4,765.26** | **95.3%** |
| Enterprise | $10,000 | $290.30 | $0.20 | $89.24 | **$9,620.26** | **96.2%** |

### Gross Margin by Tier @ 10 Active Clients ($268/client overhead allocation)

| Tier | MRR | Stripe | AI | Overhead | **Gross profit** | **Gross margin** |
|---|---|---|---|---|---|---|
| Starter | $1,000 | $29.30 | $0.20 | $267.72 | **$702.78** | **70.3%** |
| Growth | $2,500 | $72.80 | $0.20 | $267.72 | **$2,159.28** | **86.4%** |
| Scale | $5,000 | $145.30 | $0.20 | $267.72 | **$4,586.78** | **91.7%** |
| Enterprise | $10,000 | $290.30 | $0.20 | $267.72 | **$9,441.78** | **94.4%** |

> **Note:** These margins are **before labor**. See Section 7 — labor is the largest unmodeled cost and will materially change these numbers once filled in.

---

## 6. Break-Even & Forecasting

### What does it take to cover fixed overhead?

Normalized fixed overhead = **$2,677/mo**

| Mix | Clients needed to break even |
|---|---|
| Pure Starter ($1,000/mo) | 3 clients |
| Pure Growth ($2,500/mo) | 2 clients (1.07) |
| Pure Scale ($5,000/mo) | 1 client (0.54) |
| Pure Enterprise ($10,000/mo) | 1 client (0.27) |

### MRR Targets vs. Margin (normalized overhead)

| Active MRR | Fixed overhead | Variable (assume avg 20 clients) | EBITDA-style margin (pre-labor) |
|---|---|---|---|
| $10,000 | $2,677 | ~$2,940 (Stripe @3.2% blended) | **~44%** |
| $25,000 | $2,677 | ~$7,350 | **~60%** |
| $50,000 | $2,677 | ~$14,700 | **~65%** |
| $100,000 | $2,677 | ~$29,400 | **~68%** |

---

## 7. NOT YET MODELED — Labor & People Costs

**This is the biggest gap and will most affect true margin.** Need to add:

| Role | Comp model | Monthly cost | Hours/client/mo |
|---|---|---|---|
| Adam | TBD — owner draw or salary | TBD | TBD |
| Maggie | TBD — salary or contractor rate | TBD | TBD |
| Darren | TBD | TBD | TBD |
| Contractors / VAs / writers | TBD | TBD | TBD |

**Action:** Maggie + Adam fill this section in. Once filled, add a "fully-loaded margin" row to Section 5 tables.

**Rough check:** if blended labor costs $15K/mo, margin at 30 clients × Starter = $1,000 MRR drops from 88% to ~38%. Labor matters.

---

## 8. Forecasting Model — Simple Spreadsheet Logic

For Maggie to plug into Sheets / Notion:

```
GROSS_REVENUE = sum(client_MRR for each active client)
SETUP_REVENUE = sum(setup fees collected this month)

VARIABLE_COSTS:
  stripe_fees = (GROSS_REVENUE + SETUP_REVENUE) * 0.029 + (transaction_count * 0.30)
  ai_pipeline_costs = new_onboardings_this_month * 0.20

FIXED_COSTS = 2677  // normalized (use 2910 until Vercel fix lands)

CONTRIBUTION_MARGIN = GROSS_REVENUE + SETUP_REVENUE - VARIABLE_COSTS
GROSS_PROFIT = CONTRIBUTION_MARGIN - FIXED_COSTS
GROSS_MARGIN_% = GROSS_PROFIT / (GROSS_REVENUE + SETUP_REVENUE)

// Once labor is modeled:
LABOR_COSTS = sum of monthly comp across team
EBITDA = GROSS_PROFIT - LABOR_COSTS
EBITDA_% = EBITDA / GROSS_REVENUE
```

---

## 9. Action Items / Next Steps

| # | Item | Owner | Impact |
|---|---|---|---|
| 1 | Fix Vercel Fluid Provisioned Memory misconfiguration (active → per-user) | Adam | Saves ~$200–230/mo |
| 2 | Fill in Section 7 (labor) | Maggie + Adam | Determines true margin |
| 3 | Decide inbox markup policy (at-cost vs. retail vs. hybrid) | Maggie + Adam | Up to +$24–$240/client/mo new revenue |
| 4 | Right-size Supabase compute (currently growing — was $32 in Feb, $44 projected May) | Adam | Could save $10–20/mo |
| 5 | Re-evaluate GHL: $97/mo — is it earning its keep vs. consolidating CRM in-platform? | Maggie | $97/mo if cut |
| 6 | Build live COGS dashboard in `/admin/api-costs` (Anthropic) + `/admin/cogs` (full picture) | Adam | Replace this static doc with live data |
| 7 | Confirm Audience Lab plan ($1,986/mo) is still the right tier vs. usage | Maggie | Largest line item — biggest savings opportunity if overprovisioned |

---

## 10. Margin Floor — Recommended Policy

Until labor is modeled, use these as deal-floor guardrails:

- **No deal under $1,000/mo MRR** without explicit margin override (Starter floor)
- **Minimum target gross margin (pre-labor): 80%** at any client count > 10
- **Custom packages**: never quote below 4× variable cost + allocated overhead
- **Pass-through (inboxes, domains)**: bill at retail by default for new clients; at-cost only as a closing concession

---

## Appendix A — Source of Numbers

| Number | Source |
|---|---|
| Audience Lab $1,986/mo | Adam (vendor invoice) |
| EmailBison $449.10/mo | Adam (vendor invoice) |
| Vercel current $292.95 | Vercel billing dashboard, Apr 2026 cycle |
| Supabase $32–$44/mo | Supabase past invoices Jan–May 2026 |
| GoHighLevel $97/mo | Adam |
| Google Workspace $33/mo | Adam |
| Namecheap domain $12.99/yr | Adam |
| Stripe custom branding $10 one-time | Adam |
| Anthropic per-step token estimates | `src/app/admin/api-costs/CostDashboard.tsx` |
| Sonnet 4 token pricing ($3 in / $15 out per 1M) | Anthropic public pricing |
| Pricing tiers + packages | `src/app/admin/deal-calculator/pricing-config.ts` |
| Bundle discounts (10% / 5%) | Same |
| Stripe processing 2.9% + $0.30 | Stripe standard rate |
| Inbox negotiated $3.50 vs. retail $7–8 | Adam |

## Appendix B — Things That Could Change This Materially

1. **Audience Lab usage-based pricing** — confirm the $1,986 is fixed, not metered on identifications
2. **Client growth past 50** — Vercel + Supabase may step up; revisit at 50, 100, 200 clients
3. **EmailBison sender count** — if pricing scales with senders, model this per-tier
4. **Adding a paid Inngest plan** — likely needed past 10–20 clients with heavy automation
5. **PostHog past free tier** — 1M events/mo ceiling; may hit at scale
6. **New AI features** — multi-channel, AI SDR (Cursive Pipeline tier) will increase per-client AI cost from $0.20 to potentially $5–20/client/mo
