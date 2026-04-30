# Cursive — Executive Strategy Memo

> Generated: 2026-03-28

## Platform Thesis

**What it is:** Cursive is an AI-powered outbound revenue platform. It finds qualified leads (via AudienceLab's 280M profile database), enriches them with verified contact data, auto-enrolls them in personalized email sequences, and uses an AI SDR to classify replies and auto-draft responses — turning cold leads into booked meetings with minimal human involvement.

**The one-line pitch:** *ZoomInfo + Outreach + an AI SDR, for $149/month.*

**Competitive moat:**
- AudienceLab ESP-verified data (daily re-verified — most competitors use stale lists)
- Karpathy-style autoresearch loop: continuously A/B tests your messaging and improves it automatically
- Website visitor de-anonymization (pixel) tied directly into the outreach pipeline
- You own EmailBison (the sending infrastructure) — no per-seat email seat cost

---

## Cost Per User (Monthly COGS)

| Cost Item | Free User | Pro User ($149/mo) |
|---|---|---|
| AudienceLab leads (est. $0.01-0.02/lead) | $3/mo (10/day × 30) | $30-60/mo (100/day × 30) |
| AudienceLab enrichments (est. $0.02-0.05/enrichment) | $1.80/mo (3/day × 30) | $20-50/mo (1,000/mo cap) |
| Claude AI (Haiku reply classification) | ~$0.01 | ~$0.10-$0.50 |
| Supabase compute (shared, pro-rated) | ~$0.50 | ~$1.50 |
| Vercel (pro-rated) | ~$0.10 | ~$0.50 |
| Inngest (function runs, pro-rated) | ~$0.25 | ~$2-5 |
| Resend (transactional emails) | ~$0.01 | ~$0.05 |
| EmailBison (your own infra — near-zero marginal) | ~$0 | ~$0 |
| **Total COGS est.** | **~$5.60/mo** | **~$55-115/mo** |

**Gross margin on Pro at $149/mo:** $34–94/mo = **23–63%**

**Critical finding:** AudienceLab API cost is your margin killer. At 100 leads/day the data cost alone could be $30-60/month. You need to either:
1. Negotiate volume pricing with AudienceLab
2. Cache/deduplicate aggressively across workspaces (cross-workspace dedup reduces AL calls)
3. Price Pro at $199-249/month to hit 70%+ gross margin

**At $199/month Pro, gross margin = 42–75%.** That's your real price floor.

---

## Unit Economics Targets

| Metric | Current (est.) | Target |
|---|---|---|
| MRR | $0 | $10k by day 60 |
| Pro ARPU | $149/mo | $179/mo (add annual discount) |
| Gross Margin | 23-63% | 70%+ |
| CAC | Unknown | <$300 |
| LTV (18-month avg) | $149 × 18 = $2,682 | $179 × 24 = $4,296 |
| LTV:CAC | — | >9:1 |
| Payback period | — | <3 months |

---

## 5 Highest-Leverage ICPs

### ICP 1: Home Services Marketing Agency (HIGHEST PRIORITY)

**Who:** Digital agencies that run lead gen for HVAC, plumbing, roofing, solar, and pest control companies. Think 5-20 person agencies managing 10-50 local service clients.

**Pain:** They manually scrape lists, buy expensive ZoomInfo data, and spend hours setting up campaigns per client. Their clients churn if leads dry up.

**Why Cursive wins:** Your ICP targeting UI already has HVAC/Roofing/Plumbing/Solar built in. Each client = one workspace. Agency owner buys multiple workspace seats. Pipeline value: 10 client workspaces × $149 = $1,490/mo from one agency.

**Where to find them:** Local service business Facebook groups, "HVAC Marketing" Google search, GoHighLevel community (huge overlap), Service Titan partner ecosystem.

**Cold email angle:** *"How are you generating leads for your HVAC clients right now? We built a platform that delivers 100 verified HVAC decision-maker leads per day, per client, with automated email follow-up. I'd love to show you in 15 minutes."*

---

### ICP 2: B2B SaaS Founder / Head of Growth ($1M-$20M ARR)

**Who:** Series Seed to Series A SaaS companies that need outbound pipeline but can't afford a full SDR team.

**Pain:** Apollo gives data, Outreach does sequences — but they need a human SDR to tie it together. $60-80k/year for one SDR. Cursive replaces the SDR for $149-299/month.

**Why Cursive wins:** AI SDR auto-classifies replies, auto-drafts responses, auto-books meetings. The autoresearch loop continuously improves copy. Replaces $80k/year SDR with $1,800/year.

**Where to find them:** LinkedIn (VP Sales, Head of Growth, Co-founder titles at 10-100 employee SaaS), YC Hacker News hiring threads, Slack communities (SaaStr, RevGenius), Product Hunt.

**Cold email angle:** *"Your SDR costs $80k/year. What if you could get the same pipeline for $149/month? [1 sentence about what the AI SDR does]. Worth 15 minutes?"*

---

### ICP 3: Independent Insurance Broker / Financial Advisor

**Who:** Solo or small-team independent advisors (insurance, wealth management, mortgages) who prospect via referrals but want to systematize cold outreach.

**Pain:** Compliance-aware prospecting. They need targeted lists by geography and income bracket but can't afford enterprise data tools.

**Why Cursive wins:** Location targeting by state/city, daily lead drip, low-touch AI follow-up. They're used to paying $200-500/month for tools. Very sticky — once they get a client from it, they never cancel.

**Where to find them:** LinkedIn (CFP, insurance broker, independent financial advisor), NAIFA, local BNI groups, Facebook groups for independent agents.

**LTV:** Very high. Advisors with a book of business churn almost never. 36+ month avg LTV.

---

### ICP 4: Commercial Real Estate Broker / Mortgage Broker

**Who:** Commercial RE brokers targeting property owners, investors, or developers. Mortgage brokers targeting real estate investors or home buyers.

**Pain:** Constantly need fresh leads in specific markets. Their deal size ($5k-50k commission per deal) means even 1 deal from Cursive justifies a year of subscription.

**Why Cursive wins:** Website visitor de-anonymization is huge here — someone researching "commercial real estate Dallas" on your client's site is a red-hot lead. Immediate enrichment + automated follow-up.

**Cold email angle:** *"Most CRE brokers are still buying list after list from CoStar. We built a way to identify who's visiting your website, who they are, and automatically email them the same day. One client, one commission, pays for 2+ years."*

---

### ICP 5: Recruiting Firm / Executive Search Agency

**Who:** Boutique recruiting firms (10-100 person) that do retained or contingency executive search. They prospect both clients (companies hiring) and candidates.

**Pain:** They manually source on LinkedIn Recruiter ($9k/seat/year). They need a way to find hiring managers to pitch their services.

**Why Cursive wins:** 280M verified profiles, AI SDR for reply handling. LinkedIn Recruiter + Outreach replacement at 1/20th the cost.

**Where to find them:** LinkedIn (VP Talent Acquisition, Executive Recruiter), NAPS (National Association of Personnel Services), ERE communities.

---

## Dream 100: Audiences to Partner With

The goal: find the person who controls the audience, not the individual buyer.

### Tier 1 — Highest leverage (reach out this week)

| Person / Channel | Audience | Pitch |
|---|---|---|
| **Josh Nelson** (Plumbers/HVAC/Roofers podcast, 50k+ listeners) | Home services marketing agencies | Revenue share or affiliate for every agency they send. His audience is your ICP 1. |
| **GoHighLevel Community** (Shaun Clark, 50k+ agency owners on GHL) | Digital marketing agencies | GHL integration + co-marketing. GHL agencies already pay $300-500/mo for tools. |
| **Cold Email Wizard / Instantly.ai YouTube** (30-50k subs) | Cold email practitioners, SDRs | Demo Cursive's autoresearch loop vs manual A/B testing. These people already understand the value prop. |
| **Skool communities** (SMMA, Agency, Cold Email niches) | Agency owners, founders | Post a case study or demo. Free group posts = free distribution to 10k-50k buyers. |
| **Patrick Dang** (YouTube, 200k+ subs, B2B sales) | B2B sales reps, SDRs | Sponsorship or collab video: "I replaced my $80k SDR with this AI tool." |

### Tier 2 — Build toward (month 2-3)

| Person / Channel | Audience | Pitch |
|---|---|---|
| **Alex Hormozi** ($100M+ audience, entrepreneurs) | Business owners, agency owners | Too big to cold DM — get into his ecosystem (Skool, events) first |
| **Scott Leese** (Surf & Sales podcast, B2B sales leaders) | VPs of Sales, RevOps | Podcast interview about AI SDR + autoresearch loop |
| **Service Titan** partner ecosystem | HVAC/plumbing businesses directly | Integration partner listing |
| **Jobber** partner ecosystem | Home services companies | Same as above |
| **YC Startup School** newsletter / Hacker News | Early-stage SaaS founders | ICP 2 — show them the cost math |

**Your Dream 100 cold email strategy:** Use EmailBison right now. Pull a list of "podcast host," "YouTuber," "community owner" in the agency/sales/B2B niche from Cursive, find their business email, and send a short partner pitch. Not a sales email — a "here's what's in it for you" email (affiliate commission, co-marketing, free account).

---

## GTM Plan: Revenue by Next Week

### Day 1-2 (Monday-Tuesday) — Fix the funnel

- [ ] Verify Stripe price IDs are loaded in Supabase `subscription_plans` table so the checkout button works for new signups
- [ ] Confirm the marketing pricing page at `meetcursive.com/pricing` now shows real prices (pricing-cards.tsx fix deployed)
- [ ] Record a Loom demo (5-7 min): targeting setup → leads arriving → AI SDR handling a reply → meeting booked. This is your primary sales asset.

### Day 3-4 (Wednesday-Thursday) — Launch cold outreach

**Campaign 1: Home Services Agencies (ICP 1)**
- Pull list from Cursive: "digital marketing agency" + "HVAC" or "roofing" or "plumbing" in company description, 1-20 employees, USA
- Target title: agency owner, founder, CEO
- Email 1: Short pain-focused (3 sentences + one question)
- Send 50-100/day from EmailBison
- Goal: 5-10 demos booked by Friday

**Campaign 2: B2B SaaS Growth (ICP 2)**
- Pull list: "head of growth" or "VP sales" at 10-100 person SaaS companies
- Email 1: Cost math angle ("SDR = $80k. Cursive = $149/month.")
- Send 50/day

### Day 5-7 (Friday-Weekend) — Community plays

- Post in 3 Skool communities: share the Loom demo + a genuine insight about AI SDR. Don't pitch. Let people ask.
- Post in r/entrepreneur and r/SaaS: "We built a ZoomInfo alternative for $149/month. AMA."
- DM 5 Dream 100 targets with a direct affiliate/partner pitch (not a sales pitch)

---

## Hiring Plan

| Stage | Hire | Why |
|---|---|---|
| Now (pre-revenue) | Nobody | Use Cursive + EmailBison yourself. Founders selling directly = fastest path to first 10 customers. |
| $5k MRR | 1 commission-only AE (15-20% of year 1) | Handle follow-up and close. You focus on demos + product. |
| $15k MRR | 1 full-time AE + 1 content/SEO freelancer | Scale outbound + own organic (Apollo/ZoomInfo alternative articles ready to rank) |
| $30k MRR | Head of Growth | Owns paid ads, partnerships, Dream 100 outreach |

**Rule:** Never hire before you have a repeatable, manual sales motion.

---

## The One Number to Watch

**Week 1 goal:** Get 3 paid Pro subscribers at $149/month = **$447 MRR**.

That proves the funnel works end-to-end. Then pour fuel on it.
