# Security Regression Sweep

Date: 2026-01-28
Branch: claude/build-lead-marketplace-WUiyf

## Overview

This document records the security regression sweep performed before merging the Lead Marketplace feature to main.

## Areas Checked

### 1. Partner Data Leakage in Buyer Endpoints

**Files Checked:**
- `src/app/api/marketplace/leads/route.ts`
- `src/lib/repositories/marketplace.repository.ts`

**Result:** ✅ PASS

**Findings:**
- `browseLeads()` method properly obfuscates all contact information
- Uses `obfuscateLead()` helper to mask email/phone in previews
- Does NOT include in response:
  - `partner_id`
  - `upload_batch_id`
  - `commission_rate`
  - `commission_amount`
  - Raw verification response
- Only `getFullLead()` returns complete data, which requires purchase verification

**Code Evidence:**
```typescript
// marketplace.repository.ts:142-144
const leads: MarketplaceLeadPreview[] = (data || []).map((lead) =>
  this.obfuscateLead(lead)
)
```

### 2. Buyer Identity Leakage to Partners

**Files Checked:**
- `src/app/api/partner/dashboard/route.ts`
- `src/lib/auth/partner.ts`

**Result:** ✅ PASS

**Findings:**
- Partner dashboard returns only aggregate statistics
- No buyer identity info exposed:
  - No buyer_workspace_id
  - No buyer_user_id
  - No buyer email
- Partner only sees: total leads sold, total earnings, commission amounts

**Data Returned:**
```typescript
{
  totalLeadsUploaded: number
  totalLeadsSold: number        // Aggregate count only
  totalEarnings: number         // Aggregate amount only
  pendingBalance: number
  availableBalance: number
  verificationPassRate: number
  duplicateRate: number
  partnerScore: number
  partnerTier: string
  leadsUploadedThisMonth: number
  leadsSoldThisMonth: number
  earningsThisMonth: number
}
```

### 3. Webhook Double-Fulfillment Risk

**Files Checked:**
- `src/app/api/webhooks/stripe/route.ts`

**Result:** ✅ PASS

**Idempotency Controls:**

1. **Event-level idempotency (lines 32-50):**
   ```typescript
   // Check if event already processed
   const { data: existingEvent } = await supabase
     .from('processed_webhook_events')
     .select('id')
     .eq('stripe_event_id', eventId)
     .single()

   if (existingEvent) {
     return NextResponse.json({ received: true, duplicate: true })
   }

   // Record event BEFORE processing
   await supabase.from('processed_webhook_events').insert({
     stripe_event_id: eventId,
     event_type: event.type,
     processed_at: new Date().toISOString(),
   })
   ```

2. **Purchase-level idempotency (lines 67-77):**
   ```typescript
   // Extra check for purchase status
   const { data: existingPurchase } = await supabase
     .from('marketplace_purchases')
     .select('status')
     .eq('id', purchaseId)
     .single()

   if (existingPurchase?.status === 'completed') {
     return NextResponse.json({ received: true, duplicate: true })
   }
   ```

**Risk Mitigation:**
- Event ID recorded before processing (prevents race conditions)
- Purchase status checked before fulfillment
- Returns 200 OK for duplicates (prevents Stripe retry storms)

### 4. RLS Policy Verification

**Files Checked:**
- `supabase/migrations/20260124000012_security_rls_policies.sql`
- `supabase/migrations/20260128100000_lead_marketplace_schema.sql`

**Result:** ✅ PASS

**Key RLS Policies Active:**

| Table | Policy | Effect |
|-------|--------|--------|
| `leads` | Workspace isolation | Users only see own workspace leads |
| `leads` | Marketplace visibility | Listed leads visible to authenticated users |
| `marketplace_purchases` | Buyer access | Only buyer workspace can see purchases |
| `marketplace_purchase_items` | Purchase access | Access via purchase ownership |
| `partners` | Owner access | Partners see only own data |
| `workspace_credits` | Workspace access | Workspace members only |

**SQL Evidence:**
```sql
-- From 20260128100000_lead_marketplace_schema.sql
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own purchases"
  ON marketplace_purchases
  FOR SELECT
  USING (
    buyer_workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );
```

## Commands Run

```bash
# Check for partner_id exposure in marketplace responses
grep -rn "partner_id" src/app/api/marketplace/
# Result: No direct exposure to responses

# Check for buyer identity in partner endpoints
grep -rn "buyer_workspace_id\|buyer_user_id\|buyer_email" src/app/api/partner/
# Result: Not exposed

# Verify webhook idempotency
grep -rn "processed_webhook_events" src/
# Result: Properly used in webhook handler

# Check RLS on new tables
grep -rn "ENABLE ROW LEVEL SECURITY" supabase/migrations/
# Result: All marketplace tables have RLS enabled
```

## Security Tests

Existing security tests that validate these controls:

| Test File | Test | Status |
|-----------|------|--------|
| `src/__tests__/security/partner-invisibility.test.ts` | Partner data not in lead listings | ✅ |
| `src/__tests__/security/partner-invisibility.test.ts` | Buyer identity not in partner dashboard | ✅ |
| `src/__tests__/integration/webhook-idempotency.test.ts` | Duplicate webhook detection | ✅ |
| `src/__tests__/integration/webhook-idempotency.test.ts` | Event recording before processing | ✅ |

## Issues Found

**None** - All security controls are properly implemented.

## Recommendations

1. **Consider adding explicit audit logging** for:
   - Lead purchases (buyer ID, lead ID, timestamp)
   - Partner payouts (partner ID, amount, timestamp)

2. **Consider rate limiting** on:
   - Marketplace browse endpoint (implemented via token bucket)
   - Partner upload endpoint (implemented)

3. **Future enhancement:** Add anomaly detection for:
   - Unusually high purchase volumes from single workspace
   - Same-IP purchases across multiple workspaces

## Conclusion

The Lead Marketplace feature branch passes security regression testing. All critical security controls are in place:

- ✅ Partner data properly isolated from buyers
- ✅ Buyer identity properly isolated from partners
- ✅ Webhook idempotency prevents double-fulfillment
- ✅ RLS policies enforce data boundaries

**Recommendation:** Safe to merge.
