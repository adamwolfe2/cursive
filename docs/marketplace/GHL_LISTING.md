# Cursive — GoHighLevel Marketplace Listing

Drop-in copy for the GHL marketplace developer portal listing fields.

---

## App identity

- **App name:** Cursive — High-Intent Visitor Identification
- **Category:** Analytics / Data Enrichment
- **Tagline (≤70 chars):** Turn anonymous funnel visitors into named GHL contacts.
- **Company:** Cursive (https://meetcursive.com)
- **Support email:** hello@meetcursive.com
- **App icon:** `/cursive-logo.png` (1200×1200, square, transparent background)

---

## Short description (≤160 chars)

> Cursive identifies your funnel visitors and writes them into GoHighLevel as contacts with intent tags — so your follow-up workflows fire on real prospects, not crickets.

---

## Long description

**Most agencies build beautiful funnels. Most funnels see 95% of visitors leave without ever filling out a form.**

Cursive identifies those anonymous visitors — name, email, phone, company, intent score — and writes them straight into the matching GoHighLevel sub-account as contacts with intent tags. Your existing GHL workflows fire on the right tags. Your campaigns get more contacts. Your clients get more pipeline.

**What you get the moment you install:**

- A unique pixel provisioned for every sub-account (bulk install — works across all your locations at once)
- A guided wizard that walks each sub-account owner through pasting the snippet into their GHL funnel's Head tracking code (one paste, lasts forever)
- Six Custom Values automatically written to each location: `identity_pixel_id`, `identity_pixel_status`, install URL, version — visible in GHL Settings → Custom Values
- Identified visitors flowing into your Cursive dashboard within minutes
- Automatic 6-hour sync of resolved visitors → GHL contacts, tagged with `cursive-visitor`, `cursive-high-intent` (score ≥ 80), `cursive-intent` (score ≥ 50), and `cursive-b2b` (B2B profile present)

**Why it works:**

- 280M+ verified consumer profiles + 140M+ B2B profiles in our identity graph
- 305M records re-verified monthly via NCOA — zero data decay
- Multi-field hashed identifiers (up to 3 emails + 3 phones per visitor) for high match rates downstream
- Full deterministic identity quality scoring (no IP-based guessing)
- Built specifically for the agency model: bulk install across all your client sub-accounts, per-client visitor data isolation, per-location billing

**Common workflow:**

1. New visitor on the funnel → Cursive identifies them → contact created in GHL with `cursive-high-intent` tag
2. Your existing GHL automation triggers off the tag → SMS, email, pipeline assignment, or Slack alert to the rep
3. Rep follows up with someone who actually looked at the offer, not a cold list

**Pricing:**

- 14-day free trial — full feature access
- Tiered Stripe billing (external) — pricing on the Cursive portal at signup

**Support:**

Built-in setup help inside Cursive at any time. Email support at hello@meetcursive.com.

---

## Setup steps shown to the agency at install

1. Click Install in the GHL marketplace
2. Approve OAuth scopes (we request only what we use — see scope justification below)
3. Cursive auto-provisions a pixel for every sub-account
4. We write 6 Custom Values to each location for visibility
5. Each sub-account owner pastes the pixel snippet into their funnel's Head tracking code (we email them a one-click setup link)
6. Visitors start appearing in the Cursive dashboard within minutes
7. Optional: enable visitor → GHL contact sync to write resolved visitors into the GHL CRM with intent tags (default ON)

---

## Scopes requested + justification

| Scope | Why |
|---|---|
| `oauth.readonly` | Required to enumerate the agency's installed locations on bulk install |
| `oauth.write` | Required to mint per-location tokens for individual sub-accounts |
| `locations/customValues.readonly` | Read existing Custom Values before upserting Cursive's |
| `locations/customValues.write` | Write our 6 pixel-state values to each location |
| `contacts.readonly` | Look up existing contacts before upserting (avoids duplicates) |
| `contacts.write` | Upsert resolved visitors as contacts; apply intent tags |

We do not request opportunity, calendar, conversation, payment, or workflow scopes — none of those are needed for the integration.

---

## Webhook subscriptions

- `AppInstall` — fires when a new sub-account is added under an agency that already installed the app. We auto-provision a workspace + pixel for the new sub-account.
- `AppUninstall` — fires when an agency or sub-account uninstalls. We mark the install as uninstalled and start the 30-day data retention countdown.

All webhook signatures are Ed25519-verified using GHL's published public key.

---

## Distribution + install settings (developer portal)

- **App type:** Public (after sandbox testing as Private)
- **Target user:** Sub-account
- **Who can install:** Agency & Sub-account
- **Bulk install:** Enabled
- **Redirect URL:** `https://leads.meetcursive.com/api/integrations/ghl-app/callback`
- **Webhook URL:** `https://leads.meetcursive.com/api/webhooks/ghl-app`
- **Billing URL:** `https://leads.meetcursive.com/api/integrations/ghl-app/billing/start` (external Stripe billing)

---

## CustomJS module (optional but recommended)

- **Script URL:** `https://leads.meetcursive.com/api/integrations/ghl-app/widget.js`
- **Distribution:** Agency & Sub-account
- Renders a small floating "Cursive" card inside the GHL CRM dashboard showing 24h / 7d / 30d visitor counts + Open Cursive Portal button

---

## Testing checklist before submitting for marketplace approval

- [ ] OAuth flow completes end-to-end against sandbox
- [ ] Bulk install enumerates all sub-accounts and provisions each
- [ ] Custom Values are visible in GHL Settings → Custom Values for each location
- [ ] Pixel snippet pasted into a sandbox funnel triggers the embed wizard's "Live" badge within 60s
- [ ] AppUninstall webhook marks the install uninstalled correctly
- [ ] 6h cron syncs resolved visitors into GHL contacts with `cursive-*` tags
- [ ] CustomJS widget renders inside GHL dashboard without errors
- [ ] Token refresh works (test manually by waiting 24h or invalidating)
