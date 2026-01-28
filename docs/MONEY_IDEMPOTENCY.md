# Money Path Idempotency

**Generated**: 2026-01-28
**Scope**: All financial transactions in the Lead Marketplace

---

## 1. Overview

All money-related operations in the marketplace are designed to be **idempotent** - the same operation can be executed multiple times without changing the result beyond the initial application.

### Money Paths Covered

| Path | Direction | Mechanism |
|------|-----------|-----------|
| Credit Purchase | Buyer → Platform | Webhook event ID |
| Lead Purchase (Credits) | Buyer → Partners | Transaction ID |
| Lead Purchase (Stripe) | Buyer → Platform → Partners | Checkout session ID |
| Partner Payout | Platform → Partner | Idempotency key |
| Refund | Platform → Buyer | Original purchase ID |

---

## 2. Credit Purchase Idempotency

### Flow
```
Buyer → Stripe Checkout → Webhook → Credits Applied
```

### Idempotency Mechanism

**Table**: `processed_webhook_events`

```sql
CREATE TABLE processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Webhook Handler Logic

```typescript
// src/app/api/webhooks/stripe/route.ts

async function handleWebhook(event: Stripe.Event) {
  // 1. Check if already processed
  const { data: existing } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (existing) {
    return { success: true, duplicate: true }
  }

  // 2. Record event BEFORE processing
  await supabase.from('processed_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
  })

  // 3. Process event
  await processEvent(event)

  return { success: true, duplicate: false }
}
```

### Key Points

- Event ID checked **before** any state changes
- Event recorded immediately after check
- Returns 200 even on processing error (prevents Stripe retries)
- 30-day retention with cleanup function

---

## 3. Lead Purchase Idempotency

### Credit Payment Flow
```
Purchase Record Created (pending)
    ↓
Credits Deducted (atomic)
    ↓
Commissions Created (pending_holdback)
    ↓
Purchase Completed
```

### Atomic Credit Operations

**Function**: `deduct_workspace_credits()`

```sql
CREATE OR REPLACE FUNCTION deduct_workspace_credits(
  p_workspace_id UUID,
  p_amount INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock row for update
  SELECT balance INTO v_current_balance
  FROM workspace_credits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Atomic update
  UPDATE workspace_credits
  SET balance = balance - p_amount,
      total_used = total_used + p_amount,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
```

### Stripe Payment Flow
```
Purchase Record Created (pending)
    ↓
Stripe Checkout Session Created
    ↓
User Pays on Stripe
    ↓
Webhook: checkout.session.completed
    ↓
Verify Purchase Still Pending
    ↓
Fulfill Purchase
    ↓
Create Commissions
```

### Double-Check Before Fulfillment

```typescript
// In webhook handler
const { data: purchase } = await supabase
  .from('marketplace_purchases')
  .select('status')
  .eq('id', purchaseId)
  .single()

// Only fulfill if still pending
if (purchase?.status !== 'pending') {
  return { success: true, action: 'already_completed' }
}
```

### Key Points

- Purchase starts as `pending`
- Only one path can complete it
- Status checked before fulfillment
- Stripe session ID stored for reconciliation

---

## 4. Partner Payout Idempotency

### Flow
```
Commissions Become Payable (after 7-day holdback)
    ↓
Weekly Job Aggregates by Partner
    ↓
Generate Idempotency Key
    ↓
Check for Existing Payout
    ↓
Create Stripe Transfer
    ↓
Mark Commissions as Paid
```

### Idempotency Key Format

```typescript
// Format: payout-{partner_id}-{week_start_date}
const idempotencyKey = `payout-${partnerId}-${weekStart.toISOString().slice(0, 10)}`

// Examples:
// payout-abc123-2026-01-27
// payout-def456-2026-01-27
```

### Database Constraint

```sql
ALTER TABLE payouts
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_idempotency_key
ON payouts(idempotency_key);
```

### Payout Logic

```typescript
// src/inngest/functions/partner-payouts.ts

async function processPartnerPayout(partnerId: string, weekStart: Date) {
  const idempotencyKey = `payout-${partnerId}-${weekStart.toISOString().slice(0, 10)}`

  // Check for existing payout
  const { data: existing } = await supabase
    .from('payouts')
    .select('id, status')
    .eq('idempotency_key', idempotencyKey)
    .single()

  if (existing) {
    return { success: true, duplicate: true, payoutId: existing.id }
  }

  // Create payout record first
  const { data: payout } = await supabase
    .from('payouts')
    .insert({
      partner_id: partnerId,
      idempotency_key: idempotencyKey,
      status: 'pending',
      // ...
    })
    .select('id')
    .single()

  // Transfer via Stripe Connect
  const transfer = await stripe.transfers.create({
    amount: amountInCents,
    currency: 'usd',
    destination: stripeConnectAccountId,
  }, {
    idempotencyKey: idempotencyKey, // Stripe-level idempotency
  })

  // Update payout status
  await supabase
    .from('payouts')
    .update({
      status: 'completed',
      stripe_transfer_id: transfer.id,
    })
    .eq('id', payout.id)

  return { success: true, duplicate: false, payoutId: payout.id }
}
```

### Key Points

- One payout per partner per week
- Unique constraint prevents duplicates
- Stripe idempotency key matches database key
- Status tracked for reconciliation

---

## 5. Refund Idempotency

### Flow
```
Refund Request (with purchase_id)
    ↓
Check Purchase Status
    ↓
Calculate Refund Amount
    ↓
Process Stripe Refund (if applicable)
    ↓
Update Purchase Status
    ↓
Return Credits (if applicable)
    ↓
Cancel Commissions
```

### Refund Logic

```typescript
async function processRefund(purchaseId: string, reason: string) {
  // Check purchase status
  const { data: purchase } = await supabase
    .from('marketplace_purchases')
    .select('status, payment_method, stripe_payment_intent_id, credits_used')
    .eq('id', purchaseId)
    .single()

  // Cannot refund if not completed
  if (purchase.status !== 'completed') {
    throw new Error(`Cannot refund purchase with status: ${purchase.status}`)
  }

  // Cannot double-refund
  if (purchase.status === 'refunded') {
    return { success: true, duplicate: true }
  }

  // Process based on payment method
  if (purchase.payment_method === 'stripe' && purchase.stripe_payment_intent_id) {
    await stripe.refunds.create({
      payment_intent: purchase.stripe_payment_intent_id,
    })
  }

  if (purchase.payment_method === 'credits' && purchase.credits_used > 0) {
    await supabase.rpc('add_workspace_credits', {
      p_workspace_id: purchase.buyer_workspace_id,
      p_amount: purchase.credits_used,
      p_source: 'refund',
    })
  }

  // Update purchase status
  await supabase
    .from('marketplace_purchases')
    .update({
      status: 'refunded',
      refund_reason: reason,
      refund_amount: purchase.total_price,
    })
    .eq('id', purchaseId)

  // Cancel associated commissions
  await supabase
    .from('marketplace_purchase_items')
    .update({ commission_status: 'cancelled' })
    .eq('purchase_id', purchaseId)

  return { success: true, duplicate: false }
}
```

### Key Points

- Purchase ID is the idempotency key
- Status check prevents double refund
- Both Stripe and credits handled
- Commissions cancelled atomically

---

## 6. Commission Status Machine

Commissions follow a strict state machine:

```
                    ┌─────────────┐
                    │   Created   │
                    └──────┬──────┘
                           │
                           ▼
              ┌───────────────────────┐
              │   pending_holdback    │
              │    (7 day holdback)   │
              └───────────┬───────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ payable  │   │cancelled │   │ refunded │
    └────┬─────┘   └──────────┘   └──────────┘
         │
         ▼
    ┌──────────┐
    │   paid   │
    └──────────┘
```

### Transition Rules

| From | To | Trigger |
|------|-----|---------|
| pending_holdback | payable | 7 days elapsed |
| pending_holdback | cancelled | Refund before holdback ends |
| payable | paid | Payout processed |
| payable | cancelled | Manual cancellation |
| - | refunded | Refund after paid |

---

## 7. Database Constraints

### Unique Constraints

```sql
-- Webhook events
CREATE UNIQUE INDEX idx_processed_webhook_events_stripe_id
ON processed_webhook_events(stripe_event_id);

-- Payout idempotency
CREATE UNIQUE INDEX idx_payouts_idempotency_key
ON payouts(idempotency_key);

-- Lead deduplication
CREATE UNIQUE INDEX idx_leads_hash_key_unique
ON leads(hash_key) WHERE hash_key IS NOT NULL;
```

### Foreign Key Constraints

```sql
-- Purchase items link to purchase
ALTER TABLE marketplace_purchase_items
ADD CONSTRAINT fk_mpi_purchase
FOREIGN KEY (purchase_id) REFERENCES marketplace_purchases(id);

-- Commissions link to payout
ALTER TABLE marketplace_purchase_items
ADD CONSTRAINT fk_mpi_payout
FOREIGN KEY (payout_id) REFERENCES payouts(id);
```

---

## 8. Error Recovery

### Webhook Processing Error

1. Event is recorded in `processed_webhook_events`
2. Return 200 to Stripe (prevent retry storm)
3. Log error for manual investigation
4. Use separate retry job if needed

### Payout Processing Error

1. Payout record exists with `pending` status
2. Stripe transfer may or may not have succeeded
3. Reconciliation job checks Stripe API
4. Manual intervention if state mismatch

### Credit Operation Error

1. PostgreSQL transaction ensures atomicity
2. On error, entire transaction rolls back
3. Balance is never partially updated
4. Retry is safe (same result)

---

## 9. Monitoring

### Key Metrics

```sql
-- Duplicate webhook rate
SELECT
  date_trunc('hour', created_at) as hour,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE processed_at < created_at + interval '1 second') as first_attempt
FROM processed_webhook_events
GROUP BY 1
ORDER BY 1 DESC;

-- Payout success rate
SELECT
  status,
  COUNT(*),
  SUM(amount) as total_amount
FROM payouts
WHERE created_at > NOW() - interval '7 days'
GROUP BY status;

-- Commission status distribution
SELECT
  commission_status,
  COUNT(*),
  SUM(commission_amount) as total
FROM marketplace_purchase_items
WHERE created_at > NOW() - interval '30 days'
GROUP BY commission_status;
```

### Alerts

- Webhook duplicate rate > 10%
- Payout failure rate > 5%
- Commission stuck in `pending_holdback` > 10 days
- Credit balance negative (should be impossible)

---

## 10. Testing Idempotency

### Unit Tests

```typescript
it('should not apply credits twice for duplicate webhook', async () => {
  const event = createMockStripeEvent()

  await processWebhook(event)
  await processWebhook(event) // Duplicate

  const credits = await getWorkspaceCredits(workspaceId)
  expect(credits).toBe(100) // Not 200
})

it('should not create duplicate payout for same week', async () => {
  const weekStart = getWeekStart(new Date())

  await processWeeklyPayout(partnerId, weekStart)
  await processWeeklyPayout(partnerId, weekStart) // Duplicate

  const payouts = await getPartnerPayouts(partnerId)
  expect(payouts.length).toBe(1)
})
```

### Integration Tests

See `src/__tests__/integration/webhook-idempotency.test.ts` for comprehensive tests.

---

*End of Money Path Idempotency Documentation*
