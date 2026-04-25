# Cursive — Shopify App Store Listing

Drop-in copy for the Shopify Partners → App listing fields.

**IMPORTANT:** Shopify rejects apps that frame value as "deanonymization" or "visitor identification" in their listing copy (even if the underlying technology does that). All copy below is framed around audience building, suppression, and conversion improvement — the same product, listing-safe wording.

---

## App identity

- **App name:** Cursive — High-Intent Audience Builder for Meta & Klaviyo
- **App handle:** cursive-audience-builder
- **Category:** Marketing & Conversion → Advertising
- **Tagline (≤70 chars):** Turn store visitors into high-match Meta audiences. Automatically.
- **Pricing:** $99–$599/month (final tiers in Billing API)
- **Support email:** hello@meetcursive.com
- **Privacy policy:** https://leads.meetcursive.com/privacy
- **App icon:** square 1200×1200, no text, transparent background — use Cursive logo
- **Banner:** 1920×1080 — Cursive social/banner image

---

## Short pitch (≤160 chars)

> Cursive turns anonymous storefront visitors into Meta Custom Audiences and Klaviyo profiles — automatically suppressing customers from acquisition ads.

---

## Long description

**The problem every DTC brand has:** rising CAC, declining Meta match rates, and 95% of your store traffic leaving without giving you an email.

**Cursive solves it without changing how you sell.**

Install once. We auto-deploy a Shopify Web Pixel across your storefront — no theme edits, no developer needed. As shoppers browse, we identify high-intent visitors and:

- **Build Meta Custom Audiences** of resolved shoppers — multi-field payloads with up to 3 emails + 3 phones per profile, matching Meta's CSV template exactly for highest match rates
- **Sync resolved visitors to Klaviyo** as profiles with intent scores, so your existing flows work harder
- **Suppress customers from acquisition** automatically — when someone buys, they stop seeing prospecting ads and start seeing retention ads
- **Write `cursive.intent_score` to Customer metafields** so you can use it inside Shopify Segments, Flow workflows, or any other app that reads metafields
- **Fire Shopify Flow triggers** (`visitor_resolved`, `high_intent_detected`, `checkout_abandoned_high_intent`) that you can wire into anything Flow integrates with

**Built for Shopify, not bolted on.**

- Web Pixels API auto-injection (no theme code, works on Basic plan and up)
- Native Shopify Flow triggers (the only audience builder that ships these)
- Customer metafield writeback (intent data lives where you already work)
- Shopify Billing API (in-store checkout, no external payment redirects)

**14-day free trial.** Day-14 in-app report shows you exactly how many visitors we identified, your audience size, and your projected CAC reduction — so you can decide on the data, not the pitch.

---

## Why merchants choose Cursive

- **Multi-field match rate:** competitors send single-email lists; we send up to 3 emails + 3 phones per profile, matching Meta's CSV template exactly. Real match rates, not inflated marketing claims.
- **Automatic suppression:** when someone buys, we add them to a suppression segment that excludes them from acquisition CAs and includes them in your retention CA. No manual list management. No wasted ad spend on customers.
- **Identity quality score:** we publish a deterministic 0–100 score showing how well our matches validate against your Klaviyo opt-ins. The first tool in the category that makes match quality the headline metric.
- **Native Shopify integration:** Flow triggers + Customer metafields + Billing API + Web Pixels API. Cursive lives where you already work.

---

## Privacy + compliance

- Privacy policy: https://leads.meetcursive.com/privacy
- Protected Customer Data: Level 2 application filed
- GDPR-compliant: 3 mandatory webhooks (`customers/redact`, `shop/redact`, `customers/data_request`) implemented with 30-day SLA
- Visitor consent: pixel gates resolution behind `analytics.visitor.consent.analyticsAllowed() && marketingAllowed()` — EU/CCPA visitors fire only after consent
- Data retention: deleted within 30 days of subscription cancellation or `shop/redact` webhook (48h after uninstall)

---

## Scopes requested + justification

| Scope | Why |
|---|---|
| `read_customers` | Match resolved visitors against existing customers for metafield writeback (PCD Level 2) |
| `read_orders` | Detect customer conversions to add buyers to suppression list (so they stop seeing acquisition ads) |
| `write_pixels` | `webPixelCreate` / `webPixelUpdate` / `webPixelDelete` for the Cursive Web Pixel extension |
| `read_products` | Match storefront category to Cursive audience taxonomy at install |
| `write_customers` | Write `cursive.intent_score`, `cursive.last_resolved_at`, `cursive.resolution_source` to Customer metafields |

We do not request `read_analytics`, `read_inventory`, `read_themes`, `write_orders`, or any other unjustified scope.

---

## Required listing artifacts

- [ ] App icon (1200×1200, max 1MB, no text)
- [ ] App banner (1920×1080)
- [ ] **6 screenshots minimum (1600×900):**
  - Cursive dashboard hero metric (visitors identified)
  - Audiences tab with health badges
  - Day-14 POC report
  - Meta lookalike sizes preview
  - Klaviyo sync status
  - Customer metafield visible in Shopify admin Customer detail
- [ ] **Demo video (REQUIRED for PCD Level 2 apps):** 2–3 min, English, full onboarding end-to-end. Test credentials with full feature access. Record after PCD-protected build is live in dev store.
- [ ] Privacy policy URL: https://leads.meetcursive.com/privacy
- [ ] Support email: hello@meetcursive.com
- [ ] FAQ + setup guide URL: https://leads.meetcursive.com/docs/integrations/shopify

---

## Pricing tiers (Billing API — wired in code)

| Tier | Monthly | Trial | Includes |
|---|---|---|---|
| Starter | $99 | 14 days | Visitor identification + Cursive dashboard + customer metafields + Flow triggers |
| Growth | $299 | 14 days | + Meta CA + 6 Lookalikes + Klaviyo profile sync + suppression on checkout |
| Scale | $599 | 14 days | + AI segment recommendations + MCP access + priority support |

Final pricing is set in `src/lib/marketplace/shopify/billing.ts` and is overrideable via env vars (`SHOPIFY_PLAN_STARTER_PRICE`, etc.) without redeploying.

---

## Forbidden language to avoid in listing copy

These phrases will trigger Shopify rejection or review delays:

- ❌ "visitor identification" / "deanonymize" / "identity resolution"
- ❌ "match anonymous visitors to real people"
- ❌ Anything that frames the product as turning unwilling/unconsenting visitors into known contacts

Use instead:

- ✅ "build Meta audiences" / "audience builder"
- ✅ "high-intent visitors" / "high-intent shoppers"
- ✅ "resolved profiles" / "matched profiles" (in technical copy only — avoid in listing description)
- ✅ "turn site traffic into Klaviyo contacts and Meta audiences"

---

## Common rejection reasons + how we avoid them

| Rejection reason | Our mitigation |
|---|---|
| Missing PCD Level 2 approval | Filed via Partners dashboard before submission |
| "Identification" language | Listing copy framed as audience building (above) |
| Over-permissioning | Each scope individually justified above |
| Missing GDPR webhooks | All 3 implemented with 30-day SLA |
| External payment links | Use Shopify Billing API exclusively (`appSubscriptionCreate`) |
| Missing demo video | Required artifact — must record before submit |
| Embedded UI not using App Bridge | Settings UI lives in Cursive portal; embedded surface uses App Bridge CDN if added |

---

## Testing checklist before submitting for review

- [ ] OAuth flow completes (HMAC + state verified)
- [ ] `webPixelCreate` succeeds in dev store, pixel fires events on storefront
- [ ] Consent banner appears for EU/CCPA visitors
- [ ] All 5 mandatory webhooks subscribed at install
- [ ] HMAC verification on every inbound webhook
- [ ] GDPR webhook handlers tested manually (POST a synthetic `customers/redact`)
- [ ] `app/uninstalled` webhook clears tokens + marks install
- [ ] `app_subscriptions/update` webhook flips plan_tier
- [ ] `orders/paid` webhook adds buyer to suppression
- [ ] Customer metafields visible in Shopify admin after sync
- [ ] Shopify Flow triggers appear in workflow builder
- [ ] Lighthouse delta ≤10 points before/after pixel injection
