# Free-leads ICP-fit eval (2026-09-30)

Rerun: `./node_modules/.bin/tsx --env-file=.env.local scripts/free-leads-eval/run.ts --tag <tag> [--compare baseline]`.
Cheap-judge check: `scripts/free-leads-eval/judge-agreement.ts --tag <tag> --models claude-sonnet-5-5`.
Raw pulls, scans and judgements live in `.cache/` (gitignored: contains names and emails); per-tag results in `results/`.

Method: 25 real sites (4 agencies, 5 B2B SaaS, 6 local: 2 dentists, 2 HVAC, 2 law; 4 e-commerce, 3 consultants, 3 staffing).
Real scan code path (site fetch + Claude scan) -> ICP -> filters -> pull 10 leads (1 credit each).
Judge: claude-opus-5-5 (effort medium) with the seller's site text scores each lead 0-3 "likely buyer of this business".
MillionVerifier checks every email. "Shown" = the production fit check (Sonnet 5.5, ICP only) keeps the best 70%,
which is what delivery does when it pulls 35 and shows 25.

## Before (baseline: shipped scan prompt + filters)

| vertical | sites | leads | mean fit 0-3 | fit >= 2 | fit 0 | shown fit (best 70%) | shown fit >= 2 | MV ok / catch-all / invalid / other | credits | $ scan+credits |
|---|---|---|---|---|---|---|---|---|---|---|
| agency | 4 | 40 | 2.38 | 85% | 0% | 2.71 | 96% | 23 / 11 / 5 / 1 | 40 | $0.60 |
| saas | 5 | 50 | 2.18 | 80% | 4% | 2.40 | 89% | 27 / 16 / 4 / 3 | 50 | $0.76 |
| local | 6 | 60 | 1.40 | 37% | 15% | 1.64 | 45% | 33 / 24 / 3 / 0 | 60 | $0.85 |
| ecommerce | 4 | 40 | 1.77 | 58% | 5% | 2.00 | 64% | 28 / 10 / 0 / 2 | 40 | $0.61 |
| consultant | 3 | 30 | 2.33 | 83% | 0% | 2.52 | 90% | 19 / 7 / 2 / 2 | 30 | $0.45 |
| staffing | 3 | 20 | 2.25 | 95% | 0% | 2.36 | 100% | 12 / 6 / 0 / 2 | 20 | $0.29 |
| ALL | 25 | 240 | 1.98 | 68% | 5% | 2.21 | 76% | 142 / 74 / 14 / 10 | 240 | $3.55 |

## After (v2: cities for local sellers, specific industries, umbrella pruning, fit check), deltas vs baseline

| vertical | sites | leads | mean fit 0-3 | fit >= 2 | fit 0 | shown fit (best 70%) | shown fit >= 2 | MV ok / catch-all / invalid / other | credits | $ scan+credits |
|---|---|---|---|---|---|---|---|---|---|---|
| agency | 4 | 40 | 2.63 (+0.25) | 98% | 0% | 2.79 (+0.07) | 100% | 25 / 12 / 3 / 0 | 40 | $0.60 |
| saas | 5 | 50 | 2.40 (+0.22) | 88% | 0% | 2.69 (+0.29) | 100% | 27 / 17 / 5 / 1 | 50 | $0.76 |
| local | 6 | 60 | 2.10 (+0.70) | 70% | 0% | 2.33 (+0.69) | 81% | 39 / 18 / 3 / 0 | 60 | $0.87 |
| ecommerce | 4 | 40 | 1.98 (+0.20) | 73% | 3% | 2.18 (+0.18) | 82% | 19 / 17 / 2 / 2 | 40 | $0.61 |
| consultant | 3 | 30 | 2.33 (+0.00) | 87% | 0% | 2.62 (+0.10) | 100% | 17 / 10 / 2 / 1 | 30 | $0.45 |
| staffing | 3 | 30 | 2.30 (+0.05) | 93% | 0% | 2.38 (+0.02) | 95% | 21 / 6 / 1 / 2 | 30 | $0.43 |
| ALL | 25 | 250 | 2.28 (+0.30) | 83% | 0% | 2.49 (+0.28) | 92% | 148 / 80 / 16 / 6 | 250 | $3.73 |

Same 24 sites (vaco.com could not be fetched in baseline): mean fit 1.98 -> 2.26, fit >= 2 68% -> 83%;
shown (after fit check) 2.48, fit >= 2 92%. Local: 1.40 -> 2.10 raw, 37% -> 81% shown fit >= 2.

## What changed
- ICP `cities` (metro cities -> person city) for local sellers; the scan fills them. Austin/DFW/Chicago leads stopped coming from Houston, San Antonio, Florida.
- Scan prompt: most specific industries ("Dentists", not "Hospitals and Health Care"); [] for local sellers whose buyers are any organization nearby; consumer brands target the most direct business buyer.
- `narrowIndustries`: an umbrella tag is dropped when one of its own children is chosen (deterministic, tested). Curve Dental: 13,259 matches incl. hospice/pharmacy -> 224 dental practices, fit 1.60 -> 2.60.
- Fit check (`src/lib/free-leads/lead-fit.ts`): Sonnet 5.5 low scores each pulled lead against the ICP, drops 0s, keeps the best, and writes the "why this lead" line.
- Site fetch: http redirects are upgraded to https instead of failing (vaco.com was "unreachable").

## Cheap judge choice (agreement with the Opus judge, baseline 240 leads)
| model | fit>=2 agreement | dropped (Opus-good among them) | best-70% Opus fit | cost per 240 leads |
|---|---|---|---|---|
| claude-haiku-4-5 | 79% | 27 (6) | n/a | $0.06 |
| claude-sonnet-5-5 low | 84% | 14 (0) | 2.24 | $0.17 |
| claude-opus-5-5 low | 88% | 11 (0) | n/a | $0.35 |
Sonnet 5.5 low chosen: no good lead wrongly dropped, ~$0.02 per 35-lead delivery. On v2 filters: 89% agreement, best-70% 2.49 / 93%.

## Still weak
- Consumer local businesses (family dentists): business buyers are a stretch (fit 1.0-1.9). Needs an honest UI line, not better filters.
- Email validity: 16/250 (6.4%) of "VALID" emails are invalid per MillionVerifier; 80/250 catch-all. Delivery labels every lead verified. Fix = verify at delivery (MillionVerifier, ~$0.004/email) and drop invalids.
- Counts are slow with city/title filters: median 14.7s, 8/25 timed out at 20s.

Credits: baseline 240, v2 250 (GetLeads $97 / 10,000 credits = $0.0097 each).
