# Free leads: decisions (2026-10-01, made on Adam's go-ahead; flag any to reverse)

Model: freemium. Data is the cheap hook; done-for-you outbound and the pipeline dashboard are the money.

## Ladder
| Rung | Offer | Price | How they buy |
|---|---|---|---|
| 0 | 25 free leads, one list per company domain | $0, no card | /start |
| 1 | 25 new leads every Monday, same profile, no repeats | 14 days free, then $197/mo (existing `audience_197` Stripe price + `FUNNEL_TRIAL_DAYS`) | self-serve Stripe checkout from inside the workspace |
| 2 | We run outreach (email + LinkedIn), weekly leads included | call-led, no price on the card (existing service tiers $1,000 / $2,500 / $5,000) | booking link + Slack alert |
| 3 | Pipeline dashboard | call-led, custom | booking link + Slack alert |

Why $197 and not a new $97: the price, product and webhook path already exist in prod, so rung 1 ships with zero new
Stripe objects. Cost to serve is ~$0.36 per 25 leads, so the 14-day trial costs us under $1.
**Open for Adam:** a $97 "25 a week" price would need a new live Stripe price (financial action, not done).

## Rules
- The free 25 stay in the workspace for good. **Dropped the day-14 read-only rule**: freemium means the workspace
  stays useful, and the dashboard is where every upsell lives. Follow-up touch 5 rewritten (no deadline).
- Every free claimer lands in a branded workspace (their site icon, their brand name, their ICP). /dashboard shows
  the free-leads home until the first paid order, then the funnel-buyer home.
- Never name the data provider. Say "checked work email", never "verified".
- MillionVerifier at delivery: **yes when a key exists** (~$0.12 per signup, 6.4% of "valid" emails bounced in the
  eval). No key is set in any env today; adding one is Adam's call (new paid account).

## Still Adam's (commercial, cannot be decided in code)
- GetLeads product-use terms (their FAQ forbids powering a product with the Unlimited plan). Draft ask:
  "We resell enriched contacts inside our SaaS (25 free per signup, then weekly lists). What per-credit price and
  terms apply for product use at ~50k credits/month, and is there a volume tier?"
