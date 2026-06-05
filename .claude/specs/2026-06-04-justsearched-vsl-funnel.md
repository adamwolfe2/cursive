# Slice — JustSearched VSL Funnel (Pixel + Audience Self-Serve)

**Date:** 2026-06-04
**Owner:** Adam
**Tier:** 1 (money + auth + state transitions + webhook)
**Skill:** safe-feature-slice

---

## Why

Cold-email replies to `JustSearched` campaigns need a frictionless purchase path. Instead of routing every interested prospect through a sales call, the reply auto-includes a hidden URL → VSL → checkout → automated pixel install + audience builder. The VSL does all the convincing; the funnel is pure execution.

## Outcome

Prospect clicks link in EmailBison reply → watches VSL → checks out for $97 / $197 / $247 → lands on a 2-step post-pay flow (install pixel, submit audience ICP) → receives confirmation email + link to a per-order status portal → audience is fulfilled (manual for now, automated later).

## Constraints (Tier-1 invariants)

- **Money:** Stripe is source of truth. No order created without a verified `checkout.session.completed` webhook. Webhook signature MUST be verified before any DB write. Webhook is idempotent via existing `webhook_events` table.
- **Auth:** Funnel is unauthenticated → pay-first. Post-pay surfaces are gated by a per-order opaque token (32+ bytes, indexed, expirable, revocable). Token never appears in logs.
- **State:** `funnel_orders.status` transitions are one-way: `pending → paid → awaiting_pixel|awaiting_audience → awaiting_audience|awaiting_delivery → delivered`. No backward transitions in code paths; admin override only via explicit action.
- **Ownership:** Orders are not multi-tenant (no workspace). Anonymous purchase, identified only by Stripe customer email + portal token. Pixel provisioned under `workspace_id = null` initially (matches existing demo-pixel pattern); claimed later if/when prospect signs up.
- **No mutation:** All state updates use `update().eq(id).select()` and return new objects.
- **No swallowed errors:** every `catch` either rethrows or logs to `safeError` + Sentry + Slack.
- **Secrets:** new env vars: `STRIPE_PRICE_FUNNEL_PIXEL_97`, `STRIPE_PRICE_FUNNEL_AUDIENCE_197`, `STRIPE_PRICE_FUNNEL_BUNDLE_247`, `FUNNEL_PORTAL_BASE_URL` (default `https://leads.meetcursive.com`), `FUNNEL_VSL_URL` (placeholder until Adam records).

## In scope

1. `funnel_orders` + `funnel_portal_tokens` migration (RLS off — admin-client only, matches `onboarding_clients` pattern)
2. `src/lib/stripe/funnel-products.ts` — three price configs
3. `src/app/(funnel)/get-leads/page.tsx` — VSL + 3-tier CTA (public, no auth)
4. `src/app/api/funnel/checkout/route.ts` — creates Stripe Checkout session
5. Webhook handler extension — new metadata type `funnel_order` → `handleFunnelOrderCompleted`
6. `src/app/funnel/[token]/page.tsx` — status portal (router based on order state)
7. `src/app/funnel/[token]/pixel/page.tsx` — pixel install step (URL → snippet)
8. `src/app/funnel/[token]/audience/page.tsx` — audience builder step (solution, ICP, titles)
9. `src/app/api/funnel/[token]/route.ts` — GET order state
10. `src/app/api/funnel/[token]/pixel/route.ts` — POST website URL → provision pixel (token-auth, calls `provisionCustomerPixel`)
11. `src/app/api/funnel/[token]/audience/route.ts` — POST ICP form → store + fire Inngest event
12. `src/lib/email/templates/funnel-confirmation.ts` — pixel embed + portal link
13. `src/lib/email/templates/funnel-audience-delivered.ts` — Google Sheet URL delivery
14. `src/app/admin/funnel-orders/page.tsx` — admin list of orders needing audience fulfillment
15. `src/app/api/admin/funnel-orders/[id]/deliver/route.ts` — admin marks order delivered (with sheet URL)

## Out of scope (later)

- Automated audience build (currently manual via admin page)
- Subscription mgmt portal for funnel buyers (Stripe customer portal works fine v0)
- Account creation / workspace claim (prospects can be guided to signup later via in-portal CTA)
- A/B tests on the funnel surface
- Multi-domain pixel per order

## Test plan

- Unit: funnel-products config; `funnel_orders` state transition guards; pixel URL validation
- Integration: webhook signature failure → 400 no DB write; webhook success → row + token + email; token expired/revoked → 403; token valid + order=pending → 409; pixel-only order skips audience step; audience-only order skips pixel step
- Manual: full path with Stripe test card on each of 3 prices; admin mark-delivered triggers email

## Security review checklist

- [ ] Stripe webhook signature verified (reuses existing path)
- [ ] Idempotency via existing `webhook_events` table
- [ ] Portal token: ≥32 bytes from `crypto.randomBytes`, opaque, indexed UNIQUE
- [ ] Portal token NEVER logged (use `tokenId` in logs, not `token`)
- [ ] No SSRF in pixel URL input (existing `provisionSchema` rejects localhost / IPs / no-dot)
- [ ] No XSS in snippet display (snippet from AL is trusted but escape on email render)
- [ ] No SQL injection — all writes via Supabase admin client with parameterized queries
- [ ] Rate limit on `/api/funnel/checkout` (5/IP/min) — abuse prevention pre-payment
- [ ] No PII leakage in URLs (token only; email/domain not in path)
- [ ] CSRF: portal POSTs require `token` in path, no cookie state to forge

## Reuse map

| Need | Existing piece |
|---|---|
| Pixel provisioning logic | `src/lib/audiencelab/api-client.ts` → `provisionCustomerPixel` |
| Pixel storage pattern | `src/app/api/pixel/provision-demo/route.ts` (workspace_id null) |
| Stripe checkout structure | `src/lib/stripe/service-checkout.ts` |
| Webhook signature + idempotency | `src/app/api/webhooks/stripe/route.ts` (no changes needed) |
| Checkout-session metadata routing | `src/app/api/webhooks/stripe/handlers/checkout-session.ts` (extend) |
| Email send infra | `src/lib/email/resend-client.ts` + `createEmailTemplate` |
| Step-card visual language | `src/app/portal/[token]/ClientPortal.tsx` → `StepShell` / `StepIcon` patterns (copy, don't import — coupling risk) |
| Audience ICP form fields | inspired by `src/inngest/functions/icp-audience-builder.ts` AUDIENCES shape (industries, seniority, employee count, location) |
| Admin onboarding page pattern | `src/app/admin/page.tsx` |

## Open questions (resolved before build)

- Funnel domain → `leads.meetcursive.com` (confirmed 2026-06-04)
- VSL URL → placeholder via env `FUNNEL_VSL_URL` until Adam records
- Stripe price IDs → must be created in Stripe dashboard before deploy; spec ships with placeholders + deploy checklist

## Deploy checklist

1. Create three Stripe Products + recurring monthly Prices in dashboard
2. Add price IDs to Vercel env (production + preview)
3. Set `FUNNEL_VSL_URL` env once Adam records the video (or stub with Loom)
4. Run migration on Supabase
5. Test end-to-end with Stripe test card on each tier
6. Push to EmailBison cold-email reply template: `https://leads.meetcursive.com/get-leads`

## Reflection seed

If this funnel converts >5% of replies → roll the pattern across Trackr/Wholesail/TBGC as a generic "marketing-to-self-serve" template.
