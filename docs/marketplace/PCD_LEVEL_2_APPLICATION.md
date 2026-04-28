# Shopify Protected Customer Data — Level 2 Application

**File this in Shopify Partners → Apps → Cursive → Protected Customer Data → Apply for Level 2.** 4–8 week approval clock.

---

## Application content (paste into Shopify Partners form)

### Why your app needs to access Protected Customer Data

Cursive identifies anonymous storefront visitors and resolves them to verified contact data so merchants can:

1. **Build Meta Custom Audiences and Lookalikes** that include far more of their actual visitor population than the typical 3% who provide an email at popup.
2. **Sync resolved visitors into Klaviyo lists** for email/SMS retargeting that doesn't depend on a popup conversion.
3. **Suppress existing customers from acquisition advertising** by writing intent scores to Customer metafields and excluding converters from prospecting audiences.

To do this, Cursive needs to read customer email addresses and order data (to detect conversions for suppression), and write customer metafields (to expose intent scores inside Shopify admin). All visitor identification happens via the Web Pixels API; no customer-facing data is collected outside that consented context.

### Specific data accessed

**Customer data (`read_customers`, `write_customers`):**
- Email address (for matching resolved visitors to existing customers)
- First name, last name (display only, never re-shared)
- Customer ID (used as metafield owner)

We **write** to customer records:
- `cursive.intent_score` (integer 0–100)
- `cursive.last_resolved_at` (ISO timestamp)
- `cursive.resolution_source` (string, e.g. "pixel_v4")

We do not modify any other Customer fields.

**Order data (`read_orders`):**
- Order ID, customer email, customer phone, total price
- Used solely to mark the buyer as a "customer" in Cursive's suppression list, so they stop receiving acquisition ad targeting.
- We do not store line items or product details for non-Cursive purposes.

**Visitor pixel data (Web Pixels API):**
- Page URLs visited, product IDs viewed, cart events, checkout events
- Cookie-based visitor ID (`_cursive_cid`) for session consistency
- All resolution calls are gated by `analytics.visitor.consent.analyticsAllowed()` and `marketingAllowed()` — EU/CCPA visitors fire only after consent.

### Data recipients

Customer data leaves Cursive only when:

1. **The merchant explicitly configures a destination sync** in the Cursive portal (Meta Custom Audience, Klaviyo list, GoHighLevel contacts). The merchant chooses which fields go to which destination.
2. **Standard infrastructure providers** receive data as part of operating the Service: Supabase (database, US-hosted), Vercel (web hosting, US-hosted), Inngest (background jobs, US-hosted), Stripe (payments only).

We do not sell personal information. We do not use customer data for cross-merchant analytics. Each merchant's data is workspace-isolated at the database row level.

### Data retention + deletion

- Customer data is retained while the merchant's Cursive subscription is active.
- 30 days after subscription cancellation OR 48 hours after Shopify uninstall (whichever comes first), all customer data for that shop is permanently deleted.
- Cursive responds to all 3 mandatory GDPR webhooks within 30 days:
  - `customers/redact` — deletes leads matching the customer's email/phone
  - `shop/redact` — deletes all data for the shop's workspace
  - `customers/data_request` — provides a data export to the merchant
- All deletion requests sent to `hello@meetcursive.com` are honored within 30 days regardless of source.

### Data security

- All data in transit: TLS 1.2+
- All data at rest: AES-256 encrypted (Supabase managed)
- Production database: row-level security policies, every query workspace-scoped
- API keys: hashed with SHA-256 before storage, prefix-only display
- Webhook authenticity: HMAC-SHA256 verified on every Shopify webhook (X-Shopify-Hmac-Sha256)
- Audit logging: every administrative action logged with actor, target, timestamp
- Vendor SOC 2: Supabase, Vercel, Stripe, Inngest all maintain SOC 2 Type II reports

### DPA (Data Processing Agreement)

A Cursive DPA is available at [https://leads.meetcursive.com/legal/dpa](https://leads.meetcursive.com/legal/dpa) and is signed automatically as part of the Cursive Terms of Service the merchant agrees to at install. Merchants under GDPR jurisdiction can request a counter-signed copy at hello@meetcursive.com.

### Consent + lawful basis

For visitors in consent-required jurisdictions (EU, UK, CA under CCPA/CPRA):
- Resolution calls in the Cursive Web Pixel extension are gated by `analytics.visitor.consent.analyticsAllowed() && analytics.visitor.consent.marketingAllowed()`.
- The pixel declares three privacy purposes (`analytics`, `marketing`, `sale_of_data`) in `shopify.extension.toml` so Shopify's native consent banner surfaces them automatically.
- Merchants can choose to gate further via their own consent management platform (CMP) without code changes.

For US visitors outside CCPA jurisdiction, we rely on the merchant's terms of service + the legitimate interest of business contact identification. Merchants are contractually required (via Cursive's Terms of Service) to maintain compliant privacy disclosures on their storefront.

### Contact

- Privacy questions: privacy@meetcursive.com (or hello@meetcursive.com)
- Security incidents: security@meetcursive.com (or hello@meetcursive.com)
- Data deletion requests: hello@meetcursive.com (30-day response)

---

## Required artifacts to attach in Partners form

- [ ] Privacy policy URL: `https://leads.meetcursive.com/privacy` ✅ shipped
- [ ] DPA template URL: TBD (write next; placeholder above)
- [ ] Demo video: TBD — record a 2-3min walkthrough of: install → consent banner appearing in dev store → visitor identification → metafield writeback → settings UI
- [ ] Listing privacy section: short version of section 4 + 6 above
- [ ] Justification per scope:
  - `read_customers`: PCD Level 2 — match resolved visitors against existing customers for metafield writeback
  - `read_orders`: detect customer conversions for suppression (so they stop receiving acquisition ads)
  - `write_pixels`: install/update/delete the Cursive Web Pixel
  - `read_products`: match storefront category to Cursive audience taxonomy at install
  - `write_customers`: write `cursive.intent_score` / `last_resolved_at` / `resolution_source` metafields

---

## Workaround during 4–8 week PCD review

Per Shopify policy, while PCD Level 2 is under review the app cannot list publicly. During this window:
1. Continue operating as a **Custom app (unlisted)** distributed via private install link
2. Build a closed beta with 5–10 friendly merchants
3. Collect signed case studies + screenshots for the public listing copy
4. Record demo video against real merchant data once available

When PCD approval lands, flip the app from Custom → Public, submit for App Store review (additional 2–4 weeks), and the listing goes live.
