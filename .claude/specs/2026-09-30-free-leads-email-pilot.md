# Free-leads outbound email pilot (100 prospects) — 2026-09-30

Copy and tooling only. NOTHING is sent and nothing is wired to a sender. Planned sender: EmailBison from secondary domains.
Script: `scripts/free-leads-pilot/run.ts` (+ `render.ts` copy/masking, `render.check.ts` self-check). Builds on
`2026-09-30-free-leads-flow.md`, `-cost.md`, `-followups.md`, `-conversion-research.md`.

## Goal
Cold email 100 B2B founders / sales leaders (Cursive's own ICP) a short note that shows Cursive already read their site:
their ICP in one sentence, the live match count, 3 masked buyers with a reason each, and a link to
`https://leads.meetcursive.com/start?site={domain}` that replays the pre-scan instantly and lets them claim 25 free leads.

## Success metrics (read after day 21)
| metric | how measured | pilot target | kill line |
|---|---|---|---|
| Reply rate (any human reply) | EmailBison | >= 5% | < 2% |
| Positive reply rate | EmailBison tags | >= 2% | 0 |
| /start?site= click-through | `free_lead_sessions` where `domain` in the pilot list (bare link, no UTM, see below) | >= 8% of delivered | < 3% |
| Claims (25 delivered) | `free_lead_claims` / `delivered` event joined on domain | >= 3 | 0 |
| Cost per claim | (pilot spend below + infra) / claims | < $15 | > $50 |
| Bounce rate | EmailBison | < 2% | > 3% (pause) |
| Spam complaints | Bison + Postmaster | 0 | any 2 |

No UTM on the link on purpose: `?site=acme.com&utm_source=...` reads like a campaign, and the replayed scan already
records `domain` on the session, so joining on the pilot's domain list measures clicks. Which step drove the click is
inferred from timing (sends are days apart).

## Audience and list
- Who: founders, CEOs, heads of sales / growth at B2B companies, 5-200 employees, US first. These are Cursive's buyers.
- Source (assumption, Adam to confirm): pulled from our own lead database or an existing EmailBison list, work emails only.
  Input CSV columns: `domain, first_name, last_name, email, company`.
- One prospect per company (the script skips the second contact at a domain).
- Never personal mailboxes (script skips via `isPersonalEmail` in `src/lib/free-leads/rules.ts`).
- Exclude: current customers, open deals, anyone who already claimed (`free_lead_claims.email_domain`), competitors
  of Cursive (they would get our ICP read as a gift). Manual pass on the review file before import.

## Sending plan (EmailBison)
- Volume: 100 prospects x 4 steps = up to 400 emails over ~17 days. Start 20 new prospects/day over 5 days; peak day
  (first touches overlapping follow-ups) is ~60 sends.
- Domains: 3 secondary domains (e.g. `trycursive.com`, `cursivehq.com`, `getcursive.co`), each 301-redirecting to
  meetcursive.com. Never send cold from meetcursive.com or leads.meetcursive.com.
- Mailboxes: 2 per domain = 6 (adam@ and one teammate per domain; all signed "Adam" only if Adam is the sender).
  Cap 15 cold sends / mailbox / day (90/day capacity, 1.5x headroom over the 60 peak).
- Warmup: 21 days on Bison warmup before the first send (14 minimum); keep warmup on during the pilot at ~20/day.
- DNS per domain: SPF (`v=spf1 include:<provider> ~all`), DKIM 2048-bit, DMARC `p=none; rua=mailto:...` for the pilot
  (move to `quarantine` after 30 clean days), MX valid, no catch-all. Verify in Google Postmaster Tools.
- Tracking: OFF. No open pixel (Apple MPP makes opens noise, and pixels hurt inbox placement), no click rewriting (a
  rewritten link through a shared tracking domain is the most common spam signal), plain text only, no images, no
  attachments, one link per email. Clicks come from our own funnel tables instead.
- Follow-ups reply in the same thread (blank subject on steps 2-4). Stop on any reply, bounce, or unsubscribe.
- Send window: Tue-Thu, 8-11am prospect local time. Daily cap per campaign 60.

## Per-prospect pipeline (`run.ts`)
1. Validate row (zod), skip personal / invalid emails, dedupe by domain, normalize the site exactly like the scan route
   (`normalizeSiteUrl` -> origin).
2. Scan: shared cache `scan:<SCAN_VERSION>:<domain>` first (the key the scan route replays for `/start?site=`), else
   local state, else a real `readSite` + `scanIcp` with every replayable event recorded and written to the shared cache
   (7-day TTL). Rerunning re-warms an expired shared entry from local state at $0.
3. Count (free): `cachedCount(icpToFilters(icp))`, same 24h shared cache as the site, so the email and the page agree.
   Skip if < 25.
4. Buyers (only `--spend`): the preview route's exact purchase. 5 rows (`PREVIEW_LEAD_COUNT`) written to
   `preview-rows:<filter hash>` (24h), fit lines via `scoreLeads` written to `preview-why:<hash>:<summary>`. Keep the
   3 best with fit score >= 2; skip the prospect if fewer than 3.
5. Mask (below), render 4 steps, write `.out/emailbison.csv` (one column per merge field + rendered subject/body per
   step + `flags`) and `.out/review.md` (ICP, filters, count, word count, flags, every email).

Modes: default dry run makes no lead-database calls at all (count and buyers stay placeholders); `--count` adds the
free count; `--spend --max-credits N` buys. `--address "..."` fills the CAN-SPAM postal address.

### Safety (safe-feature-slice, Tier 1: spends credits)
- Hard cap: synchronous credit reservation before each paid call, never released (a sent request may be billed);
  concurrency 3 cannot overshoot. Prints credits used and dollars at the end.
- Never double-buy: shared preview cache is checked first; a `pending` marker is written to
  `.out/state/<domain>.json` BEFORE the paid request; `pending` or `failed` is never retried automatically
  (delete `.buy` in that file after checking billing).
- PII: state and output live in `scripts/free-leads-pilot/.out/` (gitignored). Logs print domains, counts, and skip
  reasons only; never names or emails.
- Duplicated constants (route does not export them; keep in sync): `scanKey`, scan TTL, `Replayable` from
  `src/app/api/start/scan/route.ts`; preview TTL and `CachedRows` from `src/app/api/start/preview/route.ts`.
  Better: export `scanKey` from `src/lib/free-leads/cache.ts` next to `previewRowsKey` in a later slice.

## Cost per prospect
| item | per prospect | 100 prospects |
|---|---|---|
| Scan (model) | ~$0.0125 warm prompt cache, ~$0.025-0.033 cold (dry run measured $0.065 for 2 cold scans) | ~$1.50-2.50 (batched runs keep the cache warm) |
| Count | free | $0 |
| Buyers | 5 credits = $0.0485 (credits at $97 / 10,000) | 500 credits = $4.85 max (only prospects that pass scan + count) |
| Fit lines | ~$0.003 | ~$0.30 |
| Total | ~$0.065-0.085 | ~$6.70-7.70, plus infra |

Why 5 credits, not 3: 5 is the preview route's exact row count and cache key, so (a) we pick the best 3 of 5 by fit,
and (b) if the prospect clicks within 24h their preview shows the same people at 0 credits and their delivery buys only
the rows after them (30 instead of 35). After 24h the rows expire, so run `--spend` the day before each send batch.
A claim itself then costs the usual ~30-35 credits + fit check (cost spec), ~$0.36.

Infra (not in the script): 3 domains ~$36/yr; 6 mailboxes ~$7/mo each on Google Workspace (~$42/mo) or Bison's
mailboxes if cheaper; EmailBison plan (existing).

## Masking choice
Buyer line = `First L., Title at a {size} person {industry} company in {City, State}`, e.g.
"Dana R., VP Operations at a 51-200 person real estate company in Austin, Texas".
- Company described, never named: the prospect has not asked for anything yet, so we do not hand a stranger a named
  person-at-company pair; the named list is the reason to click; a wrong match reads as "close" rather than as an
  error about a real, nameable company; fewer proper nouns also helps spam filters.
- First name + last initial (not full name, not nothing): enough to feel like a real person, not enough to look up.
- Company name and domain are scrubbed from titles ("VP Ops, Acme" -> "VP Ops") and from the why line (the fit model
  sees the company name). Em dashes and "!" are stripped. Asserted in `render.check.ts`.

## Copy
Rules: plain text, no emojis, no em dashes, no exclamation marks, never name the data vendor, never say "verified",
no hype. Email 1 is 82-94 words excluding the buyer lines and footer (checked per prospect; flagged over 120).
Merge fields: `{first_name} {company} {domain} {icp_sentence} {match_count} {buyer_1..3} {buyer_1..3_why}
{buyer_1_short} {start_url_1..4} {sender_address}`. `{icp_sentence}` is the scan's `icp.summary`, which is already
"You sell X to Y." `{start_url_n}` = `https://leads.meetcursive.com/start?site={domain}`.

Footer on every step (CAN-SPAM: postal address + working opt-out):
```
--
Cursive, {sender_address}
If you would rather not hear from me, reply "no" and I will not email you again.
```

### Email 1 (day 0)
Subject A: `who buys from {company}`  ·  Subject B: `a list for {company}`
```
Hi {first_name},

I pointed a tool we built at {domain} to see who it thinks buys from you. Its read:

{icp_sentence}

We found {match_count} people who match. Three of them:

{buyer_1}
Why: {buyer_1_why}

{buyer_2}
Why: {buyer_2_why}

{buyer_3}
Why: {buyer_3_why}

If that read is close, the first 25 are free, with names and work emails. No card, no call:
{start_url_1}

If it is off, the same page lets you edit who we look for before you claim anything.

Adam
```

### Email 2 (day 3, same thread): new = the profile is editable, and they see 5 people before giving an email
```
Hi {first_name},

One thing I left out. The {match_count} is a starting point, not a fixed list. On the page you can type a change in plain words, like "only companies over 50 people" or "add heads of finance", and the count updates as you go. You also see five sample people, names partly hidden, before you give us an email.

If my read of {company} was wrong, that is the quickest way to tell me:
{start_url_2}

Adam
```

### Email 3 (day 7, same thread): new = the done-for-you LinkedIn outreach rung
```
Hi {first_name},

In my experience the list is the easy part. Writing a first message that does not read like a template, 25 times a week, is the slow part.

We do that part too: we write and send LinkedIn messages to people like {buyer_1_short} from my first note, and you only take the replies.

The free 25 are still the place to start, so you can judge the people before you judge the messages:
{start_url_3}

Adam
```

### Email 4 (day 12, same thread): new = referral ask + the link pulls fresh people at claim time
```
Hi {first_name},

Last note from me on this.

If outbound is not your job at {company}, who should I send this to? A name is plenty.

If it is just timing, the link keeps working and pulls fresh people when you claim:
{start_url_4}

Adam
```

Timing: day 0 / 3 / 7 / 12. Most replies to cold sequences come from the first two touches, so step 2 lands while
email 1 is still remembered; widening gaps (3, 4, 5 days) keep the sequence under two weeks without reading like
pressure, and fewer touches per week keeps complaint rates down on young domains. Day 12 closes before the 14-day
mark where an unanswered thread goes cold.

## Runbook
```
./node_modules/.bin/tsx scripts/free-leads-pilot/render.check.ts                                   # copy/masking self-check
./node_modules/.bin/tsx --env-file=.env.local scripts/free-leads-pilot/run.ts --in list.csv --count  # pre-scan + count, 0 credits
# review .out/review.md: ICP sentence right? count sane? drop bad rows from list.csv, rerun (scans are cached)
./node_modules/.bin/tsx --env-file=.env.local scripts/free-leads-pilot/run.ts --in list.csv --spend --max-credits 500 \
  --address "Cursive, <street>, <city>, <ST> <zip>"                                                  # day before sending
# import .out/emailbison.csv into EmailBison (columns = custom variables)
```
Every run writes the shared scan cache (7-day TTL) for each domain, so `/start?site=` replays the same ICP the email
quotes. Rerun within 7 days of each send batch (free; re-warms from local state). A `SCAN_VERSION` bump between run
and click makes the prospect's visit rescan and possibly show a different ICP than the email: freeze scan changes
during the pilot.

## Risks
- Wrong ICP read: quoting a wrong "You sell X to Y" to a founder is embarrassing for us, and wrong buyers make it worse.
  Mitigation: human read of every ICP sentence in review.md; buyers need fit >= 2; skip on count < 25.
- Masking leaks: a distinctive title + city + size can still identify someone at a small company. Mitigation: no
  company names, last initial only; drop any line that reads identifying in review.
- Compliance: CAN-SPAM needs a real postal address and an honored opt-out (within 10 business days); add replies of
  "no" to the Bison blocklist the same day. B2B work emails only, US first; no EU/UK prospects in the pilot (GDPR/PECR
  legitimate-interest analysis not done). Never send to personal mailboxes.
- Deliverability: young domains + a link in email 1. Mitigation: warmup, low caps, no tracking, plain text.
- Vendor terms: the free-leads flow's open item (product use of the lead database) also applies to buying preview rows
  for outbound.
- Bounce rate of the 25 they claim (6.4% invalid in the eval) is a product risk the pilot will surface.

## Go / no-go checklist
- [ ] 3 domains bought, redirected, SPF/DKIM/DMARC pass (mail-tester >= 9/10), 21 days warmup, Postmaster clean
- [ ] Open/click tracking OFF in the Bison campaign; plain text; follow-ups set to same thread
- [ ] Postal address set via `--address`; review.md has no "placeholders left" flags
- [ ] Unsubscribe handling: "no" replies -> blocklist; Bison unsubscribe list synced
- [ ] List scrubbed: no customers, open deals, prior claimers, competitors, personal emails, EU/UK
- [ ] Every ICP sentence and buyer line in review.md read by Adam
- [ ] `--spend` run the day before the batch (preview rows reused if clicked within 24h); credits printed <= cap
- [ ] /start?site= checked by hand for 3 pilot domains: replays instantly, same ICP, same count
- [ ] Free-leads flow live in prod with caps (`FREE_LEADS_DAILY_CLAIM_CAP`) sized for pilot traffic
- [ ] Vendor product-use OK in writing

## Open decisions (Adam)
1. Sender identity: Adam personally on all 6 mailboxes (research favors founder-to-founder) vs Adam + a teammate.
2. List source for the 100 and exclusions (customers, competitors).
3. Postal address to use in the footer.
4. Domains to buy (names) and mailbox provider (Google Workspace vs Bison-provided).
5. Subject A vs B: split 50/50 or pick one.
6. Link in email 1 (kept, per brief) vs a no-link "reply yes and I will send the 25" variant for deliverability.
7. Export `scanKey` from `src/lib/free-leads/cache.ts` so the script stops duplicating it.
