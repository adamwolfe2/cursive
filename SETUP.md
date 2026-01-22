# Setup Guide

This guide walks through setting up all external services required for the OpenInfo platform.

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Choose a database password (save this securely)
4. Wait for project to be provisioned (~2 minutes)

### Get API Keys
1. Go to Settings > API
2. Copy the following:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Enable Extensions
1. Go to Database > Extensions
2. Enable the following:
   - `uuid-ossp` - For UUID generation
   - `pg_cron` - For scheduled jobs (if needed)

### Configure Auth
1. Go to Authentication > Providers
2. Enable Email provider
3. (Optional) Enable LinkedIn OAuth:
   - Get LinkedIn OAuth credentials
   - Add to Supabase Auth settings
   - Update `.env.local` with LinkedIn settings

### Get Project ID
```bash
# From Supabase Dashboard URL
# https://supabase.com/dashboard/project/YOUR_PROJECT_ID
```

Update `supabase/config.toml` with your project ID.

## 2. Vercel Setup

### Deploy Project
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Configure build settings (auto-detected for Next.js)

### Add Environment Variables
In Vercel project settings, add all variables from `.env.example`:

```bash
# Copy from Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# From other services (configure below)
DATASHOPPER_API_KEY=
CLAY_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App settings
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=OpenInfo
```

## 3. Stripe Setup

### Create Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete business verification

### Get API Keys
1. Go to Developers > API keys
2. Copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

### Create Products
1. Go to Products
2. Create two products:
   - **Free Plan**: $0/month
   - **Pro Plan**: $50/month

### Configure Webhooks
1. Go to Developers > Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## 4. Resend Setup (Email)

### Create Account
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use `onboarding@resend.dev` for testing)

### Get API Key
1. Go to API Keys
2. Create new API key
3. Copy → `RESEND_API_KEY`

### Configure Domain (Production)
1. Go to Domains
2. Add your domain
3. Add DNS records:
   - SPF
   - DKIM
   - DMARC
4. Wait for verification

### Set From Email
```bash
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 5. Inngest Setup

### Create Account
1. Sign up at [inngest.com](https://inngest.com)
2. Create new app

### Get Keys
1. Go to Settings > Keys
2. Copy:
   - Event key → `INNGEST_EVENT_KEY`
   - Signing key → `INNGEST_SIGNING_KEY`

### Register Functions (After Deployment)
1. Deploy your app to Vercel
2. Inngest will auto-discover functions at `/api/inngest`
3. Verify in Inngest dashboard

## 6. DataShopper Setup

### Get API Access
1. Contact DataShopper for API access
2. Get API key → `DATASHOPPER_API_KEY`

### Test Connection
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.datashopper.com/v1/companies?limit=5
```

## 7. Clay Setup

### Get API Access
1. Sign up for Clay API access
2. Get API key → `CLAY_API_KEY`

### Configure Enrichment
Clay will be used for:
- Finding company contacts
- Email verification
- Contact data enrichment

## 8. Local Development Setup

### Install Dependencies
```bash
pnpm install
```

### Configure Environment
```bash
cp .env.example .env.local
# Fill in all values from above
```

### Run Database Migrations
```bash
# After Phase 1 is complete
pnpm supabase db push
```

### Start Development Server
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 9. Test Email Setup (Optional)

For local development, you can use [Mailhog](https://github.com/mailhog/MailHog) or Resend's test mode.

## 10. Custom Domain Setup (Optional)

### Add Custom Domain to Vercel
1. Go to Vercel project settings
2. Add domain (e.g., `app.yourdomain.com`)
3. Configure DNS:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### Update Environment Variables
```bash
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

## Verification Checklist

After setup, verify:

- [ ] Supabase connection works
- [ ] Authentication (email signup/login)
- [ ] Database tables created (after migrations)
- [ ] Stripe checkout works
- [ ] Emails send successfully
- [ ] Inngest functions registered
- [ ] DataShopper API accessible
- [ ] Clay API accessible

## Troubleshooting

### Supabase Connection Issues
- Verify API keys are correct
- Check if RLS policies are enabled
- Ensure user is authenticated

### Stripe Webhook Failures
- Verify webhook secret is correct
- Check endpoint URL is accessible
- Review Stripe webhook logs

### Email Not Sending
- Verify Resend API key
- Check domain verification status
- Review Resend logs

### Inngest Jobs Not Running
- Ensure functions are registered
- Check Inngest dashboard for errors
- Verify event keys are correct

## Support

For issues:
1. Check error logs in Vercel
2. Review Supabase logs
3. Check Inngest dashboard
4. Open GitHub issue

---

**Setup complete!** You're ready to start Phase 1: Database Foundation.
