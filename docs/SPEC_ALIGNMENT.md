# Specification Alignment Analysis

**Generated**: 2026-01-28
**Reference**: Original overnight prompt + PLAN.md

---

## Commission Structure

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Base rate: 30% | `COMMISSION_CONFIG.BASE_RATE = 0.30` in `commission.service.ts:9` | ✅ Implemented | None |
| Fresh sale bonus: +10% (≤7 days) | `FRESH_SALE_BONUS: 0.10, FRESH_SALE_DAYS: 7` in `commission.service.ts:13,27` | ✅ Implemented | None |
| High verification bonus: +5% (≥95%) | `HIGH_VERIFICATION_BONUS: 0.05, HIGH_VERIFICATION_THRESHOLD: 95` in `commission.service.ts:14,30` | ✅ Implemented | None |
| Volume bonus: +5% (10K+ leads this month) | `VOLUME_BONUS: 0.05, VOLUME_THRESHOLD: 10000` in `commission.service.ts:15,33` | ⚠️ Partial | Currently checks total uploaded, not monthly. Need to add monthly aggregation. |
| Cap: 50% maximum | `MAX_RATE: 0.50` in `commission.service.ts:18` | ✅ Implemented | None |
| Holdback: 14 days | `HOLDBACK_DAYS: 14` in `commission.service.ts:21` | ✅ Implemented | None |
| Minimum payout: $50 | `MIN_PAYOUT_AMOUNT: 50` in `commission.service.ts:24` | ✅ Implemented | None |
| Refund cancels commission during holdback | Not implemented | ❌ Missing | Add refund handling logic |

---

## Referral Programs

### Buyer Referrals

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| 50 credits on referrer signup | `BUYER_REFERRER_CREDIT: 25` in `referral.service.ts:9` | ❌ Deviated | Change to 50 credits |
| 200 credits to referrer on first purchase | Not tiered, single 25 credit reward | ❌ Deviated | Implement milestone system |
| 100 credits to referred on first purchase | `BUYER_REFEREE_CREDIT: 10` in `referral.service.ts:10` | ❌ Deviated | Change to 100 credits on first purchase |
| 500 credits at $500 cumulative spend | Not implemented | ❌ Missing | Add spend milestone tracking |

### Partner Referrals

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| $50 at 1K verified leads | Not implemented | ❌ Missing | Add milestone reward system |
| $100 at $500 commissions | Not implemented | ❌ Missing | Add milestone reward system |
| $250 at $2,000 commissions | Not implemented | ❌ Missing | Add milestone reward system |
| Ongoing commission override | Current: 2% bonus for 90 days | ⚠️ Deviated | Spec says milestones only, not ongoing. Clarify intent. |

---

## Pricing Model

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Base: $0.05/lead | `basePrice = 0.05` in `lead-scoring.service.ts:308` | ✅ Implemented | None |
| Intent Low (1×) | Score <34 = 1× | ✅ Implemented | None |
| Intent Medium (1.5×) | Score 34-66 = 1.5× | ✅ Implemented | None |
| Intent High (2.5×) | Score ≥67 = 2.5× | ✅ Implemented | None |
| Freshness Fresh <14 days (1.5×) | Score ≥80 = 1.5× (sigmoid, ~14 days) | ⚠️ Approximate | Using score thresholds instead of day thresholds. Acceptable. |
| Freshness Recent 14-45 days (1×) | Score 30-79 = 1× | ⚠️ Approximate | Same as above |
| Freshness Older >45 days (0.5×) | Score <30 = 0.5× | ⚠️ Approximate | Same as above |
| Has phone: +$0.03 | `if (hasPhone) price += 0.03` in `lead-scoring.service.ts:330` | ✅ Implemented | None |
| Verified email (VALID only): +$0.02 | `if (verificationStatus === 'valid') price += 0.02` in `lead-scoring.service.ts:334` | ✅ Implemented | None |
| Catch-all: no verified add-on, flag risky | `if (verificationStatus === 'catch_all') price -= 0.01` in `lead-scoring.service.ts:336` | ⚠️ Deviated | Spec says no add-on, not -$0.01. Need to change to no modifier. |

---

## Lead Deduplication

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Hash: SHA256(lower(email) + lower(company_domain) + normalized_phone) | `calculate_lead_hash()` function in migration | ✅ Implemented | None |
| Unique index on hash_key | `idx_leads_hash_key_unique` in migration | ✅ Implemented | None |
| Same partner duplicate: update timestamps | Not enforced in application | ❌ Missing | Add upsert logic in upload processing |
| Cross-partner duplicate: reject, first uploader retains | Not enforced in application | ❌ Missing | Add hash check before insert, reject with reason |
| Seed leads: platform-owned, not claimable | No mechanism to mark seed leads | ❌ Missing | Add `is_platform_owned` flag or null `partner_id` convention |
| Rejection logging with reason codes | `error_log` JSONB on `partner_upload_batches` | ⚠️ Partial | Need structured reason codes |
| Rejected rows downloadable | `rejected_rows_url` field exists | ⚠️ Partial | Need to actually generate and store file |

---

## Email Verification

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Provider: MillionVerifier | `PROVIDER: 'millionverifier'` in `email-verification.service.ts:10` | ✅ Configured | None |
| Batch API calls with retry/backoff | Basic retry in `processVerificationQueue` | ⚠️ Partial | Add proper circuit breaker, rate limiting |
| Queue processing via Inngest | Service exists, no Inngest function | ❌ Missing | Create `inngest/functions/email-verification.ts` |
| Gating: only valid/catch_all in marketplace | `.in('verification_status', ['valid', 'catch_all'])` in browse query | ✅ Implemented | None |
| Store raw provider response | `verification_response` JSONB field | ✅ Implemented | None |
| Re-verification after 60 days unsold | `queueStaleLeadsForReverification(60)` function exists | ⚠️ Partial | No scheduled job calling it |
| Catch-all flagged as risky | Stored as `catch_all` status | ⚠️ Partial | UI doesn't prominently flag it |
| Kill switch (feature flag) | Not implemented | ❌ Missing | Add env var or DB flag |

---

## Stripe Connect Payouts

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Express onboarding | `/api/partner/stripe/connect` route exists | ⚠️ Partial | Need to verify full flow |
| Store stripe_connect_account_id | Field on partners table | ✅ Implemented | None |
| Weekly payout job (Monday) | Not implemented | ❌ Missing | Create Inngest cron function |
| Minimum threshold: $50 | `MIN_PAYOUT_AMOUNT: 50` | ✅ Configured | None |
| 14-day holdback | Commission status flow exists | ✅ Implemented | None |
| Create transfers to Connect accounts | Not implemented | ❌ Missing | Add Stripe Transfer API calls |
| Mark commissions paid | `commission_status` field exists | ✅ Schema ready | Need job to update |
| Idempotency (safe to re-run) | No idempotency keys | ❌ Missing | Add payout_id tracking, DB locks |

---

## Partner Score

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Score 0-100 | `partner_score INTEGER` on partners | ✅ Schema ready | None |
| Verification pass rate: 35% weight | `update_partner_statistics` function | ⚠️ Partial | Needs full weighted calculation |
| Duplicate rate: 20% weight | `duplicate_rate` field exists | ⚠️ Partial | Not used in score calc |
| Data completeness: 15% weight | `data_completeness_rate` field exists | ⚠️ Partial | Not used in score calc |
| Freshness at sale: 15% weight | Not calculated | ❌ Missing | Add tracking |
| Buyer satisfaction: 15% weight | Not implemented | ❌ Missing | Placeholder for now |
| Scheduled recalculation job | Not implemented | ❌ Missing | Create Inngest function |
| Score history tracking | `partner_score_history` table | ✅ Schema ready | Need job to populate |

---

## Freshness Decay

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Sigmoid curve | `calculate_freshness_score()` SQL function | ✅ Implemented | None |
| ~100 at day 0, ~50 at day 30 | Midpoint=30, steepness=0.15 | ✅ Implemented | None |
| Floor of 15 (spec says 5 in some places) | `p_floor INTEGER DEFAULT 5` | ⚠️ Deviated | Change to 15 per overnight prompt |
| Daily job to update scores | Not implemented | ❌ Missing | Create Inngest cron function |
| Update prices when freshness changes | `update_all_freshness_scores()` does both | ✅ Function ready | Need job to call it |

---

## Invisibility Protections

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Buyers never see partner_id | `obfuscateLead()` doesn't include partner_id | ✅ Implemented | Add explicit test |
| Buyers never see upload_batch_id | Not in browse query select | ✅ Implemented | Add explicit test |
| Buyers never see filenames | Not exposed | ✅ Implemented | Add explicit test |
| Buyers never see raw verification JSON | Not in browse preview | ✅ Implemented | Add explicit test |
| Partners never see buyer identity | No buyer info in partner APIs | ✅ Implemented | Add explicit test |
| Partners see only aggregate counts | Partner dashboard shows totals | ✅ Implemented | None |

---

## Direct Stripe Payment Path

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Fallback when no credits | `paymentMethod: 'stripe'` accepted | ⚠️ Partial | Logic incomplete |
| Stripe Checkout flow | Not implemented for lead purchases | ❌ Missing | Add checkout session creation |
| Webhook fulfillment | Only handles `credit_purchase` type | ❌ Missing | Add `lead_purchase` type |
| Strict idempotency | No event ID tracking | ❌ Missing | Add processed_webhook_events table |

---

## Upload Scalability

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Support 50MB / 100K rows | Request-based upload | ⚠️ Risk | Likely to timeout |
| Storage-first approach | Not implemented | ❌ Missing | Add signed URL upload → background processing |
| Progress tracking | `partner_upload_batches.processed_rows` field | ✅ Schema ready | Need background job |
| Rejected rows export | `rejected_rows_url` field | ⚠️ Partial | Need to generate file |
| Benchmark results | Not performed | ❌ Missing | Test with 10K and 100K rows |

---

## Rate Limiting

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Partner upload endpoints | Not implemented | ❌ Missing | Add rate limit middleware |
| Marketplace browse endpoints | Not implemented | ❌ Missing | Add rate limit middleware |
| Purchase endpoints | Not implemented | ❌ Missing | Add rate limit middleware |
| Referral endpoints | Not implemented | ❌ Missing | Add rate limit middleware |
| Self-referral prevention | Not implemented | ❌ Missing | Add IP/email checks |

---

## Edge Cases

| Spec Requirement | Current Implementation | Status | Action Plan |
|------------------|----------------------|--------|-------------|
| Same-workspace gaming prevention | Not checked | ❌ Missing | Add partner_workspace != buyer_workspace check |
| Refunds during holdback cancel commissions | Not implemented | ❌ Missing | Add refund handling |
| Multiple sales allowed (non-exclusive) | `sold_count` increments | ✅ Implemented | None |
| Catch-all flagged and priced appropriately | Status stored, price reduced | ⚠️ Deviated | Should not reduce price, just no bonus |
| Purchase download re-auth check | Downloads via purchase lookup | ⚠️ Partial | Verify auth on each download |

---

## Summary Statistics

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Implemented | 37 | 46% |
| ⚠️ Partial/Deviated | 22 | 28% |
| ❌ Missing | 21 | 26% |

---

## Priority Actions

### P0 (Launch Blockers)

1. **Deduplication enforcement** - Cross-partner rejection not enforced
2. **Inngest jobs** - Verification queue, freshness decay, payout jobs
3. **Stripe Connect payouts** - Transfer creation not implemented
4. **Referral program alignment** - Completely wrong reward values

### P1 (High Priority)

1. **Volume bonus monthly calculation** - Currently uses total, not monthly
2. **Catch-all pricing** - Should be no add-on, not negative
3. **Freshness floor** - Change from 5 to 15
4. **Direct Stripe payment** - Incomplete fallback path
5. **Webhook idempotency** - No replay protection

### P2 (Medium Priority)

1. **Partner score calculation** - Weighted formula not implemented
2. **Rate limiting** - No abuse protection
3. **Upload scalability** - Risk of timeout on large files
4. **Re-verification job scheduling** - Function exists but not called

---

*End of Alignment Analysis*
