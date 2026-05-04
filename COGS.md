# Cursive — Cost of Goods Sold (COGS) & Client Roster

**Last updated:** 2026-05-04
**Owner:** Adam
**Purpose:** Single source of truth for what it costs to run Cursive each month, who is currently paying, and what's in the pipeline. Strict facts only.

---

## Summary

| Bucket | Monthly |
|---|---|
| **Active MRR (paying clients)** | **$7,100** |
| **Confirmed but paused/warming** | $1,500 |
| **Performance-contingent ceiling** | up to $20,000+ |
| **Fixed platform overhead (normalized)** | $3,077 |
| **Fixed platform overhead (current bill)** | $3,310 |
| **Variable cost per client onboarded** | ~$0.20 |
| **Variable cost per dollar collected** | 2.9% + $0.30 (Stripe) |

The current bill is higher than normalized because Vercel Fluid Provisioned Memory is misconfigured (running active vs. per-user). Fix in flight.

**Net contribution today (Active MRR − Normalized overhead):** ~$4,023/mo before labor.

---

## 1. Active Paying Clients (Current MRR: $7,100)

These clients are currently paying Cursive and using Cursive infrastructure (data, outbound, or both).

| Client | Service | Monthly | Setup / Notes |
|---|---|---|---|
| **DevSwarm** | Lead data + outbound (using Cursive data to fund campaign) | **$5,500/mo** | Paying down $24,000 in invoices at $5,500/mo |
| **Olander** | Pixel + Audience + Outbound (custom) — using Cursive data for leads + outbound | **$1,500/mo** | $3,500 setup paid |
| **JustSearched (Jason Smith)** | Outbound (friend rate, testing) | **$100/mo** | $200 down. Cursive runs the outbound. |
| **Total** | | **$7,100/mo** | |

---

## 2. Confirmed but Paused / Warming (Pipeline-Adjacent)

Committed terms, not yet recognizing revenue.

| Client | Status | Confirmed Terms |
|---|---|---|
| **Pitch&Co (Rob Seacat)** | Domains + inboxes purchased and warming. Client requested temporary pause; we plan to push through. | $1,500/mo + 10–15% on closed deals ($30K–$50K each). Full outbound managed by Cursive. |

---

## 3. Performance-Contingent (No MRR Until Trigger)

Revenue depends on milestone achievement. No guaranteed monthly until performance hits.

| Client | Trigger | Potential |
|---|---|---|
| **Superpower Mentors** | $0 until 100 form completions delivered. After trigger: ongoing engagement. | Up to **$20,000/mo** |

---

## 4. Cross-Sell / Pixel Deployments (No Direct Cursive MRR)

These accounts use Cursive infrastructure (typically the pixel) inside another AM Collective product. Revenue is recognized in the host project's P&L, not in Cursive MRR. Listed here for visibility because they consume Cursive overhead (Audience Lab pixel slots, GHL, Supabase).

| Account | Host Project | Cursive Component |
|---|---|---|
| **Norman / Telegraph Commons** | Telegraph Commons | Pixel on site |
| **LeaseStack onboarded users** | LeaseStack | Every new LeaseStack signup gets their own pixel (built-in cross-sell) |
| **Brett Davis (print-on-demand / PPS)** | PPS | Pixel coming + potential outbound to identified visitors |

---

## 5. Pipeline / Opportunities (Not Closed)

Active conversations. No commitment yet.

| Lead | Source / Context |
|---|---|
| **Marshall Nebeker** — shipwithshore.com | Direct |
| **Ajla Burina** — contactout.com | Darren's relationship |
| **Brad Parnell** — genierocket.com | Has pixel on his site; opportunity to deploy across all GHL sub-accounts |

---

## 6. Fixed Monthly Overhead

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

## 7. Variable Cost Per Client (Cursive-Borne)

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

## 8. Per-Transaction Cost

| Item | Rate |
|---|---|
| Stripe processing | 2.9% + $0.30 per charge |

---

## 9. Pass-Through Costs (Client-Paid)

Clients always cover their own infrastructure at-cost.

| Item | Cost |
|---|---|
| Email inbox | $3.50/inbox/mo |
| Sending domain | ~$12.99/yr (Namecheap) |

---

## 10. Not Currently a Cost

These are on free tiers or unused at meaningful volume. Listed for completeness — add to Section 6 if/when they cross into paid:

OpenAI, Gemini, Tavily, Perplexity, Serper, Firecrawl, BuiltWith, Clay, Fal.ai, Inngest, Sentry, PostHog.

---

## 11. Forward Revenue View

| Scenario | Monthly |
|---|---|
| Today (Active only) | $7,100 |
| + Pitch&Co resumes at confirmed terms | $8,600 |
| + Superpower Mentors hits trigger (low end) | $13,600+ |
| + Superpower Mentors hits trigger (high end) | $28,600+ |
| + Pitch&Co performance bonus per closed deal ($30–50K × 10–15%) | +$3,000 to +$7,500 per deal |
| + Pipeline conversions (Marshall / Ajla / Brad) | TBD on close |

---

## Appendix — Source of Numbers

| Number | Source |
|---|---|
| Active paying clients + amounts | Adam (verbal, 2026-05-04) |
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
| Inbox cost $3.50 | Negotiated vendor rate |
