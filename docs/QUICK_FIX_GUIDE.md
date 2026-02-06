# Quick Fix Guide
**For Developers:** How to fix the critical issues FAST

---

## 🚨 CRITICAL: Fix Race Condition (30 mins)

### Step 1: Add SQL Function (5 mins)

```bash
# Create new migration
cd supabase/migrations
touch $(date +%Y%m%d%H%M%S)_atomic_credit_purchase.sql
```

Copy this SQL:

```sql
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
  SELECT balance INTO v_current_balance
  FROM workspace_credits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'No credits account found', 0::DECIMAL(10,2), NULL::UUID;
    RETURN;
  END IF;

  IF v_current_balance < p_credits_used THEN
    RETURN QUERY SELECT FALSE, 'Insufficient credits', v_current_balance, NULL::UUID;
    RETURN;
  END IF;

  UPDATE workspace_credits
  SET balance = balance - p_credits_used, total_used = total_used + p_credits_used
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO marketplace_purchases (
    buyer_workspace_id, buyer_user_id, total_leads, total_price,
    payment_method, credits_used, status
  ) VALUES (
    p_workspace_id, p_user_id, array_length(p_lead_ids, 1), p_total_price,
    'credits', p_credits_used, 'pending'
  ) RETURNING id INTO v_purchase_id;

  RETURN QUERY SELECT TRUE, NULL::TEXT, v_new_balance, v_purchase_id;
END;
$$ LANGUAGE plpgsql;
```

### Step 2: Add Repository Method (10 mins)

In `/src/lib/repositories/marketplace.repository.ts`, add:

```typescript
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

  const result = data[0]
  if (!result.success) throw new Error(result.error_message || 'Purchase failed')

  return {
    purchaseId: result.purchase_id,
    newBalance: result.new_balance,
  }
}
```

### Step 3: Update API Route (15 mins)

In `/src/app/api/marketplace/purchase/route.ts`, replace lines 172-250 with:

```typescript
if (validated.paymentMethod === 'credits') {
  try {
    // Use atomic purchase function
    const { purchaseId, newBalance } = await repo.purchaseWithCredits({
      workspaceId: userData.workspace_id,
      userId: userData.id,
      leadIds: validated.leadIds,
      totalPrice,
      creditsUsed: totalPrice,
    })

    // Add purchase items (commission calculation code stays same)
    const purchaseItems = leads.map((lead) => {
      // ... existing commission calculation code ...
    })

    await repo.addPurchaseItems(purchaseId, purchaseItems)
    await repo.markLeadsSold(validated.leadIds)
    const completedPurchase = await repo.completePurchase(purchaseId)
    const purchasedLeads = await repo.getPurchasedLeads(purchaseId, userData.workspace_id)

    // Send email (keep existing code)
    try {
      await sendPurchaseConfirmationEmail(...)
    } catch (emailError) {
      console.error('[Purchase] Failed to send confirmation email:', emailError)
    }

    const response = {
      success: true,
      purchase: completedPurchase,
      leads: purchasedLeads,
      totalPrice,
      creditsRemaining: newBalance, // Now from atomic function
    }

    if (validated.idempotencyKey) {
      // ... existing idempotency code ...
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient credits')) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: totalPrice },
        { status: 400 }
      )
    }
    throw error
  }
}
```

✅ **Done!** Race condition fixed.

---

## 🟡 HIGH: Fix Batch Lead Marking (15 mins)

### Step 1: Add SQL Function (5 mins)

Add to same migration file:

```sql
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

### Step 2: Add Repository Method (5 mins)

In `/src/lib/repositories/marketplace.repository.ts`:

```typescript
async markLeadsSoldBatch(leadIds: string[]): Promise<number> {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.rpc('mark_leads_sold_batch', {
    p_lead_ids: leadIds,
  })
  if (error) throw new Error(`Failed to mark leads sold: ${error.message}`)
  return data as number
}
```

### Step 3: Update API Route (5 mins)

In purchase route, replace:
```typescript
await repo.markLeadsSold(validated.leadIds)
```

With:
```typescript
await repo.markLeadsSoldBatch(validated.leadIds)
```

✅ **Done!** Batch marking implemented.

---

## 🔵 MEDIUM: Better Error Messages (10 mins)

Error messages file already created at:
`/src/lib/constants/error-messages.ts`

### Quick Usage Example

In any API route:

```typescript
import { formatError } from '@/lib/constants/error-messages'

// Before:
return NextResponse.json(
  { error: 'Insufficient credits' },
  { status: 400 }
)

// After:
return NextResponse.json(
  formatError('INSUFFICIENT_CREDITS'),
  { status: 400 }
)
// Returns: { error: "INSUFFICIENT_CREDITS", message: "You don't have enough credits...", help: "Please add credits...", action: "add_credits" }
```

✅ **Done!** Better error messages ready to use.

---

## 📋 Testing the Fixes

### Test Race Condition Fix

```typescript
// Test concurrent purchases
const promises = Array(10).fill(null).map(() =>
  fetch('/api/marketplace/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadIds: ['lead-1', 'lead-2'],
      paymentMethod: 'credits',
    }),
  })
)

const results = await Promise.all(promises)
// Only ONE should succeed, others should get "Insufficient credits"
```

### Test Batch Marking

```typescript
// Check all leads marked sold
const leads = await db.from('leads').select('sold_count').in('id', leadIds)
expect(leads.every(l => l.sold_count === 1)).toBe(true)
```

---

## 🚀 Deployment Steps

1. **Run migrations:**
   ```bash
   npx supabase db push
   ```

2. **Test in staging:**
   - Try credit purchase
   - Try concurrent purchases
   - Verify no negative balances

3. **Deploy to production:**
   ```bash
   git add .
   git commit -m "fix: atomic credit purchases and batch lead marking"
   git push
   ```

4. **Monitor:**
   - Watch error rates
   - Check database logs
   - Monitor credit balances

---

## 🆘 Rollback Plan

If something breaks:

1. **Revert code:**
   ```bash
   git revert HEAD
   git push
   ```

2. **Keep database functions:**
   The new functions don't interfere with old code, so they're safe to leave

3. **Monitor:**
   Old code path will still work, just without atomic guarantees

---

## 📊 Expected Impact

After these fixes:

- ✅ No more negative credit balances
- ✅ No more partial lead marking failures
- ✅ Better error messages for users
- ✅ Reduced support tickets
- ✅ Increased user confidence

**Time to fix:** ~1 hour
**Risk level:** LOW (changes are additive)
**Testing needed:** 30 minutes
**Deployment time:** 15 minutes

---

## 🎯 Success Metrics

Monitor these after deployment:

- Credit balance errors: Should drop to 0
- Failed purchases: Should decrease
- Support tickets about purchases: Should decrease
- User satisfaction: Should increase

---

## 📞 Need Help?

- Full audit: `/docs/CRITICAL_FLOW_AUDIT.md`
- Detailed fixes: `/docs/CRITICAL_FIXES.md`
- Test cases: `/tests/flows/critical-flows.test.ts`
- Error messages: `/src/lib/constants/error-messages.ts`

**Questions?** Check the detailed docs or contact the team.
