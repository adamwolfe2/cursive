# Slice plan: free-leads credit paths (delivery fit check, preview reuse, shared caches)

Brief. Actor: verified claimer (delivery), anonymous visitor (scan/count/preview).
Invariant: paid pulls only for a verified mailbox (one attempt per claim) or a capped anonymous preview;
cache rows are server-only (RLS on, no policies); a failed fit check never blocks delivery nor triggers a re-pull.
Unsafe: double pull, >25 delivered, client-writable cache, vendor named, swallowed errors.
Assumptions: judge failure -> top 25 unscored (logged). <25 usable -> deliver what exists (unchanged).
Risk tier: 1 (credits). Out of scope: MillionVerifier at delivery (needs Adam's OK on a new paid key).

| # | Slice | Status | Depends |
|---|---|---|---|
| 1 | free_leads_cache table + cache.ts (get/put, TTL), RLS no policies | done (prod applied, RLS verified) | - |
| 2 | Delivery: pull 35 (or reuse cached preview 5 + pull offset 5 limit 30), fit check, store best 25 with fit score/why/rank, FullLead.why | done (E2E pending) | 1 |
| 3 | Preview + count + scan use the shared cache (preview stores raw contacts; scan replays cached events) | done | 1 |

Exit evidence per slice: failing test first, vitest + tsc green; slice 2 also local E2E (real pull) at the end.
