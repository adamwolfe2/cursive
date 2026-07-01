# Slice: Reseller / White-Label Layer (Phase 1 build)

**Date:** 2026-07-01
**Branch:** `feat/reseller-white-label`
**Tier:** 1 (webhooks, data isolation, billing-adjacent) — `safe-feature-slice` discipline.

## Goal
Let a partner (reseller) self-serve: create pixels programmatically for THEIR end-customers,
route each resolved lead into the partner's own product, with per-customer data isolation,
usage metering, caps, and throttling. Zero manual work from us.

## Core design decision: end-customer = headless workspace
`audiencelab_pixels.workspace_id` is **NOT NULL**. Instead of building a parallel pipeline,
each reseller end-customer maps to a **headless, reseller-owned `workspaces` row** (no seat
users). This reuses, unchanged:
- `provisionCustomerPixel({ workspaceId })` → deterministic `?ws=` webhook routing
- inbound `/api/webhooks/audiencelab/superpixel` → `audiencelab_events` → `processEventInline`
  → `leads` (full normalization via `field-map`)
- the existing `lead/created` Inngest event (fired per new lead in `edge-processor.ts:587`)
- per-workspace metering primitives (`al-quota.service`)

**Net diff to existing hot paths: ZERO.** Reseller lead-forwarding is a NEW Inngest function
that subscribes to the already-fired `lead/created` event and no-ops for non-reseller
workspaces (one indexed lookup, async, off the ingestion path).

## Data model (additive migration `20260701000000_reseller_layer.sql`)
- `resellers` — parent org: status, reseller-level cap, default per-pixel cap + throttle,
  metering period (`period_start` + `leads_delivered_period/lifetime`), `billing_external_ref` (stub).
- `reseller_api_keys` — `key_hash` (sha256 of raw key, raw never stored), `key_prefix` (display),
  `scopes[]`, `revoked`, `last_used_at`.
- `reseller_pixels` — reseller → child workspace → pixel. Holds `external_customer_ref`
  (partner's own id, `UNIQUE(reseller_id, external_customer_ref)` for idempotent creates),
  delivery config (`destination_url`, `signing_secret`), per-pixel cap + throttle overrides,
  per-pixel meter counters.
- `reseller_lead_deliveries` — per-lead delivery audit (delivered | throttled | skipped_cap |
  failed | no_destination).
- `reseller_usage_daily` — per-pixel daily rollup for reporting/billing hooks.
- RPC `reseller_record_delivery(...)` — atomic period-reset + counter increment + daily upsert.

Isolation: every reseller query filtered by `reseller_id` in app logic via API-key auth.
New tables get RLS **enabled with no client policy** (deny-all; service-role bypasses) —
resellers are not Supabase auth users, so all access is admin-client + API-key gated.

## Auth
API-key. `Authorization: Bearer rk_live_<token>`. `requireReseller(request)` sha256-hashes the
token, looks up an unrevoked `reseller_api_keys` row, stamps `last_used_at`, returns the reseller.
Not our per-seat Supabase login. Key minting is platform-admin-gated (`requirePlatformAdmin`).

## Endpoints (`/api/reseller/v1/*`, Node runtime)
| Method · path | Purpose |
|---|---|
| `POST /pixels` | Create pixel for an end-customer (idempotent on `external_customer_ref`). Wraps `provisionCustomerPixel`, mints a headless workspace, stores delivery config. → `{pixel_id, install_url, embed_snippet, external_customer_ref}` |
| `GET /pixels` | List reseller's pixels + usage |
| `GET /pixels/:pixelId` | One pixel + usage |
| `POST /pixels/:pixelId/deactivate` | Deactivate (stops routing + delivery) |
| `PUT /pixels/:pixelId/delivery` | Set destination_url / signing_secret / cap / throttle |
| `GET /usage` | Reseller totals + per-pixel breakdown |
| `POST /api/reseller/admin/keys` | (platform-admin) create reseller + first key |

## Lead forwarding (outbound)
NEW `deliverResellerLead` Inngest fn (`retries: 5`) subscribes to `lead/created`:
1. Look up `reseller_pixels` by `workspace_id`; no row → no-op.
2. Load lead + reseller + pixel config.
3. `decideDelivery()` (pure, unit-tested): reseller-cap → pixel-cap → throttle.
4. If delivering: build payload (throttled = reduced subset), HMAC-sign
   (`X-Cursive-Signature: t=<unix>,v1=<hmac>`, same scheme as existing `workspace_webhooks`),
   POST to `destination_url`.
5. `reseller_record_delivery` RPC meters atomically; write `reseller_lead_deliveries` audit row.

## Metering + limits
- Reseller-level cap and per-pixel cap, per period (`month` default). Effective per-pixel cap =
  explicit pixel cap, else the reseller `default_lead_cap_per_period`. Cap reached → stop
  delivering (data still captured in `leads`).
- **Hard cap (atomic):** `reseller_consume_delivery` RPC locks the reseller + pixel rows
  (`FOR UPDATE`), checks caps, and increments counters in one transaction, so concurrent
  workers can never both pass a full cap. `decideDelivery` (pure, unit-tested) mirrors the SQL
  as a cheap pre-check; the RPC is authoritative.
- A delivery **attempt** consumes a slot; a subsequent failed POST is **not** refunded in v1
  (attempts count toward the cap — failures are rare and the partner controls their endpoint).
- Throttle mode → deliver reduced payload (name + company + email only; drop phone, title,
  location, demographics) as a pricing lever.

## Partner docs
Auto-generated from a single `docs.ts` spec constant (can't drift): rendered at `/reseller/docs`
and served as JSON at `GET /api/reseller/v1/openapi`. Endpoint reference + webhook payload schema
+ copy-paste quickstart + signature-verification snippet.

## Billing
Left as stubs: `resellers.billing_external_ref`, usage rollup table. No Stripe wiring in this slice.

## Out of scope (v1)
Partner self-serve key UI, Stripe billing, per-pixel dashboard, hard (txn-locked) caps.

## Tests
Pure logic unit tests: `decideDelivery` (caps/throttle/period reset), API-key hash/verify,
payload build (full vs throttled).
