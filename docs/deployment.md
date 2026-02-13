# Deployment Guide

Complete guide for deploying Cursive to production.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Migration](#database-migration)
- [Vercel Deployment](#vercel-deployment)
- [Post-Deployment](#post-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

- **Vercel Account** - Hosting platform
- **Supabase Project** - PostgreSQL database + Auth
- **Stripe Account** - Payment processing
- **Inngest Account** - Background job scheduling
- **GitHub Repository** - Version control

### Required Tools

```bash
# Install Vercel CLI
npm i -g vercel

# Install Supabase CLI
brew install supabase/tap/supabase

# Install pnpm
npm i -g pnpm

# Verify installations
vercel --version
supabase --version
pnpm --version
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/adamwolfe2/cursive.git
cd cursive-work
pnpm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Admin access

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Site Config
NEXT_PUBLIC_SITE_URL=https://leads.meetcursive.com
```

**Security Notes:**
- Never commit `.env.local` to git
- Use different keys for dev/staging/production
- Rotate keys every 90 days

### 3. Vercel Environment Variables

```bash
# Link project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add INNGEST_EVENT_KEY production
vercel env add INNGEST_SIGNING_KEY production
vercel env add NEXT_PUBLIC_SITE_URL production
```

---

## Database Migration

### 1. Connect to Supabase

```bash
# Link local project
supabase link --project-ref your-project-ref

# Verify connection
supabase db remote status
```

### 2. Review Pending Migrations

```bash
# List all migrations
ls -la supabase/migrations/

# Check migration status
supabase migration list
```

### 3. Apply Migrations

```bash
# Push all pending migrations
supabase db push

# Verify success
supabase db remote status
```

**Important Notes:**
- Migrations run in order by filename (YYYYMMDD_name.sql)
- Use `CONCURRENTLY` for index creation to avoid locks
- Test migrations on staging first
- Have rollback files ready (`.down.sql`)

### 4. Verify Database State

```bash
# Check RLS policies
psql -h db.xxx.supabase.co -U postgres -c "SELECT schemaname, tablename, policyname FROM pg_policies ORDER BY tablename;"

# Check indexes
psql -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;"

# Check constraints
psql -c "SELECT table_name, constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'public' ORDER BY table_name;"
```

---

## Vercel Deployment

### 1. Pre-Deployment Checklist

```bash
# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Build locally to verify
pnpm build

# Check bundle size
pnpm build | grep "Route" | awk '{print $2, $3, $4}' | sort -hr
```

### 2. Deploy to Production

```bash
# Deploy to production
vercel --prod

# Monitor deployment
vercel inspect <deployment-url>
```

**Build Settings (Vercel Dashboard):**
- **Framework:** Next.js
- **Build Command:** `pnpm build`
- **Output Directory:** `.next`
- **Install Command:** `pnpm install`
- **Node Version:** 20.x

### 3. Domain Configuration

**Vercel Dashboard → Domains:**
1. Add domain: `leads.meetcursive.com`
2. Configure DNS:
   - **Type:** CNAME
   - **Name:** `leads`
   - **Value:** `cname.vercel-dns.com`
3. Wait for SSL provisioning (~5 minutes)

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl https://leads.meetcursive.com/api/health

# Test auth flow
curl https://leads.meetcursive.com/api/auth/signin \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"..."}'

# Check marketplace
curl https://leads.meetcursive.com/api/marketplace/leads
```

### 2. Configure Stripe Webhooks

**Stripe Dashboard → Developers → Webhooks:**

**Endpoint URL:** `https://leads.meetcursive.com/api/webhooks/stripe`

**Events:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Get webhook secret:**
```bash
# Copy whsec_... to STRIPE_WEBHOOK_SECRET
```

**Test webhook:**
```bash
stripe listen --forward-to https://leads.meetcursive.com/api/webhooks/stripe
stripe trigger checkout.session.completed
```

### 3. Configure Inngest

**Inngest Dashboard → Functions:**

Verify deployed functions:
- `nightly-balance-audit` - Runs at 2 AM daily
- `refresh-earnings-view` - Runs hourly
- `commission-processing` - Runs monthly (1st day)
- `permanent-delete-old-soft-deletes` - Runs daily (Phase 5)

**Trigger test run:**
```bash
curl -X POST https://leads.meetcursive.com/api/inngest \\
  -H "Content-Type: application/json" \\
  -d '{"event":"test/nightly-balance-audit"}'
```

### 4. Configure Supabase Redirects

**Supabase Dashboard → Authentication → URL Configuration:**

**Site URL:** `https://leads.meetcursive.com`

**Redirect URLs:**
- `https://leads.meetcursive.com/auth/callback`
- `https://leads.meetcursive.com/auth/confirm`
- `https://leads.meetcursive.com/welcome`

### 5. Smoke Tests

**Critical user flows:**
- ✅ Sign up → Email confirmation → Welcome flow
- ✅ Sign in → Dashboard load
- ✅ Browse marketplace → Purchase leads
- ✅ Upload campaign leads
- ✅ Partner earnings dashboard
- ✅ Admin payout approval

---

## Rollback Procedures

### Immediate Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Promote previous deployment to production
vercel promote <previous-deployment-url> --prod
```

**Rollback time:** ~30 seconds

### Database Rollback

**Each migration has a `.down.sql` file (Phase 6):**

```bash
# Example: Rollback Phase 5 soft delete
psql -h db.xxx.supabase.co -U postgres cursive \\
  -f supabase/migrations/20260213_soft_delete.down.sql

# Verify rollback
psql -c "\\d leads" # Check if deleted_at column removed
```

**Migration Rollback Order:**
- Always rollback in reverse order
- Example: Phase 5 → Phase 4 → Phase 3

**Available Rollback Files:**
- `20260213_critical_security_fixes.down.sql`
- `20260213_fix_rls_auth_patterns.down.sql`
- `20260213_balance_audit_function.down.sql`
- `20260213_webhook_idempotency.down.sql`
- `20260213_additional_indexes.down.sql`
- `20260213_payout_totals_function.down.sql`
- `20260213_partner_earnings_view.down.sql`
- `20260213_saved_filters.down.sql`
- `20260213_soft_delete.down.sql`

---

## Monitoring

### Vercel Analytics

**Dashboard Metrics:**
- **Response Time:** Target <500ms
- **Error Rate:** Target <0.1%
- **Bandwidth:** Monitor for spikes

**Alerts:**
- Error rate > 1% → Slack notification
- Response time > 2s → Email alert

### Supabase Monitoring

**Database Performance:**
```sql
-- Slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan < 100
ORDER BY idx_scan;

-- Table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Connection Pooling:**
- Monitor active connections: `SELECT count(*) FROM pg_stat_activity;`
- Max connections: 100 (Supabase Pro plan)

### Inngest Monitoring

**Dashboard → Functions → Metrics:**
- **Success Rate:** Target >99%
- **Execution Time:** Target <30s
- **Failure Alerts:** Email on 3+ consecutive failures

### Custom Health Checks

**Endpoint:** `/api/health`

```typescript
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    stripe: await checkStripe(),
    inngest: await checkInngest()
  }

  const healthy = Object.values(checks).every(c => c.status === 'ok')

  return NextResponse.json(
    { healthy, checks },
    { status: healthy ? 200 : 503 }
  )
}
```

**Uptime Monitoring:**
- Use [UptimeRobot](https://uptimerobot.com/) or [Better Uptime](https://betteruptime.com/)
- Check `/api/health` every 5 minutes
- Alert on >2 consecutive failures

---

## Troubleshooting

### Deployment Fails to Build

**Error:** `Type error: Cannot find module '@/lib/utils'`

**Fix:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

---

### Database Connection Errors

**Error:** `Error: relation "leads" does not exist`

**Fix:**
```bash
# Verify migrations applied
supabase migration list

# Manually push migrations
supabase db push

# Check RLS policies
psql -c "SELECT tablename, policyname FROM pg_policies WHERE tablename = 'leads';"
```

---

### Webhook Processing Failures

**Error:** Stripe webhook returns 400

**Fix:**
```bash
# Verify webhook secret in Vercel env vars
vercel env ls

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check webhook event logs (Phase 3)
psql -c "SELECT * FROM webhook_events WHERE error_message IS NOT NULL ORDER BY created_at DESC LIMIT 10;"

# Retry failed webhook via Admin API (Phase 5)
curl -X POST https://leads.meetcursive.com/api/admin/webhooks/:id/retry
```

---

### Rate Limiting Issues

**Error:** `429 Too Many Requests`

**Check rate limit status:**
```sql
SELECT * FROM rate_limits
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 10;
```

**Reset rate limit (emergency):**
```sql
DELETE FROM rate_limits WHERE user_id = 'xxx';
```

**Note:** Phase 1 improved rate limiter to fail closed on errors - verify database connection if seeing unexpected 429s.

---

### Performance Degradation

**Symptoms:**
- Dashboard loads >2s
- Marketplace queries timeout
- Earnings page slow

**Diagnosis:**
```bash
# Check slow queries
psql -c "SELECT query, mean_exec_time FROM pg_stat_statements WHERE mean_exec_time > 100 ORDER BY mean_exec_time DESC LIMIT 20;"

# Verify indexes exist (Phase 4)
psql -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;"

# Refresh materialized views (Phase 4)
psql -c "REFRESH MATERIALIZED VIEW CONCURRENTLY partner_earnings_summary;"
```

**Fix:**
```bash
# Apply Phase 4 performance indexes if missing
supabase db push

# Verify Inngest hourly refresh job running
# Check Inngest dashboard for "refresh-earnings-view" function
```

---

### Soft Delete Issues (Phase 5)

**Symptoms:**
- Deleted leads still visible
- RLS policy errors

**Diagnosis:**
```sql
-- Check if soft delete columns exist
\\d leads

-- Check RLS policies filter deleted_at
SELECT policyname, qual FROM pg_policies WHERE tablename = 'leads';

-- Count soft-deleted leads
SELECT COUNT(*) FROM leads WHERE deleted_at IS NOT NULL;
```

**Fix:**
```bash
# Verify Phase 5 migration applied
supabase migration list

# Apply soft delete migration
psql -f supabase/migrations/20260213_soft_delete.sql

# Test soft delete
curl -X DELETE https://leads.meetcursive.com/api/leads/:id
```

---

## Security Checklist

Before each deployment:

- ✅ No hardcoded secrets in code
- ✅ All environment variables set in Vercel
- ✅ HTTPS enforced (Vercel does this automatically)
- ✅ CORS configured correctly
- ✅ Rate limiting active
- ✅ RLS policies enabled on all tables
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React escapes by default)
- ✅ CSV injection sanitization (Phase 3)

---

## Backup & Recovery

### Automated Backups

**Supabase:**
- Daily automated backups (retained 7 days on Pro plan)
- Point-in-time recovery available

**Vercel:**
- All deployments retained indefinitely
- Instant rollback to any previous deployment

### Manual Backup

```bash
# Backup database
pg_dump -h db.xxx.supabase.co -U postgres cursive > backup-$(date +%Y%m%d).sql

# Backup to S3 (recommended for production)
pg_dump -h db.xxx.supabase.co -U postgres cursive | gzip | aws s3 cp - s3://cursive-backups/backup-$(date +%Y%m%d).sql.gz
```

### Restore from Backup

```bash
# Restore from file
psql -h db.xxx.supabase.co -U postgres cursive < backup-20260213.sql

# Restore from S3
aws s3 cp s3://cursive-backups/backup-20260213.sql.gz - | gunzip | psql -h db.xxx.supabase.co -U postgres cursive
```

---

## Continuous Integration

### GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm typecheck

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Performance Targets

| Metric | Target | Current (Post-Phase 4) |
|--------|--------|------------------------|
| Homepage Load | <1s | 400ms ✅ |
| Dashboard Load | <1s | 500ms ✅ |
| Marketplace Query | <500ms | 350ms ✅ |
| Partner Earnings | <500ms | 50ms ✅ (materialized view) |
| Admin Payouts | <1s | 200ms ✅ (SQL aggregation) |
| API Response (p95) | <500ms | 450ms ✅ |
| Database Query (p95) | <100ms | 80ms ✅ |

---

## Support

**Issues:** https://github.com/adamwolfe2/cursive/issues
**Email:** devops@meetcursive.com
**Slack:** #cursive-deployments

---

## Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

**Last Updated:** 2026-02-13 (Phase 6)
