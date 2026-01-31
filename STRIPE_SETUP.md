# Stripe Setup Guide

This guide explains how to configure Stripe for the Cursive platform.

## Prerequisites

1. Stripe account (live or test mode)
2. Database migrations applied (Phase 4 complete)
3. Environment variables configured in Vercel

## Step 1: Create Products in Stripe

1. Go to Stripe Dashboard → **Products**
2. Create 3 products (Free plan doesn't need Stripe product):

### Starter Plan
- **Name**: "Cursive Starter"
- **Description**: "Perfect for small businesses"
- **Pricing**:
  - Monthly: $49.00 USD (recurring)
  - Yearly: $470.00 USD (recurring, save ~20%)

### Pro Plan
- **Name**: "Cursive Pro"
- **Description**: "Best for growing businesses"
- **Pricing**:
  - Monthly: $149.00 USD (recurring)
  - Yearly: $1,430.00 USD (recurring, save ~20%)

### Enterprise Plan
- **Name**: "Cursive Enterprise"
- **Description**: "For large organizations"
- **Pricing**:
  - Monthly: $499.00 USD (recurring)
  - Yearly: $4,790.00 USD (recurring, save ~20%)

## Step 2: Copy Price IDs

After creating each product and price, Stripe will generate a **Price ID** (starts with `price_`).

Copy these 6 Price IDs:
- `price_starter_monthly` - Starter monthly price ID
- `price_starter_yearly` - Starter yearly price ID
- `price_pro_monthly` - Pro monthly price ID
- `price_pro_yearly` - Pro yearly price ID
- `price_enterprise_monthly` - Enterprise monthly price ID
- `price_enterprise_yearly` - Enterprise yearly price ID

## Step 3: Update Database

Connect to your Supabase database and run these SQL commands to populate the price IDs:

```sql
-- Update Starter plan price IDs
UPDATE subscription_plans
SET
  stripe_price_id_monthly = 'price_starter_monthly_REPLACE_ME',
  stripe_price_id_yearly = 'price_starter_yearly_REPLACE_ME'
WHERE name = 'starter';

-- Update Pro plan price IDs
UPDATE subscription_plans
SET
  stripe_price_id_monthly = 'price_pro_monthly_REPLACE_ME',
  stripe_price_id_yearly = 'price_pro_yearly_REPLACE_ME'
WHERE name = 'pro';

-- Update Enterprise plan price IDs
UPDATE subscription_plans
SET
  stripe_price_id_monthly = 'price_enterprise_monthly_REPLACE_ME',
  stripe_price_id_yearly = 'price_enterprise_yearly_REPLACE_ME'
WHERE name = 'enterprise';
```

**Replace** `_REPLACE_ME` with your actual Stripe Price IDs from Step 2.

## Step 4: Configure Webhooks

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Configure endpoint:
   - **Endpoint URL**: `https://app.meetcursive.com/api/webhooks/stripe`
   - **Events to listen for**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `charge.refunded`

4. Save endpoint and copy the **Signing secret** (starts with `whsec_`)

## Step 5: Set Environment Variables

Add these to Vercel (already done per user):

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_... # or sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_...

# Webhook Secret (from Step 4)
STRIPE_WEBHOOK_SECRET=whsec_...

# Legacy Price IDs (optional - used for fallback)
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly_...
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_...
```

## Step 6: Enable Stripe Connect (for Partner Payouts)

1. Go to Stripe Dashboard → **Settings** → **Connect**
2. Enable **Express accounts** or **Standard accounts**
3. Copy your **Connect client ID** (starts with `ca_`)
4. Add to environment variables:

```bash
STRIPE_CONNECT_CLIENT_ID=ca_...
```

## Step 7: Test Checkout Flow

1. Visit `/pricing` page
2. Click "Upgrade to Starter" (or any paid plan)
3. Complete test payment using Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`
   - Requires 3D Secure: `4000 0025 0000 3155`

4. Verify in database:
   - `workspaces.stripe_customer_id` populated
   - `subscriptions` table has new record
   - `workspaces.plan` updated to new plan name

## Verification Checklist

- [ ] All 6 price IDs configured in `subscription_plans` table
- [ ] Webhook endpoint configured with correct URL
- [ ] Webhook secret stored in `STRIPE_WEBHOOK_SECRET`
- [ ] Test checkout completes successfully
- [ ] Webhook events received and processed (check Stripe Dashboard → Webhooks)
- [ ] Subscription created in database
- [ ] User can access Pro features after upgrade

## Troubleshooting

### "Stripe Price ID not configured"
- Check that price IDs are populated in `subscription_plans` table
- Verify price IDs start with `price_` prefix
- Ensure price IDs match your Stripe account mode (test vs live)

### Webhook events not processing
- Check webhook URL is correct
- Verify webhook secret matches `STRIPE_WEBHOOK_SECRET` env var
- Check API route logs for errors
- Use Stripe CLI to test locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Payment succeeds but subscription not created
- Check webhook handler logs
- Verify `checkout.session.completed` event includes `metadata.type = 'subscription'`
- Ensure `customer.subscription.created` event can find workspace by `stripe_customer_id`

## Production Checklist

Before going live:

- [ ] Switch from test mode to live mode in Stripe
- [ ] Update all price IDs to live mode price IDs
- [ ] Update `STRIPE_SECRET_KEY` to live key (starts with `sk_live_`)
- [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live key (starts with `pk_live_`)
- [ ] Reconfigure webhook endpoint with live mode URL
- [ ] Update `STRIPE_WEBHOOK_SECRET` to live webhook secret
- [ ] Test checkout with real card in production
- [ ] Monitor webhook events for 24 hours

---

**Last Updated**: 2026-01-30
**Phase**: 5 - Revenue-Critical Flows
