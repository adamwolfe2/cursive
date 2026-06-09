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
