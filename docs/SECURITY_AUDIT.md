# Security Audit Report

**Generated**: 2026-01-28
**Scope**: Lead Marketplace Security & Privacy

---

## 1. Threat Model

### Assets to Protect

1. **Partner Data** - Identity, upload patterns, commission rates, API keys
2. **Buyer Data** - Identity, purchase history, targeting preferences
3. **Lead Data** - Contact information, pricing, scores
4. **Financial Data** - Credit balances, commission amounts, payout details

### Threat Actors

1. **Malicious Buyer** - Trying to discover partner network
2. **Malicious Partner** - Trying to identify buyers or manipulate attribution
3. **External Attacker** - Trying to extract data or abuse the system
4. **Insider Threat** - Admin misuse

### Attack Vectors

1. **API Enumeration** - Attempting to extract forbidden fields
2. **Timing Attacks** - Inferring information from response times
3. **Data Leakage** - Accidental exposure in error messages
4. **Cross-Tenant Access** - Accessing other workspace data
5. **Duplicate Abuse** - Gaming attribution via deduplication
6. **Referral Fraud** - Self-referral, IP manipulation
7. **Rate Limit Bypass** - Distributed attacks

---

## 2. Enforcement Approach

### Data Boundary: Centralized Serializer

We use a **centralized serializer approach** (not DB views) for buyer-safe data:

**Location**: `MarketplaceRepository.obfuscateLead()`

**Why Serializer vs Views**:
- More flexible for different contexts (browse vs purchased)
- Easier to maintain with TypeScript
- Can apply conditional logic (reveal on purchase)
- Matches existing repository pattern

### Forbidden Fields List

**Buyer endpoints MUST NOT include**:
```typescript
const FORBIDDEN_BUYER_FIELDS = [
  'partner_id',
  'upload_batch_id',
  'uploaded_by_partner_id',
  'partner_name',
  'partner_email',
  'partner_code',
  'partner_api_key',
  'file_name',
  'filename',
  'original_filename',
  'verification_response',
  'verification_raw',
  'raw_response',
  'upload_timestamp',
  'partner_commission',
  'commission_rate',
  'commission_amount',
  'internal_score_breakdown',
]
```

**Partner endpoints MUST NOT include**:
```typescript
const FORBIDDEN_PARTNER_FIELDS = [
  'buyer_id',
  'buyer_user_id',
  'buyer_email',
  'buyer_name',
  'buyer_company',
  'buyer_workspace_id',
  'buyer_workspace_name',
  'buyer_ip',
]
```

---

## 3. RLS Policies

### Marketplace Purchases
```sql
-- Buyers can only view their own purchases
CREATE POLICY "Workspace isolation" ON marketplace_purchases
  FOR ALL USING (
    buyer_workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );
```

### Marketplace Purchase Items
```sql
-- Items visible via purchase ownership
CREATE POLICY "Via purchase" ON marketplace_purchase_items
  FOR SELECT USING (
    purchase_id IN (
      SELECT id FROM marketplace_purchases
      WHERE buyer_workspace_id IN (
        SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### Leads
```sql
-- Buyers see marketplace-listed leads (obfuscated via API)
-- Partners see only their own leads
CREATE POLICY "Marketplace browse" ON leads
  FOR SELECT USING (
    is_marketplace_listed = true
    OR partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
    OR workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );
```

### Partners
```sql
-- Partners can only view themselves
CREATE POLICY "Self only" ON partners
  FOR ALL USING (user_id = auth.uid());
```

### Payouts
```sql
-- Partners see their own payouts
CREATE POLICY "Partner payouts" ON payouts
  FOR SELECT USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
  );

-- Admins can manage all
CREATE POLICY "Admin manage" ON payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner'))
  );
```

---

## 4. Authentication Patterns

### Buyer Authentication
- Supabase Auth session
- Middleware validates user via `getUser()`
- Workspace ID from `users` table

### Partner Authentication
- API Key in `X-API-Key` header (for uploads)
- Session-based (for portal UI)
- Validated against `partners.api_key`

### Admin Authentication
- Supabase Auth session
- Role check: `role IN ('admin', 'owner')`
- Additional checks for sensitive operations

---

## 5. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Partner Upload | 10 | 1 hour |
| Marketplace Browse | 60 | 1 minute |
| Purchase | 10 | 1 minute |
| Referral | 20 | 1 hour |
| Default | 100 | 1 minute |

**Implementation**: Token bucket via `rate_limit_logs` table

---

## 6. Referral Anti-Fraud

### Checks Performed

1. **Self-Referral**
   - Same user ID blocked
   - Same workspace ID blocked

2. **IP Checks**
   - Same IP for referrer/referee flagged
   - Max 5 referrals per IP per hour

3. **Email Patterns**
   - Same company domain (non-common) flagged
   - Similar local parts (john1@, john2@) flagged

### Storage

- `referrals.referrer_ip`
- `referrals.referee_ip`
- `referrals.fraud_check_passed`
- `referrals.fraud_check_reason`

---

## 7. Money Path Idempotency

### Webhook Processing
- `processed_webhook_events` table tracks Stripe event IDs
- Duplicate events return early with `duplicate: true`
- 30-day retention with cleanup function

### Payout Processing
- `payouts.idempotency_key` = `payout-{partner_id}-{week_start}`
- Unique index prevents duplicate payouts
- Weekly payout job checks existing payout before creating

### Credit Operations
- Atomic functions: `add_workspace_credits()`, `deduct_workspace_credits()`
- Transaction-safe balance updates
- Balance check before deduction

---

## 8. Test Commands

### Run Security Tests
```bash
pnpm test src/__tests__/security/
```

### Check for Forbidden Fields
```bash
pnpm test src/__tests__/security/partner-invisibility.test.ts
```

### Verify RLS Policies
```bash
# Connect to Supabase and run:
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 9. Security Checklist

Before each release, verify:

- [ ] No `partner_id` in marketplace browse API response
- [ ] No `buyer_*` fields in partner dashboard
- [ ] Rate limiting active on all endpoints
- [ ] Referral anti-fraud checks passing
- [ ] Webhook idempotency working
- [ ] RLS policies enabled on all marketplace tables
- [ ] API keys not logged or exposed
- [ ] Error messages don't leak internal data
- [ ] Commission calculations auditable

---

## 10. Known Limitations

1. **IP-based rate limiting** - Can be bypassed with distributed IPs
2. **Email pattern detection** - May have false positives
3. **Buyer satisfaction score** - Not yet implemented (placeholder)
4. **Timing attacks** - Not explicitly mitigated

---

## 11. Incident Response

If data leakage is detected:

1. **Immediate**: Disable affected endpoint
2. **Assess**: Identify scope of exposure
3. **Fix**: Patch the vulnerability
4. **Notify**: Inform affected parties if required
5. **Document**: Create incident report
6. **Prevent**: Add test case for the leak

---

*End of Security Audit*
