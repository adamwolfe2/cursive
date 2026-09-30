# Free-leads cost per signup (2026-09-30)

A "signup" = a claim whose 25 leads were delivered. Unit costs below are measured on the eval
(scripts/free-leads-eval, 24-25 real sites per run) unless marked "est.". From launch on, the real
number comes from funnel events: every step writes `meta.usd` (model spend) and `meta.credits`, and
/admin/free-leads shows total cost / delivered sessions.

## Unit costs
| item | before (branch start) | after | how |
|---|---|---|---|
| Scan (per site) | $0.053 median, Opus 5.5 low, ~10.8k input tokens, no cache | $0.0123-0.0128 median (warm cache), ~$0.025 cold (est.) | Sonnet 5.5 low (eval parity), 6.5k-token schema cached (0.05x reads) |
| Repeat scan, same domain | full cost | $0 | 7-day shared cache, events replayed |
| Chip edit | $0 (already deterministic, /count only) | $0 | unchanged |
| Free-text refine | ~$0.033 (est., Opus uncached) | ~$0.005 (est., Sonnet, cached) | model switch + cache |
| Count | free, 5-20s, per request | free, shared 24h cache | DB cache by filter hash |
| Preview | 5 credits ($0.049), per-instance cache | 5 credits + fit check ~$0.003, shared cache, rows reused by delivery | DB cache; delivery buys only rows after them |
| Delivery | 25 credits ($0.243), no fit check | 30 credits after a preview (35 without) + fit check ~$0.025 | over-pull 1.4x for quality, minus reused preview |
| Site crawler | used on 2/24 sites | 1-2/25 | direct fetch first (already), ~1 crawler credit when used |
| Vercel functions | < $0.001 (est.) | < $0.001 (est.) | mostly I/O wait (scan ~5s, delivery ~25s) |
| Lead credits | $97 / 10,000 = $0.0097 | same | |

## Per completed signup (assumed funnel: 4 scans, 1 refine, 1.5 paid previews per signup)
| | before | after |
|---|---|---|
| Model spend | $0.245 | $0.109 (-56%) |
| Lead credits | 32.5 ($0.315) | 37.5 ($0.364) (+15%, deliberate: over-pull for fit) |
| Total | $0.56 | $0.47 (-16%) |
| Leads delivered with fit >= 2 (eval) | 68% of 25 = 17 | 92% of 25 = 23 |
| Cost per good lead | $0.033 | $0.020 (-39%) |

At 10 scans per signup (colder traffic): before $0.88, after $0.58 (-34%).

## Levers not taken
- GetLeads Unlimited ($497/mo): their FAQ says "Using the unlimited plan to power your product is not allowed"; product use must be paid per credit and cleared with them first. Break-even would be ~51k credits/mo (~1,370 signups/mo) anyway.
- Over-pull 1.2x instead of 1.4x saves 5 credits ($0.05) per signup at some fit loss; revisit with real funnel data.
- 1-hour cache TTL: only pays at >= 3 scans/hour; 5-minute TTL costs +$0.007 on a cold scan and saves ~$0.02 on a warm one.
- MillionVerifier at delivery (~$0.004/email, ~$0.12/signup): 6.4% of "VALID" emails were invalid in the eval. Needs Adam's OK (new paid key in Cursive env).
