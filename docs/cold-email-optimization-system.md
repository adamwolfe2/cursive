# Continuous Cold Email Optimization: How Cursive Uses AI-Driven Research to Compound Campaign Performance

## The Problem

Cold email is a numbers game — but most teams treat it like guesswork. They write copy once, blast it out, and hope for replies. When results stall, they rewrite everything from scratch. There's no systematic way to learn what works, retain that knowledge, and compound improvements over time.

## Our Approach: AutoResearch

We built **AutoResearch** — a continuous optimization engine that combines three things most teams keep siloed:

1. **A battle-tested cold email knowledge base** encoding proven copywriting frameworks and psychological principles
2. **Real campaign performance data from EmailBison** with sentiment-aware reply classification
3. **AI-powered variant generation** that proposes targeted experiments informed by what's already winning

The result is a system that runs statistically valid experiments on live campaigns, identifies winners with confidence, remembers what works, and feeds those learnings into the next round — automatically.

---

## How It Works

### 1. Cold Email Knowledge Base — The Foundation

Every experiment starts from a curated knowledge base of high-performing cold email principles, not generic AI copywriting. This includes:

- **7 psychological frameworks** (reciprocity, micro-commitments, social proof, authority, rapport, scarcity, shared identity) — each with specific, proven application patterns
- **A 4-step copywriting structure**: Personalization hook, credibility + in-group signal, irresistible proposition, and a friction-free CTA
- **6 offer archetypes** (revenue guarantee, free work first, free asset, audit, performance system, rewrite/improvement) with guidance on when each fits
- **Subject line patterns** organized by mechanism (loss-framing, curiosity, social proof, pattern interrupt)
- **Explicit AI boundaries**: AI handles variable insertion, data enrichment, and reply classification — it never writes the offer or CTA, which are the human-strategy components that make or break a campaign

### 2. Lead Enrichment — Personalization That's Actually Personal

Before any email sends, each lead goes through an AI enrichment pipeline:

- **Company research**: summary, recent news, key challenges
- **Personalization hooks**: specific, relevant angles unique to that prospect
- **Value prop matching**: the right message for the right person based on seniority, industry, and pain points

This enrichment data feeds directly into email composition, replacing generic `{{company}}` tokens with genuinely researched context.

### 3. The Experiment Loop — Systematic, Not Random

AutoResearch doesn't test randomly. It follows a deliberate **element rotation strategy**, testing one variable at a time in order of impact:

> Subject line --> Opening line --> Body copy --> CTA --> Angle --> Full template --> Send time

For each experiment cycle:

| Step | What Happens |
|---|---|
| **Generate** | AI proposes 2-3 challenger variants for the current element, informed by the knowledge base and all prior winning patterns |
| **Deploy** | Variants run as a weighted A/B test inside the live EmailBison campaign |
| **Collect** | Replies sync every 30 minutes with sentiment classification (positive, neutral, negative, unsubscribe, OOO) |
| **Evaluate** | After 72 hours, a Z-test determines if any challenger beats the control with statistical significance (95% confidence) |
| **Learn** | Winners update the baseline and get saved to the **Winning Patterns Memory** for future experiments |
| **Repeat** | The next element in the rotation gets tested, using the improved baseline |

### 4. Sentiment-Aware Metrics — Beyond Open Rates

Most platforms optimize for opens and clicks. We optimize for what actually matters: **positive reply rate**.

Our two-tier reply classification system:

- **Tier 1 (instant, zero cost):** Keyword matching catches clear signals — "let's talk," "not interested," "out of office"
- **Tier 2 (ambiguous cases):** Claude Haiku classifies nuanced replies with reasoning

This means every metric in the system reflects real buyer intent, not vanity engagement.

### 5. Winning Patterns Memory — Compounding Knowledge Across Campaigns

Every winning variant gets stored in a **memory silo** with full context:

- What element won (subject, CTA, etc.)
- The niche and persona it won for
- Lift percentage and confidence level
- Replication count (how many times this pattern has won across experiments)
- Tags for cross-campaign querying

When generating the next experiment, the system loads all relevant winning patterns and uses them as context. Patterns that replicate across clients and niches get weighted more heavily. **Knowledge compounds — every campaign makes the next one smarter.**

---

## The Feedback Loop in Practice

```
Campaign Live in EmailBison
        |
        v
  Leads Enriched with AI Research
        |
        v
  Personalized Emails Sent
        |
        v
  Replies Classified by Sentiment (every 30 min)
        |
        v
  Experiment Evaluated (Z-test, 95% confidence)
        |
       / \
      /   \
Winner Found          No Winner
     |                    |
Update Baseline      Extend Test / Move On
Save to Memory
     |
     v
Next Experiment (informed by all prior wins)
     |
     v
  Improved Campaign Performance
     |
     (cycle continues)
```

---

## What Makes This Different

| Traditional A/B Testing | Cursive AutoResearch |
|---|---|
| Manual hypothesis creation | AI-generated hypotheses from proven frameworks |
| Test whatever feels right | Systematic element rotation by impact |
| Optimize for opens/clicks | Optimize for positive reply rate with sentiment classification |
| Learnings live in someone's head | Winning patterns stored, tagged, and reused across campaigns |
| Start from scratch each campaign | New campaigns inherit cross-client winning patterns |
| Requires constant human oversight | Runs autonomously with configurable guardrails |

---

## Configuration

Each client program is fully configurable:

- **Target niche and persona** — experiments generate copy relevant to their market
- **Test duration** — default 72 hours, adjustable per program
- **Minimum sample size** — ensures statistical validity (default: 100 sends per variant)
- **Element rotation** — choose which elements to test and in what order
- **Quality constraints** — word count limits, subject length caps, personalization requirements
- **Auto-apply winners** — optionally push winning copy live without manual approval

---

## Tech Stack

- **Orchestration**: Inngest (durable workflows with automatic retries)
- **AI**: Claude Sonnet 4 (variant generation), Claude Haiku (reply classification)
- **Campaign Execution**: EmailBison (sending, scheduling, lead management)
- **Database**: Supabase with RLS (programs, experiments, results, winning patterns)
- **Language**: TypeScript end-to-end

---

*Built by the Cursive team. Every experiment makes the next one better.*
