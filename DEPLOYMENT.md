# Deployment Guide - OpenInfo Platform

Complete guide for deploying the OpenInfo platform to Vercel with Supabase, Stripe, and all integrations.

## Prerequisites

Before deploying, ensure you have accounts and API keys for:

- ✅ GitHub account
- ✅ Vercel account
- ✅ Supabase project
- ✅ Stripe account
- ✅ DataShopper API key
- ✅ Clay API key
- ✅ Resend API key
- ✅ Inngest account

## Step 1: Supabase Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region closest to your users
3. Set a strong database password
4. Wait for project initialization (~2 minutes)

### Run Database Migrations

Install Supabase CLI:

```bash
npm install -g supabase
```

Link to your project:

```bash
supabase link --project-ref your-project-ref
```

Run all migrations in order:

```bash
cd /path/to/openinfo-platform
supabase db push
```

Verify all 8 migrations were applied:

```bash
supabase db remote check
```

### Enable Required Extensions

In Supabase SQL Editor, run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Get API Keys

Navigate to Project Settings > API:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)

## Step 2: Stripe Setup

### Create Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to Test Mode (toggle in left sidebar)
3. Navigate to Products > Add Product

**Free Product** (for reference only):
- Name: Free Plan
- Description: 3 credits per day, 1 active query
- No prices needed

**Pro Product**:
- Name: Pro Plan
- Description: 1000 credits per day, 5 active queries
- Recurring payment: Monthly $50.00 USD
- Save product

**Pro Yearly Product**:
- Use same Pro Plan product
- Add new price: Recurring payment, Yearly $480.00 USD ($40/month)

### Configure Webhooks

1. Navigate to Developers > Webhooks > Add Endpoint
2. Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click Add Endpoint
5. Reveal webhook signing secret and save it

### Get API Keys

Navigate to Developers > API Keys:

- `STRIPE_SECRET_KEY`: Secret key (sk_test_xxx)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key (pk_test_xxx)
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret (whsec_xxx)
- `STRIPE_PRO_MONTHLY_PRICE_ID`: Pro monthly price ID (from Products page)
- `STRIPE_PRO_YEARLY_PRICE_ID`: Pro yearly price ID (from Products page)

## Step 3: External API Keys

### DataShopper

1. Sign up at [datashopper.com](https://datashopper.com)
2. Navigate to API Settings
3. Generate API key
4. Save `DATASHOPPER_API_KEY`

### Clay

1. Sign up at [clay.com](https://clay.com)
2. Navigate to Settings > API
3. Generate API key
4. Save `CLAY_API_KEY`

### Resend

1. Sign up at [resend.com](https://resend.com)
2. Navigate to API Keys
3. Create new API key
4. Add your domain and verify DNS records
5. Save `RESEND_API_KEY`
6. Set `RESEND_FROM_EMAIL` (e.g., noreply@yourdomain.com)

### Inngest

1. Sign up at [inngest.com](https://inngest.com)
2. Create new app
3. Navigate to Keys
4. Save `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

## Step 4: Vercel Deployment

### Push to GitHub

```bash
git add .
git commit -m "chore: prepare for Vercel deployment"
git push origin main
```

### Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Framework Preset: Next.js (auto-detected)
5. Root Directory: `./` (default)
6. Build Command: `pnpm build` (or leave default)
7. Output Directory: `.next` (default)

### Configure Environment Variables

In Vercel project settings > Environment Variables, add ALL of the following:

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### DataShopper
```
DATASHOPPER_API_KEY=your_datashopper_key
DATASHOPPER_API_URL=https://api.datashopper.com/v1
```

#### Clay
```
CLAY_API_KEY=your_clay_key
CLAY_API_URL=https://api.clay.com/v1
```

#### Stripe
```
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_FREE_PRODUCT_ID=prod_xxx
STRIPE_PRO_PRODUCT_ID=prod_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
```

#### Resend
```
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Inngest
```
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

#### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=OpenInfo
```

#### Optional (Slack Integration)
```
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
REDIS_URL=redis://localhost:6379
```

**Important**: Set environment variables for all environments (Production, Preview, Development)

### Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-5 minutes)
3. Verify deployment at the provided URL

## Step 5: Post-Deployment Configuration

### Update Stripe Webhook URL

1. Go to Stripe Dashboard > Developers > Webhooks
2. Edit your webhook endpoint
3. Update URL to: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Save changes

### Test Stripe Webhook

```bash
stripe listen --forward-to https://your-domain.vercel.app/api/webhooks/stripe
stripe trigger customer.subscription.created
```

Verify webhook received in:
- Stripe Dashboard > Webhooks > Events
- Supabase > Table Editor > billing_events

### Configure Inngest

1. Go to [Inngest Dashboard](https://inngest.com)
2. Navigate to your app
3. Add production environment
4. Set sync URL: `https://your-domain.vercel.app/api/inngest`
5. Sync functions (should auto-discover 7 functions)

Verify functions registered:
- daily-lead-generation
- lead-enrichment
- lead-delivery
- platform-upload
- credit-reset
- weekly-trends
- export-processor

### Test Email Delivery

1. Go to your deployed app
2. Sign up for a test account
3. Check Resend Dashboard > Logs for email delivery
4. Verify email received in inbox

### Configure Custom Domain (Optional)

1. In Vercel project settings > Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Wait for SSL certificate (automatic)

### Enable Preview Deployments

Vercel automatically creates preview deployments for:
- Every PR opened
- Every push to non-main branches

Preview URLs: `https://your-repo-git-branch-yourteam.vercel.app`

## Step 6: Verification Checklist

### Authentication
- [ ] Sign up works
- [ ] Email confirmation received
- [ ] Login works
- [ ] Session persists across refreshes
- [ ] Logout works

### Database
- [ ] Tables visible in Supabase dashboard
- [ ] RLS policies active (check with different users)
- [ ] Migrations all applied
- [ ] Test user can create workspace

### Stripe Integration
- [ ] Pricing page loads
- [ ] Checkout redirects to Stripe
- [ ] Test card (4242 4242 4242 4242) works
- [ ] Webhook fires on subscription creation
- [ ] User plan upgraded in database
- [ ] Customer Portal link works

### Background Jobs
- [ ] Inngest functions synced
- [ ] Cron schedules visible in Inngest
- [ ] Test event triggers function
- [ ] Job history visible in dashboard

### API Endpoints
- [ ] `/api/users/me` returns user data
- [ ] `/api/queries` CRUD operations work
- [ ] `/api/leads` returns leads
- [ ] `/api/people-search` search works
- [ ] `/api/trends` returns trends

### UI/UX
- [ ] Dashboard loads
- [ ] Query wizard completes
- [ ] Leads table displays
- [ ] People search works
- [ ] Trends charts render
- [ ] Settings pages accessible
- [ ] Mobile responsive

## Step 7: Production Readiness

### Switch to Production Mode

#### Stripe

1. Toggle to Live Mode in Stripe Dashboard
2. Create products and prices again in Live Mode
3. Update environment variables in Vercel with Live keys:
   - `STRIPE_SECRET_KEY` (sk_live_xxx)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_xxx)
   - `STRIPE_WEBHOOK_SECRET` (new webhook in Live Mode)
4. Redeploy: `vercel --prod`

#### Supabase

Production is already using live Supabase instance. Ensure:
- RLS policies tested with real users
- Backups configured (Supabase > Database > Backups)
- Connection pooling enabled if needed

#### Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Supabase Logs**: Monitor API calls, errors
3. **Inngest Dashboard**: Monitor job execution, retries
4. **Stripe Dashboard**: Monitor subscriptions, payments

### Security Hardening

1. **Rotate Secrets Regularly**:
   - Change webhook secrets every 90 days
   - Rotate API keys quarterly

2. **Enable Alerts**:
   - Vercel: Deploy failures, runtime errors
   - Supabase: RLS policy violations, high error rates
   - Stripe: Failed payments, disputes

3. **Review Permissions**:
   - Supabase RLS policies
   - Stripe webhook event types
   - Inngest function permissions

### Backup Strategy

1. **Database Backups** (Supabase):
   - Daily automated backups enabled
   - Retention: 7 days (Free), 30 days (Pro)
   - Manual backup before major migrations

2. **Environment Variables**:
   - Export from Vercel and store securely
   - Document in team password manager

3. **Code**:
   - GitHub repository with branches protected
   - Tag releases: `git tag v1.0.0 && git push --tags`

## Troubleshooting

### Build Failures

**Error**: Module not found
```
Solution: Check package.json dependencies
Run: pnpm install
Commit: package-lock changes
```

**Error**: TypeScript errors
```
Solution: Run pnpm typecheck locally first
Fix errors before pushing
```

### Runtime Errors

**Error**: Supabase connection failed
```
Check: Environment variables set correctly
Check: Supabase project not paused
Check: RLS policies not blocking queries
```

**Error**: Stripe webhook 400 error
```
Check: Webhook secret matches
Check: Request body not modified
Check: Signature verification passing
```

**Error**: Inngest functions not syncing
```
Check: /api/inngest route accessible
Check: INNGEST_SIGNING_KEY correct
Run: Manual sync from dashboard
```

### Performance Issues

**Slow API responses**:
- Enable Vercel Edge Functions for critical routes
- Add database indexes (check Supabase > Advisors)
- Enable Supabase connection pooling

**High memory usage**:
- Optimize images with Next.js Image component
- Lazy load heavy components
- Review bundle size with `pnpm build`

## Rollback Procedure

If deployment has critical issues:

1. **Instant Rollback** (Vercel):
   ```
   Deployments tab > Find last working deployment > Promote to Production
   ```

2. **Database Rollback** (if needed):
   ```bash
   # Revert last migration
   supabase db reset --db-url your-db-connection-string
   ```

3. **Notify Users**:
   - Update status page
   - Send notification (if service interrupted)

## Maintenance

### Regular Tasks

**Daily**:
- Check Inngest cron execution
- Monitor error logs (Vercel, Supabase)

**Weekly**:
- Review Stripe subscription metrics
- Check database performance (Supabase Advisors)
- Review user feedback/support tickets

**Monthly**:
- Database cleanup (old exports, logs)
- Review and optimize bundle size
- Update dependencies: `pnpm update`

**Quarterly**:
- Rotate API keys and secrets
- Review and update documentation
- Security audit

## Support

For deployment issues:

- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- GitHub Issues: [github.com/adamwolfe2/leadme/issues](https://github.com/adamwolfe2/leadme/issues)

---

**Last Updated**: 2026-01-22
**Deployment Platform**: Vercel
**Database**: Supabase (PostgreSQL)
**Status**: Production Ready ✅
