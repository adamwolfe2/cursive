# Merge Plan

Branch: `claude/build-lead-marketplace-WUiyf`
Target: `main`
Date: 2026-01-28

## Pre-Merge Checklist

### Validation
- [x] All tests pass (391 tests)
- [x] TypeScript compiles without errors
- [x] ESLint passes without errors
- [x] Production build succeeds
- [x] Toast tests verified deterministic (10x runs)

### Security
- [x] Partner data not exposed to buyers
- [x] Buyer identity not exposed to partners
- [x] Webhook idempotency implemented
- [x] RLS policies active on all marketplace tables
- [x] No hardcoded secrets

### Performance
- [x] Indexes exist for all common query patterns
- [x] Partial indexes used for marketplace-listed leads
- [x] Hash key lookup indexed for deduplication

## Merge Steps

### Step 1: Final Validation
```bash
# Run full validation pipeline
./scripts/validate.sh
```

Expected output: `ALL CHECKS PASSED!`

### Step 2: Create PR
```bash
# Push latest changes
git push origin claude/build-lead-marketplace-WUiyf

# Create PR
gh pr create \
  --base main \
  --head claude/build-lead-marketplace-WUiyf \
  --title "feat: Lead Marketplace with Partner System" \
  --body "$(cat <<'EOF'
## Summary
Two-sided lead marketplace enabling partners to upload leads and buyers to purchase them.

### Key Features
- Partner lead uploads with CSV parsing
- Email verification via MillionVerifier
- Lead deduplication with SHA256 hash
- Dynamic pricing based on intent/freshness/verification
- Partner commissions (30% base + bonuses)
- Buyer credit system
- Webhook idempotency for Stripe payments
- Rate limiting with token bucket

### Documentation Added
- docs/RELEASE_CHECKLIST.md
- docs/SECURITY_REGRESSION_SWEEP.md
- docs/PERFORMANCE_SANITY.md
- docs/MERGE_PLAN.md
- docs/MONEY_IDEMPOTENCY.md
- docs/JOBS_RUNBOOK.md
- docs/UPLOAD_PIPELINE.md
- docs/TESTING.md

### Test Results
- 391 tests passing
- All flaky tests fixed (toast component)
- 10x stability verification passed

### Security Verified
- Partner/buyer data isolation
- Webhook double-fulfillment prevention
- RLS policies active
EOF
)"
```

### Step 3: Merge
After PR approval:
```bash
gh pr merge --squash
```

## Migration Steps

### Required Migrations (in order)
These migrations are already in the branch and will be applied when deploying:

1. `20260128000001_lead_data_fields.sql` - Additional lead fields
2. `20260128100000_lead_marketplace_schema.sql` - Core marketplace tables
3. `20260128110000_fix_freshness_floor.sql` - Freshness floor = 15
4. `20260128120000_payout_enhancements.sql` - Payout tracking
5. `20260128130000_webhook_idempotency.sql` - Event deduplication table
6. `20260128140000_rate_limiting.sql` - Token bucket rate limiting
7. `20260128150000_upload_scalability.sql` - Large upload support

### Apply Migrations
```bash
# If using Supabase CLI
supabase db push

# Or via Vercel/deployment pipeline (automatic)
# Migrations run on deploy via supabase-js migration runner
```

### Verify Migrations Applied
```sql
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;
```

## Required Environment Variables

Ensure these are set in production:

```bash
# Required for marketplace
MILLIONVERIFIER_API_KEY=      # Email verification
STRIPE_CONNECT_CLIENT_ID=     # Partner payouts
INNGEST_EVENT_KEY=            # Background jobs
INNGEST_SIGNING_KEY=          # Job signing

# Optional flags
EMAIL_VERIFICATION_KILL_SWITCH=false  # Set true to disable verification
```

## Post-Merge Smoke Test

### 1. Verify Inngest Jobs
Check dashboard: https://app.inngest.com/

Verify jobs registered:
- `process-partner-upload`
- `verify-partner-leads`
- `update-lead-freshness`
- `process-payable-commissions`
- `daily-partner-summary`
- `partner-upload-processor`

### 2. Verify Stripe Webhook
```bash
# Test webhook endpoint responds
curl -X POST https://app.meetcursive.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Should return 400 (invalid signature) not 500
```

### 3. Partner Flow Test
1. Navigate to /partner/auth
2. Create test partner account
3. Upload small CSV (5 rows)
4. Verify leads appear in partner dashboard

### 4. Buyer Flow Test
1. Navigate to /marketplace
2. Browse leads (verify partner info not visible)
3. Add leads to cart
4. Complete test purchase with Stripe test card
5. Verify download available

### 5. Commission Test
1. Verify commission recorded in purchase items
2. Verify partner pending balance updated
3. Check commission status = 'pending_holdback'

## Rollback Plan

### If Issues Detected

#### Quick Rollback (< 5 minutes)
```bash
# Revert the merge commit
git revert <merge-sha> -m 1
git push origin main
```

#### Feature Disable (immediate)
Set environment variable:
```bash
ENABLE_MARKETPLACE=false
```
This returns 503 on all marketplace routes.

### Database Rollback (if needed)
Migrations are additive and backward-compatible. Tables can remain even if feature is disabled.

If absolutely necessary to remove:
```sql
-- CAUTION: Only if data can be lost
DROP TABLE IF EXISTS marketplace_purchase_items CASCADE;
DROP TABLE IF EXISTS marketplace_purchases CASCADE;
DROP TABLE IF EXISTS credit_purchases CASCADE;
DROP TABLE IF EXISTS workspace_credits CASCADE;
DROP TABLE IF EXISTS processed_webhook_events CASCADE;
DROP TABLE IF EXISTS partner_upload_batches CASCADE;
```

## Support Resources

- `/docs/JOBS_RUNBOOK.md` - Background job troubleshooting
- `/docs/MONEY_IDEMPOTENCY.md` - Payment issue debugging
- `/docs/UPLOAD_PIPELINE.md` - Upload failure investigation
- `/docs/TESTING.md` - Running test suites

## Sign-Off

- [ ] All validation passed
- [ ] PR approved
- [ ] Migrations reviewed
- [ ] Environment variables set
- [ ] Monitoring alerts configured
- [ ] Rollback plan understood

**Ready to merge.**
