# Critical Fixes for User Flows

This document contains the code changes needed to fix critical issues identified in the audit.

## Fix #1: Atomic Credit Purchase (CRITICAL)

### Problem
Race condition between checking credits and deducting them allows negative balances.

### Solution
Create a PostgreSQL function that atomically checks and deducts credits.

### Migration File
`supabase/migrations/YYYYMMDD_atomic_credit_purchase.sql`

```sql
-- Create atomic credit purchase function
CREATE OR REPLACE FUNCTION purchase_with_credits(
  p_workspace_id UUID,
  p_user_id UUID,
  p_lead_ids UUID[],
  p_total_price DECIMAL(10,2),
  p_credits_used DECIMAL(10,2)
) RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT,
  new_balance DECIMAL(10,2),
  purchase_id UUID
) AS $$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_purchase_id UUID;
BEGIN
  -- Lock the credits row for update
  SELECT balance INTO v_current_balance
  FROM workspace_credits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  -- Check if workspace has credits record
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'No credits account found', 0::DECIMAL(10,2), NULL::UUID;
    RETURN;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_credits_used THEN
    RETURN QUERY SELECT FALSE, 'Insufficient credits', v_current_balance, NULL::UUID;
    RETURN;
  END IF;

  -- Deduct credits atomically
  UPDATE workspace_credits
  SET
    balance = balance - p_credits_used,
    total_used = total_used + p_credits_used,
    updated_at = NOW()
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_new_balance;

  -- Create purchase record
  INSERT INTO marketplace_purchases (
    buyer_workspace_id,
    buyer_user_id,
    total_leads,
    total_price,
    payment_method,
    credits_used,
    status
  ) VALUES (
    p_workspace_id,
    p_user_id,
    array_length(p_lead_ids, 1),
    p_total_price,
    'credits',
    p_credits_used,
    'pending'
  ) RETURNING id INTO v_purchase_id;

  -- Return success
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_new_balance, v_purchase_id;
END;
$$ LANGUAGE plpgsql;
```

### Updated Repository Method
`src/lib/repositories/marketplace.repository.ts`

```typescript
/**
 * Purchase leads with credits (atomic operation)
 * Returns purchase ID or throws error if insufficient credits
 */
async purchaseWithCredits(params: {
  workspaceId: string
  userId: string
  leadIds: string[]
  totalPrice: number
  creditsUsed: number
}): Promise<{ purchaseId: string; newBalance: number }> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient.rpc('purchase_with_credits', {
    p_workspace_id: params.workspaceId,
    p_user_id: params.userId,
    p_lead_ids: params.leadIds,
    p_total_price: params.totalPrice,
    p_credits_used: params.creditsUsed,
  })

  if (error) throw new Error(`Failed to purchase with credits: ${error.message}`)

  if (!data || data.length === 0) {
    throw new Error('Unexpected response from purchase function')
  }

  const result = data[0]

  if (!result.success) {
    throw new Error(result.error_message || 'Purchase failed')
  }

  return {
    purchaseId: result.purchase_id,
    newBalance: result.new_balance,
  }
}
```

### Updated API Route
`src/app/api/marketplace/purchase/route.ts`

Replace lines 172-250 with:

```typescript
if (validated.paymentMethod === 'credits') {
  // Use atomic purchase function
  try {
    const { purchaseId, newBalance } = await repo.purchaseWithCredits({
      workspaceId: userData.workspace_id,
      userId: userData.id,
      leadIds: validated.leadIds,
      totalPrice,
      creditsUsed: totalPrice,
    })

    // Add purchase items with commission calculations
    const purchaseItems = leads.map((lead) => {
      const price = lead.marketplace_price || 0.05

      // Calculate commission with bonuses if lead has a partner
      if (lead.partner_id && partnersMap.has(lead.partner_id)) {
        const partner = partnersMap.get(lead.partner_id)!
        const commissionCalc = calculateCommission({
          salePrice: price,
          partner: {
            id: partner.id,
            verification_pass_rate: partner.verification_pass_rate || 0,
            bonus_commission_rate: partner.bonus_commission_rate || 0,
            base_commission_rate: partner.base_commission_rate,
          },
          leadCreatedAt: new Date(lead.created_at),
          saleDate: new Date(),
        })

        return {
          leadId: lead.id,
          priceAtPurchase: price,
          intentScoreAtPurchase: lead.intent_score_calculated,
          freshnessScoreAtPurchase: lead.freshness_score,
          partnerId: lead.partner_id,
          commissionRate: commissionCalc.rate,
          commissionAmount: commissionCalc.amount,
          commissionBonuses: commissionCalc.bonuses,
        }
      }

      return {
        leadId: lead.id,
        priceAtPurchase: price,
        intentScoreAtPurchase: lead.intent_score_calculated,
        freshnessScoreAtPurchase: lead.freshness_score,
        partnerId: undefined,
        commissionRate: undefined,
        commissionAmount: undefined,
        commissionBonuses: [],
      }
    })

    await repo.addPurchaseItems(purchaseId, purchaseItems)

    // Mark leads as sold (batched)
    await repo.markLeadsSoldBatch(validated.leadIds)

    // Complete the purchase
    const completedPurchase = await repo.completePurchase(purchaseId)

    // Get full lead details for the buyer
    const purchasedLeads = await repo.getPurchasedLeads(purchaseId, userData.workspace_id)

    // Queue email confirmation (background job)
    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/marketplace/download/${purchaseId}`
    const downloadExpiresAt = new Date()
    downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 90)

    await queuePurchaseConfirmationEmail({
      email: userData.email || user.email!,
      name: userData.full_name || 'Valued Customer',
      totalLeads: leads.length,
      totalPrice,
      purchaseId,
      downloadUrl,
      downloadExpiresAt,
    })

    const response = {
      success: true,
      purchase: completedPurchase,
      leads: purchasedLeads,
      totalPrice,
      creditsRemaining: newBalance,
    }

    // Update idempotency key
    if (validated.idempotencyKey) {
      await adminClient
        .from('api_idempotency_keys')
        .update({
          status: 'completed',
          response_data: response,
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', validated.idempotencyKey)
        .eq('workspace_id', userData.workspace_id)
    }

    return NextResponse.json(response)
  } catch (error) {
    // Handle specific credit errors
    if (error instanceof Error && error.message.includes('Insufficient credits')) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: totalPrice,
        },
        { status: 400 }
      )
    }
    throw error // Re-throw for general error handler
  }
}
```

---

## Fix #2: Batch Lead Marking (CRITICAL)

### Problem
Leads are marked sold one-by-one in a loop, creating opportunity for partial failures.

### Solution
Create a batch function that marks all leads sold in a single database operation.

### Migration File
Add to existing migration or create new one:

```sql
-- Batch mark leads as sold
CREATE OR REPLACE FUNCTION mark_leads_sold_batch(
  p_lead_ids UUID[]
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE leads
  SET
    sold_count = sold_count + 1,
    first_sold_at = COALESCE(first_sold_at, NOW()),
    updated_at = NOW()
  WHERE id = ANY(p_lead_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### Updated Repository Method

```typescript
/**
 * Mark multiple leads as sold in a single batch operation
 */
async markLeadsSoldBatch(leadIds: string[]): Promise<number> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient.rpc('mark_leads_sold_batch', {
    p_lead_ids: leadIds,
  })

  if (error) throw new Error(`Failed to mark leads sold: ${error.message}`)

  return data as number
}
```

---

## Fix #3: Email Queue (HIGH PRIORITY)

### Problem
Emails are sent synchronously in API routes, causing slow responses and no retry on failure.

### Solution
Use Inngest to queue email sending as background jobs.

### Email Queue Service
`src/lib/email/queue.ts`

```typescript
import { inngest } from '@/inngest/client'

export interface PurchaseConfirmationEmailData {
  email: string
  name: string
  totalLeads: number
  totalPrice: number
  purchaseId: string
  downloadUrl: string
  downloadExpiresAt: Date
}

export interface CreditPurchaseEmailData {
  email: string
  name: string
  creditsAmount: number
  totalPrice: number
  packageName: string
  newBalance: number
}

export async function queuePurchaseConfirmationEmail(
  data: PurchaseConfirmationEmailData
): Promise<void> {
  await inngest.send({
    name: 'email/purchase-confirmation',
    data,
  })
}

export async function queueCreditPurchaseEmail(
  data: CreditPurchaseEmailData
): Promise<void> {
  await inngest.send({
    name: 'email/credit-purchase',
    data,
  })
}
```

### Inngest Function
`src/inngest/functions/email-sender.ts`

```typescript
import { inngest } from '@/inngest/client'
import {
  sendPurchaseConfirmationEmail,
  sendCreditPurchaseConfirmationEmail,
} from '@/lib/email/service'

export const handlePurchaseConfirmationEmail = inngest.createFunction(
  {
    id: 'email-purchase-confirmation',
    retries: 3,
    cancelOn: [
      {
        event: 'email/send-failed',
        timeout: '1h',
      },
    ],
  },
  { event: 'email/purchase-confirmation' },
  async ({ event, step }) => {
    await step.run('send-email', async () => {
      await sendPurchaseConfirmationEmail(
        event.data.email,
        event.data.name,
        {
          totalLeads: event.data.totalLeads,
          totalPrice: event.data.totalPrice,
          purchaseId: event.data.purchaseId,
          downloadUrl: event.data.downloadUrl,
          downloadExpiresAt: event.data.downloadExpiresAt,
        }
      )
    })

    return { success: true }
  }
)

export const handleCreditPurchaseEmail = inngest.createFunction(
  {
    id: 'email-credit-purchase',
    retries: 3,
  },
  { event: 'email/credit-purchase' },
  async ({ event, step }) => {
    await step.run('send-email', async () => {
      await sendCreditPurchaseConfirmationEmail(
        event.data.email,
        event.data.name,
        {
          creditsAmount: event.data.creditsAmount,
          totalPrice: event.data.totalPrice,
          packageName: event.data.packageName,
          newBalance: event.data.newBalance,
        }
      )
    })

    return { success: true }
  }
)
```

---

## Fix #4: Configuration Constants (LOW PRIORITY)

### Problem
Magic numbers scattered throughout codebase.

### Solution
Create centralized configuration file.

### Configuration File
`src/config/marketplace.ts`

```typescript
export const MARKETPLACE_CONFIG = {
  // Purchase settings
  DOWNLOAD_EXPIRY_DAYS: 90,
  COMMISSION_HOLDBACK_DAYS: 14,

  // Upload limits
  MAX_FILE_SIZE_MB: 10,
  MAX_CSV_ROWS: 10000,

  // Rate limits (requests per minute)
  RATE_LIMIT_PURCHASE: 10,
  RATE_LIMIT_UPLOAD: 5,
  RATE_LIMIT_CREDITS: 10,

  // Scoring
  DEFAULT_INTENT_SCORE: 50,
  DEFAULT_FRESHNESS_SCORE: 100,
  MIN_MARKETPLACE_PRICE: 0.05,
} as const

export const EMAIL_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF_MS: 1000,
} as const
```

Usage:

```typescript
import { MARKETPLACE_CONFIG } from '@/config/marketplace'

// Instead of:
downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 90)

// Use:
downloadExpiresAt.setDate(
  downloadExpiresAt.getDate() + MARKETPLACE_CONFIG.DOWNLOAD_EXPIRY_DAYS
)
```

---

## Fix #5: Error Message Improvements

### Problem
Some error messages are not user-friendly.

### Solution
Create standardized error messages.

### Error Messages
`src/lib/constants/error-messages.ts`

```typescript
export const ERROR_MESSAGES = {
  // Purchase errors
  INSUFFICIENT_CREDITS: 'You don\'t have enough credits to complete this purchase. Please add credits or select fewer leads.',
  LEADS_NO_LONGER_AVAILABLE: 'Some of the leads you selected are no longer available. Please refresh and try again.',
  DUPLICATE_PURCHASE: 'You\'ve already purchased some of these leads. Check your purchase history.',
  PURCHASE_IN_PROGRESS: 'Your purchase is already being processed. Please wait a moment.',

  // Upload errors
  INVALID_FILE_TYPE: 'Please upload a CSV file. Other file types are not supported.',
  FILE_TOO_LARGE: (sizeMB: number) => `Your file is ${sizeMB.toFixed(2)} MB. The maximum file size is 10 MB. Please split your file into smaller batches.`,
  TOO_MANY_ROWS: (count: number) => `Your file contains ${count.toLocaleString()} rows. The maximum is 10,000 rows. Please split your file.`,
  INVALID_INDUSTRY: (industry: string, validIndustries: string[]) =>
    `"${industry}" is not a valid industry. Valid options are: ${validIndustries.join(', ')}`,
  INVALID_STATE: (state: string) => `"${state}" is not a valid US state code. Please use 2-letter codes (e.g., CA, NY, TX).`,

  // Campaign errors
  FEATURE_NOT_AVAILABLE: 'This feature requires a paid plan. Upgrade your account to access campaigns.',
  LIMIT_EXCEEDED: (resource: string, limit: number) =>
    `You've reached your limit of ${limit} ${resource}. Upgrade your plan to create more.`,

  // Auth errors
  NOT_AUTHENTICATED: 'Please sign in to continue.',
  NOT_AUTHORIZED: 'You don\'t have permission to access this resource.',
  PARTNER_NOT_APPROVED: 'Your partner account is pending approval. Please contact support for assistance.',
} as const
```

---

## Testing Plan

### Unit Tests

```typescript
// tests/unit/marketplace.repository.test.ts
describe('MarketplaceRepository', () => {
  describe('purchaseWithCredits', () => {
    it('should atomically deduct credits and create purchase', async () => {
      // Test implementation
    })

    it('should reject purchase with insufficient credits', async () => {
      // Test implementation
    })

    it('should prevent race conditions on concurrent purchases', async () => {
      // Test implementation using Promise.all
    })
  })

  describe('markLeadsSoldBatch', () => {
    it('should mark all leads sold in single operation', async () => {
      // Test implementation
    })
  })
})
```

### Integration Tests

```typescript
// tests/integration/purchase-flow.test.ts
describe('Complete Purchase Flow', () => {
  it('should complete credit purchase end-to-end', async () => {
    // 1. Setup: Create test user, workspace, leads
    // 2. Purchase leads with credits
    // 3. Verify credits deducted
    // 4. Verify leads marked sold
    // 5. Verify email queued
    // 6. Verify download URL works
  })
})
```

---

## Deployment Checklist

Before deploying these fixes:

- [ ] Run all existing tests
- [ ] Run new unit tests
- [ ] Run integration tests
- [ ] Test race condition fix with concurrent requests
- [ ] Test email queue with Inngest
- [ ] Update API documentation
- [ ] Update user documentation
- [ ] Run database migrations on staging
- [ ] Test full flow on staging
- [ ] Monitor error rates after deployment

---

## Rollback Plan

If issues arise after deployment:

1. **Database Changes:**
   - Keep old functions alongside new ones
   - Feature flag new atomic functions
   - Can switch back via environment variable

2. **Code Changes:**
   - Git revert commits
   - Deploy previous version
   - Re-enable synchronous email sending if needed

3. **Monitoring:**
   - Watch error rates in Sentry
   - Monitor database performance
   - Track email delivery rates
