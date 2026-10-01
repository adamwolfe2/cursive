# meetcursive.com cohesion audit (2026-10-01)

Branch `feat/free-leads-site` (from origin/main 0502f419). Scope: `marketing/**` only.
Goal: make the marketing site point at the new front door, leads.meetcursive.com/start
(paste a website, get 25 free leads with names, titles, work emails, and why each fits; no card, no call),
with the ladder after it: weekly leads (25 every Monday), done-for-you LinkedIn outreach, custom AI dashboard.

## Method
- Live crawl: 88 non-blog URLs from www.meetcursive.com/sitemap.xml (172 total, 84 blog skipped), headless Playwright.
  Per page: title, meta description, OG, h1s, every `<a>` (text, href, nav/footer/body zone), buttons, full text.
- Status check of all 155 unique hrefs (urllib GET, follow redirects).
- Copy scans over page text: "verified", em dashes, prices, vendor names, trial/audit language.
- Source mapping: `marketing/app/<route>/page.tsx` (+ `layout.tsx` for meta/FAQ schema); shared chrome in
  `marketing/components/{header,footer,dashboard-cta,human-home-page}.tsx`; CTA constants in `marketing/lib/cta.ts`.

## Inventory (live, before changes)

### CTAs (text -> href, count across 88 pages)
| CTA | href | count |
|---|---|---|
| Get Started | leads.meetcursive.com/get-leads (paid checkout, 14-day trial copy) | 338 + 31 machine-view |
| Book a Call / book a call / quick call | cal.com/cursiveteam/30min | 338 |
| Book a Demo | cal.com/cursiveteam/30min | 89 |
| Get the Pixel / Get the Bundle / Get an Audience | /get-leads | ~45 |
| See plans & get started, Get enriched leads, Get Results Like These, Install the Pixel | /get-leads | 9 |
| Book Your Free AI Audit / Book a Free AI Audit (homepage hero + FAQ) | cal.com/cursiveteam/30min | 2 |
| Get My Free Audit (blog) | /free-audit | 2 |

Zero links anywhere to /start. The free-leads offer appeared on no page.

### Broken or odd links
| Link | Status | Where |
|---|---|---|
| https://cal.com/meetcursive/intro (app `BOOKING_URL`, src/lib/free-leads/contract.ts:178) | **404** | app /start ladder + preview (not marketing) |
| /industries | 404 | breadcrumb + machine links on all 12 industry pages, ~25 blog machine views |
| /book | 404 | 10 blog machine views + /blog |
| twitter.com/meetcursive (and x.com/meetcursive) | 404 | homepage machine view, sameAs schema in 4 files |
| /blog/{02,11,16,38,48}-...-UPDATED, /blog/32-, /blog/29-, /blog/40-, /blog/41- | 404 (.md posts are not routed) | /audience-builder, /intent-audiences related-reading |
| /blog/sales-outreach, /blog/ai-in-sales, /blog/sales-engagement | 404 (no category index route) | /blog category cards |
| /direct-mail | 301 -> /pricing (retired offer) | footer Product column on every page |
| leads.meetcursive.com/ | redirects to /login | privacy page |
| linkedin.com/company/cursive | 999 (bot wall, unverified) | homepage machine view, schema |

### Meta titles/descriptions
- Home: "The Identity Layer for Outbound, Intent, and Enrichment" / "280M verified consumers..." (no offer, uses "verified").
- Pricing (page + layout disagree): "Pricing | Cursive" vs "Cursive Pricing: Visitor Pixel $97, Custom Audience $197".
- Contact: "Book a Demo or Get a Free Visitor ID Audit" with 40-60% stats.
- 12 industry pages, 7 what-is pages, 50+ integration pages: pixel-centric titles; consistent among themselves, none mention free leads.
- /intent-audiences title ends "| Cursive | Cursive" (duplicate suffix).

### Copy that contradicts the free-leads offer
- Pricing FAQ schema: "There is no free plan" (contradicts directly).
- Contact hero: "Most teams just pick a plan and start".
- Pricing FAQ: "most teams just pick a plan and get started the same day".
- /get-leads (app) and /deck, /enterprise-deck: "Free 14-day trial", "5.0/5 · 345 reviews".
- Shared bottom CTA on ~70 pages: "Resolve 40-60% of your visitors... Get Started", checks "Setup in 5 minutes".

### Inconsistent naming
- Offer/positioning: "Data Identity Layer", "AI-Powered Lead Generation Platform" (about, platform titles), "AI-powered lead generation and outbound automation" (footer), "We know who's searching for what" (footer).
- Booking: "Book a Call" / "Book a Demo" / "Schedule Demo" / "Book a 30-Minute Call" / "Book Your Free AI Audit" / "Free AI Audit" (all the same cal link).
- Pixel: "Super Pixel V4", "Visitor Pixel", "Pixel", "deterministic pixel".
- Weekly list: marketing "Custom Audience ($197/mo, weekly list to Sheets)" vs app ladder "25 new leads every Monday". Same thing or not? (needs Adam)

### Rule violations (counts on live pages)
- "verified" (emails/consumers/contacts): 187 hits on 37 pages.
- Em dashes: 567 on 32 pages (mostly what-is guides and integrations).
- Named data vendors: TransUnion/Experian on homepage (10 hits), audience-builder, superpixel, custom-audiences, data-partnerships, ABM guide; "Deep Verify" engine name.
- Prices $97/$197/$247 on 85 pages (shared machine-view + webmcp); fine if still sold.
- Homepage had three h1s (hero, sr-only machine view, "Welcome back, Adam!" inside the demo dashboard).

## What changed (commits on feat/free-leads-site)
1. `e44974e6` CTA constants (`lib/cta.ts`: `START_URL`, `startUrl(placement)`, `START_CTA_LABEL`, `DASHBOARD_EXAMPLES_URL`);
   header (desktop + mobile) and footer primary CTA -> /start; "25 Free Leads" first in Products menu and footer Product column;
   footer tagline is the offer line; dropped Direct Mail (retired) and duplicate Pricing; shared DashboardCTA default -> /start
   ("Get 25 free leads", checks: No card / No sales call / Your list in about a minute); removed 12 generic overrides.
2. `f15037f3` Homepage hero, meta, OG, FAQ, bottom CTA lead with the offer; stats row replaced by No card / No sales call /
   The 25 are yours to keep; TransUnion/Experian/Deep Verify and "verified" removed from homepage copy; demo h1 -> p.
3. `7c0464cf` Pricing: "Start free. Pay when you want more." hero with /start CTA; plans unchanged (still /get-leads);
   new "Done for you" rows (Weekly leads -> /start, LinkedIn outreach -> call, Custom AI dashboard -> call + examples link);
   fixed "no free plan" FAQ; final CTA -> /start; meta aligned.
4. `8e52c1b9` Generic "Get Started" buttons and machine-view links on 35 pages -> /start with per-page `utm_content`;
   contact hero rewritten; contact plan buttons get plan-specific labels.
5. `d1e55586` 404 fixes: /industries -> /#industries, /book -> booking link, related posts -> live posts, Twitter removed.

Attribution convention: `?utm_source=meetcursive&utm_medium=website&utm_content=<placement>`.
`ref` was NOT used: the app middleware (src/middleware.ts:30) stores any `ref` as the first-touch affiliate cookie
`cursive_ref` for 30 days, so `ref=site-nav` would block real partner credit.

Plan-specific buy buttons (Get the Pixel / Bundle / Audience) still go to /get-leads checkout.

## Needs Adam
1. **App booking link is dead**: `BOOKING_URL = 'https://cal.com/meetcursive/intro'` (src/lib/free-leads/contract.ts:178) returns 404.
   Marketing uses `https://cal.com/cursiveteam/30min` (works, "Discovery call"). The /start ladder buttons and Preview use the dead one. Fix in src/.
2. Are the $97 / $197 / $247 self-serve plans still sold? If the ladder replaces them, /pricing plans, ~85 pages of price mentions, and /get-leads need a decision.
3. Is "Custom Audience" ($197/mo weekly list) the same product as "Weekly leads" (25 every Monday)? If yes, rename one; if no, what does weekly leads cost?
4. Prices for LinkedIn outreach and custom AI dashboard (shown as "Book a call" for now).
5. Homepage hero demo still shows the pixel live-visitor dashboard. Replace with a 25-lead list preview (the /start example card) once the /start hero redesign settles.
6. Positioning claims to confirm or cut: 280M consumers, 15M-domain network, 40-60% match / 60-80% accuracy, 70% person-level match, "5.0/5 · 345 reviews" (/get-leads), 20M emails/day.
7. /deck and /enterprise-deck say "14-day free trial, no credit card". Retire or update.
8. /free-audit (visitor audit form, report in 24h): keep as a separate lead magnet, or redirect to /start?
9. "verified" (187), em dashes (567), and data-vendor names (TransUnion/Experian on audience-builder, superpixel, custom-audiences, data-partnerships, ABM guide) remain outside the homepage and pricing. Bulk rewrite is a content pass, not done here.
10. Blog category cards link to /blog/<category> with no route (404). Add a category index or unlink.
11. 50+ .md blog posts in marketing/app/blog are not routed (404). Delete or wire up.
12. Social: confirm the real LinkedIn company URL; Twitter/X handle @meetcursive does not exist (twitter:creator meta still set on several pages).
13. App middleware accepts any `ref` value unvalidated (marketing validates 8-char codes). Worth matching.
14. "AI SDR" and "Direct mail" guides still describe offers that are retired (direct mail 301s to pricing).

## Verification
- `npx tsc --noEmit -p marketing`: exit 0.
- `pnpm lint` (full): exit 1, 15 errors / 227 warnings, all in 7 files untouched by this branch (pre-existing); 0 errors in changed files.
- Link check of every changed CTA destination: all 200 (see report).
- Local crawl of 10 key pages on `next dev`: 100 unique hrefs, 22 /start links, 0 broken.
- Screenshots: /tmp/fl-site-shots/home-{before,after}-{1440,390}[-full].png, pricing-after-1440-full.png.
