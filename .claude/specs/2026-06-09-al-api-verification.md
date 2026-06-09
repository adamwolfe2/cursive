# AudienceLab API — Live Verification Report

**Date:** 2026-06-09 (overnight, pre-demo)
**Method:** Probed the live AL API with the production key against every endpoint
the fulfillment pipeline depends on. Read/preview only (no audiences created).

## Endpoint status (live)

| Endpoint | Method | Result | Notes |
|---|---|---|---|
| `/audiences` (list) | GET | ✅ 200 | **Returns `Data` (capital D)**, + `total`, `total_pages`. 190 audiences on the account. |
| `/audiences/preview` | POST | ✅ 200 | Returns `{ job_id, count, field_coverage, result[] }`. Real enriched records (e.g. "Dentsu"). The pre-build validation works. |
| `/audiences/{id}` (records) | GET | ✅ 200 | Returns lowercase **`data`** + `total_records` — matches our `fetchAudienceRecords` code. Real enriched profiles. |
| `/pixels/{id}` (V3 events) | GET | ✅ 200 | `{ total_records, events[] }`. Correct shape. Our V3 fallback path is valid. |
| `/pixels/{id}/v4` | GET | 🔴 **500** | AudienceLab server error, still broken (every pixel, with/without params). Their bug. **Our V3 fallback (shipped) covers it.** |
| `/enrich` | POST | (powers verifyEmail) | Body `{ filter, is_or_match, fields? }`. Not re-tested destructively tonight. |

## Critical validations for the demo

### ✅ The automated audience pipeline can actually produce leads
`/audiences/preview` and `/audiences/{id}` both return real enriched records
with the lowercase `data` key our code reads. So provisionWorkspaceAudience →
fetchAudienceRecords → insert WILL yield leads tomorrow (API side is healthy).

### ✅ The verified-only quality gate is SAFE (does not empty the audience)
Measured on 25 real records from a live audience:
- **12 / 25 (48%)** carry an AL-verified email (BUSINESS or PERSONAL).
- 20 / 25 have *some* email; only 12 have a *verified* one.
- **Implication:** the P0-2 verified-only gate delivers ~half the raw audience.
  To hand a client N verified leads, build ~2N raw. Current pull cap (200) →
  ~96 verified leads = a full dashboard. Quality-first, exactly the mandate.

### 🔴 V4 pixel endpoint is down (AL-side) — fallback confirmed essential
`/pixels/{id}/v4` returns 500 for all pixels. The V3 fallback (`/pixels/{id}`,
same envelope) is live-verified 200 and is the path visitors will actually flow
through until AL fixes V4. Report to AL but not blocking.

## Bugs found

1. **List-endpoint casing (latent, NOT demo-critical) — FIXED:** AL is
   inconsistent *between* list endpoints (verified live): `GET /audiences`
   returns rows under `Data` (capital), `GET /pixels` returns `data` (lowercase).
   So `listAudiences` was silently returning `[]` (read `.data`, got `Data`).
   Only used by admin/diagnostic routes, not the funnel buyer path. Fixed with a
   `paginatedRows()` helper that reads `data ?? Data`. (Records endpoint
   `/audiences/{id}` uses lowercase `data` — funnel path was always fine.)

2. **Preview "400" was a false alarm** — a curl-quoting artifact on my end
   (malformed JSON), not AL rejecting `score`/`include_dnc`. Clean bodies return
   200. No code change needed.

## Recommendations
- Keep V3 fallback as the primary visitor pull until AL fixes V4.
- Size demo audience builds at ~2x desired verified count (48% verified yield).
- Fix the list-endpoint `Data` casing defensively (this session).

---

## Iter 6 — mapper contract validated against REAL audience records (15 records)

GREEN: the fields our inserter/mappers read are well-populated on real data, so
delivered leads carry real identity + company data (not nulls).

| Field | filled / 15 |
|---|---|
| FIRST_NAME / LAST_NAME | 15 / 15 |
| JOB_TITLE | 13 | SENIORITY_LEVEL | 13 | DEPARTMENT | 7 |
| COMPANY_NAME | 14 | COMPANY_DOMAIN | 14 | COMPANY_INDUSTRY | 13 | COMPANY_EMPLOYEE_COUNT | 14 |
| COMPANY_STATE | 9 | PERSONAL_STATE | 0 | PERSONAL_CITY | 6 |
| BUSINESS_VERIFIED_EMAILS | 4 | PERSONAL_VERIFIED_EMAILS | 2 (→ ~40% verified yield) |

Non-critical gaps (no code fix needed):
- `PERSONAL_STATE` empty on audience records → matchesWorkspaceICP correctly
  falls back to `COMPANY_STATE`. State ICP filtering works off company state.
- `ALL_MOBILES` / `ALL_LANDLINES` / `INDIVIDUAL_LINKEDIN_URL` are V4-PIXEL
  resolution fields, ABSENT on audience records. Audience phones come from
  MOBILE_PHONE / DIRECT_NUMBER / PERSONAL_PHONE (sparse, 2/15). Not part of the
  verified-email guarantee, so no impact on lead quality.
- AL also returns COMPANY_CITY/ZIP/PHONE/ADDRESS/LINKEDIN_URL, SHA256_*,
  VALID_PHONES — available if we want richer enrichment later.

Verdict: the automated audience pipeline will deliver quality, fully-populated,
verified leads. Contract confirmed; no mapper changes required.

---

## Iter 7 — /enrich (email-verify) path validated live + v4 re-check

- ✅ **POST /enrich works**: `{filter:{email}, is_or_match:false}` → 200,
  `{request_id, timestamp, found, result[]}`. Accepts the `email` filter.
  The email-verification dependency is live.
- ⚠️ **verifyEmail() under-reports (NOT funnel-critical):** for an email taken
  directly from an audience record's BUSINESS_VERIFIED_EMAILS, re-enriching by
  that email returns a profile whose verified-email fields do NOT echo the
  queried address → verifyEmail() returns `catch_all` instead of `valid`.
  Likely the enrich-by-email lookup returns a profile keyed differently than
  the by-audience record. IMPACT: none on the funnel quality gate — the gate
  uses `hasVerifiedEmail(record)` on the ORIGINAL audience/pixel record (the
  field AL already marked verified), and never re-enriches. The quirk only
  affects the separate marketplace email-verification.service path. Flagged for
  a later careful look; no funnel fix needed.
- 🔴 **/pixels/{id}/v4 still 500** (re-checked). V3 fallback stays essential.

Takeaway: the funnel verified-email guarantee is sound because it's
deterministic on the source record, not dependent on the flaky re-enrich call.

---

## Iter 8 — LATENT BUG found: preview `count` is the sample size, not the match total

Live-verified: POST /audiences/preview returns `count == limit` every time
(limit 1→1, 5→5, 50→50). The `result[]` is also a SLIM record (first_name,
last_name, personal_email, personal_phone, sha256) — NOT the full enriched
schema. The full enriched profile (COMPANY_*, verified emails) comes ONLY from
GET /audiences/{id}. (Aside: preview result keys are lowercase `company_*`;
audience-records keys are UPPERCASE `COMPANY_*`. Our code never inserts from
preview, so no impact.)

**Consequence — dead "overly-broad filter" guards** (`preview.count >=
UNFILTERED_PREVIEW_THRESHOLD = 50_000`):
- `provisionWorkspaceAudience` previews with limit 50 → guard never fires.
  **BUT** it has a SECOND, WORKING guard: `classifyPollResult(total_records,
  UNFILTERED_RECORDS_THRESHOLD)` on the real `total_records` from
  /audiences/{id}, plus per-record matchesWorkspaceICP + hasVerifiedEmail.
  → **Funnel lead quality is fully protected.** Dead preview guard is redundant.
- `al-audience-refresh` previews with limit 5 → guard never fires (weekly path).
- `al-prospecting.service` (OUTBOUND) previews with limit 25 →
  `OverlyBroadFilterError` never throws. Real bug, outbound-only, not funnel.

**Fix (for Adam, awake):** preview cannot report a true total. Either (a) gate
on `total_records` from a tiny created-audience/records call, or (b) drop the
preview-count guards and rely on the records-based guard everywhere, or (c) ask
AL for a count endpoint. Touches the outbound service + its tests — not an
overnight change. NOT demo-blocking (funnel is protected by the records guard).

---

## Iter 9 — visitor path validated against REAL pixel events (demo-critical, GREEN)

Found live pixels with real events (f6909338: 291, 1271d50c: 258, 0b708923: 7).
Pulled 25 real V3 events and validated the visitor→lead path against real data
(previously only the audience path was validated against real records):

- **Event shape matches our mapper:** each event has
  `{ pixel_id, hem_sha256, event_timestamp, referrer_url, full_url, edid,
  resolution }`. The `resolution` object is the full enriched profile
  (FIRST_NAME, PERSONAL_VERIFIED_EMAILS, COMPANY_NAME/STATE/DOMAIN, …) — exactly
  what `v4ResolutionToProfile` + `hasVerifiedEmail` read. Both V3 and V4 events
  nest the profile under `resolution`, so the gate works on both.
- **Verified-email coverage on real visitor events: 18/25 (72%)** — higher than
  the audience's 48%. ANY-email: 25/25 (100%).
- **=> the P0-2(a) visitor verified-gate surfaces ~72% of identified visitors as
  deliverable leads. The "Live Visitor Leads" feed stays well-populated, NOT
  empty.** This de-risks the demo's centerpiece.

Verdict: visitor pipeline validated end-to-end against real event data. Shape +
verified yield both healthy.

---

## Iter 10 — verified-only guarantee is AIRTIGHT across ALL lead-creation paths

Traced every path that writes a row to the `leads` table and confirmed each
hard-gates on a verified email:

1. **Audience** (provisionWorkspaceAudience): `if (!hasVerifiedEmail(record)) skip`.
2. **Pull** (pixel-v4-sync V4/V3): `if (!hasVerifiedEmail(profile)) skip`.
3. **Real-time webhook** (superpixel route → stores audiencelab_events →
   `audiencelab-processor` Inngest job → `isLeadWorthy()`): `isLeadWorthy` HARD-
   requires it — `if (!params.hasVerifiedEmail) return false` (where
   hasVerifiedEmail = isVerifiedEmail(email_validation_status)). Different
   mechanism (validation-status string vs verified-email field presence), same
   outcome: no verified email → no lead.

**LiveLeadsFeed and the /leads page both read the `leads` table** (not raw
audiencelab_events). Since every writer to `leads` gates on verified, the table
contains ONLY verified leads.

**=> The "never give a client a bad/unverified lead" guarantee holds end-to-end
across all three ingestion paths AND the dashboard read path.** P0-2(b) visibility
gate is therefore UNNECESSARY (not merely redundant): there are no unverified
leads in the funnel workspace to hide. Closing P0-2(b) as not-needed.

Goal criterion B (every delivered lead is email-verified) is fully satisfied.

---

## Iter 11 — audience pagination correctness (read-only) + unfiltered-guard confirmation

- **Pagination works:** GET /audiences/{id}?page=1 vs page=2 (page_size 10)
  return DISTINCT records (0 overlap). So fetchAudienceRecords can pull up to
  MAX_INITIAL_LEADS across pages without duplication/short pulls. ✓
- **Incidental confirmation:** the test audience reported `total_records =
  500,000` — a genuinely UNFILTERED audience ("Other" industry, nationwide).
  This is exactly what the records-based guard `classifyPollResult(total_records,
  UNFILTERED_RECORDS_THRESHOLD)` exists to catch (abort before inserting a global
  slice). Reinforces iter-8: the dead PREVIEW-count guard doesn't matter for the
  funnel because the real total_records guard does the job (500k >> threshold →
  abort). Funnel protected.

---

## Iter 12 — CRITICAL: AL `/audiences` `filters` are IGNORED (audience auto-build does not target)

Created a real audience filtered for {business:{industry:["Legal Services"],
jobTitle:["Attorney","Lawyer","Partner"]}, location:{state:["CA"]}} and polled
its records. Result:
- `total_records = 500,000` (the SAME global count as an unfiltered build).
- Records from the Netherlands, Pakistan, Australia, France — NOT US/CA.
- **Match rates: legal-industry 0/20, attorney-title 1/20, CA 0/20.**
- `/audiences/preview` likewise returns an identical generic sample for ANY
  business filter (jobTitle camel/snake, industry) — filters not reflected.
(Test audience deleted.)

**Conclusion:** the `/audiences` (and `/audiences/preview`) `filters` payload is
not honored — AL returns a global, unfiltered pool regardless. So the automated
audience build does NOT produce a targeted list.

How targeting actually happens today: `provisionWorkspaceAudience` applies a
`matchesWorkspaceICP` POST-filter (industry + state substring) to the pulled
records. From a RANDOM GLOBAL 500k pool, pulling ~200 → very few industry+state
matches → low yield, and titles/company-size are never filtered at all.

**Implication (validates Adam's concern):** real audience targeting needs AL's
**Audience Builder / Studio** (the system already generates a builder prompt via
`buildAudienceBuilderPrompt`), not the raw `/audiences` filter API. Recommended
flow: ICP -> admin builds targeted audience in Studio (or we find a real
targeting API) -> paste audience ID in /admin/funnel-orders -> pull from THAT
audience (verified-gated + topped-up) -> sync to dashboard.

OPEN QUESTION for AL support: is the `/audiences` filter genuinely unsupported
(Studio required), or is our filter FORMAT wrong? If it is a format fix, the
auto-build could be re-automated. Worth a 5-min confirmation before committing
to the manual-Studio path long-term.

NOTE: the titles/company-size threading (buildWorkspaceAudienceFilters +
provision + refresh) is committed as forward-groundwork — correct + tested, but
INERT until AL honors audience filters or we move to a targeting API.

---

## Iter 13 — HOW AL targeting actually works: a SEGMENT CATALOG, not filters

Confirmed the mechanism behind iter-12 (filters ignored):
- AL builds audiences from a **pre-built segment catalog** (our copilot copy:
  "19,000+ options"), selected via the `segment` param on preview/create —
  NOT the freeform `filters` payload (which AL ignores, returning a global pool).
- We already MIRROR that catalog locally in `al_segment_catalog` (admin import
  route + /admin/audiencelab/segments). The Cursive **Audience Builder copilot**
  matches a buyer's ICP to segments from this catalog — that IS the real targeting.
- `GET /audiences/segments` returns `{status}` only (needs params/search); the
  local catalog is the practical source.

**So the correct quality pipeline (live now, Slice 2):**
ICP -> admin opens the copilot ("Build in Audience Builder") -> copilot matches
ICP to catalog segments -> builds a targeted audience -> admin pastes the
audience ID into /admin/funnel-orders "Sync to dashboard" -> we pull it
(verified-gated + enrich-topped-up) -> buyer's dashboard + weekly refresh.

**Full re-automation path (future, feasible):** run the copilot's ICP->segment
matching HEADLESSLY on ICP submit (auto-select catalog segments -> auto-build
with `segment` -> optional human-approve -> sync). The matching logic already
exists in the copilot; making it headless is the work. The freeform
buildWorkspaceAudienceFilters titles/size threading stays inert unless AL ever
honors filters.
