# Free-leads flow (GetLeads) — 2026-09-30

Branch `feat/free-leads-flow` · worktree `~/cursive-worktrees/free-leads` · contract `src/lib/free-leads/contract.ts`
Context: `.claude/specs/2026-09-30-getleads-replaces-audiencelab.md` in main checkout; bake-off `~/getleads-bakeoff/RESULTS.md`.

## Goal
Founder pastes their website -> Cursive infers their ICP -> live count -> refine -> 5 masked preview leads -> work email -> magic link -> free workspace with 25 real verified leads -> ladder: weekly leads (lead 26 paywall) -> LinkedIn outreach done for you -> AI dashboard partner.

## Journey (URLs)
- `/start` public. One input: website. Then scan (SSE), ICP card, count, refine, preview, email step. Single page, progressive, no route changes mid-flow.
- `/start/check-email` public. "Open the link we sent to x@acme.com."
- `/start/leads` authenticated (server-side session check, else redirect `/start`). Materializes claim, shows 25 leads, CSV, locked lead 26, ladder.
- Magic link: `/auth/confirm?token_hash=…&next=/start/leads` (existing route).

## Backend (owner: backend agent)
- `src/lib/getleads/client.ts` — REST `https://app.getleads.io`, `Authorization: Bearer ${GETLEADS_API_KEY}`, zod-parse responses, 10s timeout, typed errors. Endpoints:
  - `POST /api/v1/contacts/search/count` (free) body = filters -> `{ total_matching }`
  - `POST /api/v1/contacts/search` body = filters + `limit`,`offset` -> `{ contacts[], total_available }` (1 credit per row)
  - Filters: `industries, job_titles, seniority, company_size, countries, office_states, email_status:["VALID"]`. Contact fields: first_name, last_name, email_address, email_status, job_title, job_level, org_company_name, org_domain, org_industry_linkedin, employee_count_range, person_city, state_name, person_country_name, person_linkedin_url, cellphone.
- `src/lib/free-leads/icp-to-filters.ts` — pure, tested. Always adds `email_status:["VALID"]`. Drops industries not in `GETLEADS_INDUSTRIES`.
- `src/lib/free-leads/scan.ts` — fetch site (existing `firecrawlService`, 8s timeout, fallback raw fetch + strip), then Claude `claude-opus-5-5`, effort `low`, streaming, structured output, emits findings then ICP; industries constrained to the enum. Include `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`) if the SDK version supports it; otherwise note it. Check `stop_reason` (refusal / max_tokens).
- Routes under `src/app/api/start/`: `scan` (SSE), `count`, `refine`, `preview`, `claim`, `leads` (auth), `interest` (auth). Add public ones to middleware allowlists (both blocks) — NOT `leads`/`interest`.
- Migration `free_lead_claims`: id, email (unique, lowercased), email_domain (unique among fulfilled), website, icp jsonb, filters jsonb, status (pending|fulfilled|failed), workspace_id, auth_user_id, ip_hash, credits_used, upgrade_interest text[], created_at, fulfilled_at. RLS enabled, no anon policies (service role only via server routes).
- Workspace: reuse `src/lib/funnel/workspace-provision.ts` patterns (settings.source='free_leads', visible_features = FUNNEL_TIER_FEATURES). If the verified user already has a workspace, use it.
- Leads insert into `leads` with workspace_id, source `getleads_free`, via existing inserter/repository patterns.
- Email: "Your 25 leads are ready" magic-link template next to `src/lib/email/templates/magic-login-link.ts`.

## Invariants (safe-feature-slice; review gate)
1. No credits spent for an unverified mailbox: the 25-lead pull happens only in `GET /api/start/leads` for an authenticated user whose email matches a pending claim.
2. One fulfilled claim per email and per email_domain, enforced by DB unique index + status transition `pending -> fulfilled` done atomically (no double pull on refresh / parallel tabs).
3. Personal email domains rejected at claim.
4. Anonymous spend caps: preview <= 5 per IP per day and cached by filter hash; global daily caps via env `FREE_LEADS_DAILY_CLAIM_CAP` (default 30) and `FREE_LEADS_DAILY_PREVIEW_CAP` (default 60). Scan/refine rate-limited per IP (they cost Claude + Firecrawl).
5. Every leads read/write filtered by workspace_id. Service-role use justified in a comment at each call site.
6. Never name GetLeads (or any vendor) in responses/UI/emails (see commit #126 "Never show customers the upstream provider name").
7. No empty catches; log via `safeError` and return user-safe messages.

## Frontend (owner: frontend agent) — impeccable, brand register, DESIGN.md tokens
- `src/app/start/**` only (+ components under `src/app/start/_components`). Light theme, Inter, #007AFF, pushed bolder: blue carries the ICP card and the leads-arrival moment.
- Scene: founder/agency owner, bright desk or phone, arrived from a cold email or LinkedIn DM, skeptical, ~90s attention.
- Anchors: Perplexity streaming answer, Linear onboarding pacing, Clay's data table.
- States: scanning (real findings stream, no fake spinners), unreachable site (paste description fallback -> same scan with text), zero matches (suggest widening), rate limited, already claimed, personal email, slow scan (>12s reassurance), mobile.
- Leads page: table-first, CSV download (client-side from FullLead[]), lead 26 locked row + "Want 25 of these every week?" rung, then LinkedIn outreach rung, then AI dashboard rung (link examples https://leads.amcollectivecapital.com). Interest -> POST /api/start/interest -> open booking URL.
- No emojis, no em dashes, no gradient text, no side-stripe borders, no hero-metric template, no modal-first.

## Open (Adam)
- Weekly-leads price (no Stripe product created; rung captures intent + books a call).
- GetLeads terms for product use before public launch.
