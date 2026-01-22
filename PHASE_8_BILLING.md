# Phase 8: Billing Integration Documentation

## Overview

The Billing Integration implements Stripe subscriptions with two plans (Free and Pro), webhook handling for subscription lifecycle events, and enforcement of plan limits throughout the application.

## Plans

### Free Plan ($0/month)
- 3 credits per day
- 1 active query
- 5 saved searches maximum
- 100 row CSV export limit
- Email delivery only
- Basic support

### Pro Plan ($50/month)
- 1000 credits per day
- 5 active queries
- 50 saved searches maximum
- 10,000 row CSV export limit
- Multi-channel delivery (Email, Slack, Webhooks)
- Priority support
- API access
- Advanced filters

## Architecture

### Stripe Integration Flow

```
User clicks "Upgrade to Pro"
    ↓
POST /api/billing/checkout
    ↓
Create Stripe Checkout Session
    → customer_email: user.email
    → metadata: { user_id, workspace_id }
    → success_url: /dashboard?checkout=success
    → cancel_url: /pricing?checkout=cancelled
    ↓
Redirect to Stripe Checkout
    ↓
User completes payment
    ↓
Stripe sends webhook: customer.subscription.created
    ↓
POST /api/webhooks/stripe
    → Verify signature
    → Process event
    ↓
Update users table:
    → plan = 'pro'
    → stripe_customer_id
    → stripe_subscription_id
    → subscription_status = 'active'
    → subscription_period_start
    → subscription_period_end
    ↓
Log to billing_events table
    ↓
Redirect to /dashboard?checkout=success
    ↓
User now has Pro access
```

## Files Structure

```
src/
├── lib/stripe/
│   ├── client.ts                   # Stripe client + helper functions
│   └── webhooks.ts                 # Webhook event handlers
├── app/api/
│   ├── billing/
│   │   ├── checkout/route.ts       # Create checkout session
│   │   └── portal/route.ts         # Create portal session
│   └── webhooks/stripe/route.ts    # Stripe webhook endpoint
├── app/(dashboard)/
│   ├── pricing/page.tsx            # Pricing page with plans
│   └── settings/billing/page.tsx   # Billing management
└── components/billing/
    └── upgrade-button.tsx          # Stripe checkout button
```

## Stripe Client (`src/lib/stripe/client.ts`)

### Initialization

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})
```

### Product and Price IDs

Set these environment variables:

```bash
STRIPE_FREE_PRODUCT_ID=prod_xxx
STRIPE_PRO_PRODUCT_ID=prod_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
```

### Plan Configurations

```typescript
export const PLAN_CONFIGS = {
  free: {
    name: 'Free',
    price: 0,
    features: [...],
    limits: {
      daily_credits: 3,
      max_queries: 1,
      max_saved_searches: 5,
      export_limit: 100,
    },
  },
  pro: {
    name: 'Pro',
    price: 50,
    features: [...],
    limits: {
      daily_credits: 1000,
      max_queries: 5,
      max_saved_searches: 50,
      export_limit: 10000,
    },
  },
}
```

### Key Functions

**createCheckoutSession()**
- Creates Stripe Checkout session for Pro subscription
- Accepts user ID, email, workspace ID, price ID, URLs
- Returns session with redirect URL

**createPortalSession()**
- Creates Stripe Customer Portal session for subscription management
- User can update payment method, cancel subscription, view invoices
- Returns portal URL

**getSubscription()**
- Retrieves subscription details by ID
- Returns full Stripe Subscription object

**cancelSubscription()**
- Cancels subscription at end of billing period
- Sets `cancel_at_period_end: true`

**resumeSubscription()**
- Resumes a cancelled subscription
- Sets `cancel_at_period_end: false`

**getPlanConfig()**
- Returns plan configuration for 'free' or 'pro'

**hasExceededLimit()**
- Checks if user has exceeded specific plan limit
- Returns boolean

## Webhook Handlers (`src/lib/stripe/webhooks.ts`)

### Event Handlers

#### handleSubscriptionCreated()
Triggered when: User completes checkout and subscription is created

Actions:
1. Extract user_id and workspace_id from metadata
2. Update users table:
   - plan = 'pro'
   - stripe_customer_id
   - stripe_subscription_id
   - subscription_status = 'active'
   - subscription_period_start
   - subscription_period_end
3. Log to billing_events table (event_type: 'subscription_created')

#### handleSubscriptionUpdated()
Triggered when: Subscription status changes, renewal, cancellation scheduled

Actions:
1. Determine plan based on subscription status
   - If status is 'canceled', 'unpaid', or cancel_at_period_end = true → plan = 'free'
   - Otherwise → plan = 'pro'
2. Update users table with new subscription details
3. Log to billing_events table (event_type: 'subscription_updated')

#### handleSubscriptionDeleted()
Triggered when: Subscription is permanently cancelled/deleted

Actions:
1. Downgrade user to free plan
2. Clear stripe_subscription_id
3. Set subscription_status = 'canceled'
4. Log to billing_events table (event_type: 'subscription_deleted')

#### handleInvoicePaymentSucceeded()
Triggered when: Monthly/yearly invoice payment succeeds

Actions:
1. Find workspace by stripe_subscription_id
2. Log to billing_events table (event_type: 'payment_succeeded')

#### handleInvoicePaymentFailed()
Triggered when: Invoice payment fails

Actions:
1. Find workspace by stripe_subscription_id
2. Log to billing_events table (event_type: 'payment_failed')
3. TODO: Send email notification to user

### processWebhookEvent()
Main webhook processor that routes events to appropriate handlers.

## API Routes

### POST /api/billing/checkout

Create Stripe Checkout session.

**Request Body**:
```json
{
  "billingPeriod": "monthly" | "yearly"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/pay/xxx"
}
```

**Response (Error - Already Subscribed)**:
```json
{
  "error": "You already have an active Pro subscription"
}
```

**Behavior**:
1. Check authentication
2. Check if user already has active Pro subscription
3. Determine price ID based on billing period
4. Create Stripe Checkout session with user metadata
5. Return session URL for redirect

### POST /api/billing/portal

Create Stripe Customer Portal session for subscription management.

**Request Body**: None (uses current user's stripe_customer_id)

**Response (Success)**:
```json
{
  "success": true,
  "url": "https://billing.stripe.com/session/xxx"
}
```

**Response (Error - No Subscription)**:
```json
{
  "error": "No active subscription found"
}
```

**Behavior**:
1. Check authentication
2. Check if user has stripe_customer_id
3. Create portal session with return URL
4. Return portal URL for redirect

### POST /api/webhooks/stripe

Process Stripe webhook events.

**Headers Required**:
- `stripe-signature`: Webhook signature for verification

**Request Body**: Raw Stripe event JSON

**Response (Success)**:
```json
{
  "received": true,
  "event_type": "customer.subscription.created"
}
```

**Response (Error - Invalid Signature)**:
```json
{
  "error": "Webhook signature verification failed: xxx"
}
```

**Security**:
- Verifies webhook signature using STRIPE_WEBHOOK_SECRET
- Rejects requests with invalid or missing signatures
- Prevents replay attacks

## Database Schema

### Users Table (Added Fields)

```sql
ALTER TABLE users
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN subscription_status TEXT,
ADD COLUMN subscription_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
```

**Subscription Statuses** (from Stripe):
- `active` - Subscription is active and paid
- `trialing` - In trial period
- `past_due` - Payment failed, retrying
- `canceled` - Subscription cancelled
- `unpaid` - Payment failed, subscription suspended
- `incomplete` - Initial payment not completed

### Billing Events Table (Updated)

```sql
ALTER TABLE billing_events
ADD COLUMN stripe_event_id TEXT,
ADD COLUMN amount INTEGER DEFAULT 0,
ADD COLUMN currency TEXT DEFAULT 'usd',
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
```

**Event Types**:
- `subscription_created` - New subscription created
- `subscription_updated` - Subscription status changed
- `subscription_deleted` - Subscription cancelled/deleted
- `payment_succeeded` - Invoice payment succeeded
- `payment_failed` - Invoice payment failed

### Database Functions

#### get_user_plan_limits(p_user_id UUID)
Returns JSONB with plan limits for user.

```sql
SELECT get_user_plan_limits('user-id');
-- Returns: { "daily_credits": 1000, "max_queries": 5, ... }
```

#### can_create_query(p_user_id UUID)
Returns BOOLEAN indicating if user can create another query.

```sql
SELECT can_create_query('user-id');
-- Returns: true or false
```

#### can_create_saved_search(p_user_id UUID)
Returns BOOLEAN indicating if user can create another saved search.

```sql
SELECT can_create_saved_search('user-id');
-- Returns: true or false
```

#### get_billing_summary(p_workspace_id UUID)
Returns JSONB with billing summary for workspace.

```sql
SELECT get_billing_summary('workspace-id');
-- Returns: {
--   "total_spent": 150000,
--   "payment_count": 3,
--   "last_payment": "2026-01-15T10:00:00Z"
-- }
```

### Database Views

#### active_subscriptions
View of all active subscriptions with user and workspace info.

```sql
SELECT * FROM active_subscriptions;
```

#### recent_billing_events
View of last 100 billing events.

```sql
SELECT * FROM recent_billing_events;
```

## UI Components

### Pricing Page (`/pricing`)

**Features**:
- Monthly/Yearly toggle (20% savings on yearly)
- Two plan cards (Free and Pro)
- Feature comparison
- "Upgrade to Pro" buttons
- FAQ section
- Success/cancelled checkout notifications

**Responsive Design**:
- Mobile: Stacked cards
- Tablet/Desktop: Side-by-side cards
- Popular badge on Pro plan

### Billing Settings Page (`/settings/billing`)

**Sections**:

1. **Current Plan Card**:
   - Plan name and price
   - Renewal/cancellation date
   - Subscription status badge
   - Plan features list
   - "Manage Subscription" button (opens Stripe Portal)

2. **Usage Card**:
   - Daily credits progress bar
   - Active queries count
   - Credits remaining vs limit

3. **Upgrade CTA** (Free users only):
   - Gradient background
   - Pro plan benefits
   - Upgrade button

4. **Billing Information Card**:
   - Link to update payment method (Stripe Portal)

### Upgrade Button Component

**Props**:
- `billingPeriod`: 'monthly' | 'yearly'
- `className`: Optional CSS classes
- `variant`: 'primary' | 'secondary'

**States**:
- Default: "Upgrade to Pro"
- Loading: Spinner + "Loading..."
- Disabled: When already Pro

**Behavior**:
1. Calls POST /api/billing/checkout
2. Receives Stripe Checkout URL
3. Redirects to Stripe Checkout page

## Plan Limit Enforcement

### Query Creation Limit

**Check before creating query**:

```typescript
const { data: canCreate } = await supabase.rpc('can_create_query', {
  p_user_id: user.id,
})

if (!canCreate) {
  return 'You have reached your query limit. Upgrade to Pro for 5 queries.'
}
```

**Free Plan**: 1 active query
**Pro Plan**: 5 active queries

### Saved Search Limit

**Check before saving search**:

```typescript
const { data: canCreate } = await supabase.rpc('can_create_saved_search', {
  p_user_id: user.id,
})

if (!canCreate) {
  return 'You have reached your saved search limit. Upgrade to Pro for 50 searches.'
}
```

**Free Plan**: 5 saved searches
**Pro Plan**: 50 saved searches

### Daily Credits Limit

**Check before revealing email**:

```typescript
const user = await getCurrentUser()
const creditsRemaining = user.daily_credit_limit - user.daily_credits_used

if (creditsRemaining < 1) {
  return 'You have used all your daily credits. Upgrade to Pro or wait for reset.'
}
```

**Free Plan**: 3 credits/day
**Pro Plan**: 1000 credits/day

### Export Limit

**Check before CSV export**:

```typescript
const user = await getCurrentUser()
const exportLimit = PLAN_CONFIGS[user.plan].limits.export_limit

if (rowCount > exportLimit) {
  return `Export limited to ${exportLimit} rows on ${user.plan} plan.`
}
```

**Free Plan**: 100 rows
**Pro Plan**: 10,000 rows

## Environment Variables

Required environment variables for Stripe integration:

```bash
# Stripe API Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Stripe Webhook Secret (from Stripe Webhook settings)
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Product IDs (create in Stripe Dashboard)
STRIPE_FREE_PRODUCT_ID=prod_xxx
STRIPE_PRO_PRODUCT_ID=prod_xxx

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
```

## Stripe Dashboard Setup

### 1. Create Products

**Free Product**:
- Name: "Free Plan"
- Description: "3 credits per day, 1 active query"
- Active: Yes
- (No prices needed)

**Pro Product**:
- Name: "Pro Plan"
- Description: "1000 credits per day, 5 active queries"
- Active: Yes

### 2. Create Prices

**Pro Monthly Price**:
- Product: Pro Plan
- Pricing Model: Recurring
- Price: $50.00 USD
- Billing Period: Monthly
- Currency: USD

**Pro Yearly Price**:
- Product: Pro Plan
- Pricing Model: Recurring
- Price: $480.00 USD ($40/month)
- Billing Period: Yearly
- Currency: USD

### 3. Configure Webhooks

**Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`

**Events to send**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Testing**:
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Send test events: `stripe trigger customer.subscription.created`

### 4. Enable Customer Portal

**Settings > Billing > Customer Portal**:
- Enable portal
- Configure allowed actions:
  - Update payment method: ✅
  - Cancel subscription: ✅
  - View invoices: ✅
  - Update billing details: ✅
- Set business information
- Customize branding (optional)

## Testing Checklist

- [ ] Checkout flow creates Stripe session
- [ ] Redirect to Stripe Checkout works
- [ ] Payment form displays correctly
- [ ] Test card completes payment (4242 4242 4242 4242)
- [ ] Webhook received after payment
- [ ] User plan updated to 'pro' in database
- [ ] Subscription fields populated correctly
- [ ] Billing event logged
- [ ] Redirect to success page works
- [ ] Success notification displays
- [ ] Credits limit increased to 1000
- [ ] Query limit increased to 5
- [ ] Billing settings page shows Pro status
- [ ] "Manage Subscription" button works
- [ ] Customer Portal opens correctly
- [ ] Can update payment method
- [ ] Can cancel subscription
- [ ] Cancellation webhook received
- [ ] User downgraded to free at period end
- [ ] Invoice payment webhooks logged
- [ ] Yearly plan checkout works
- [ ] Plan toggle switches prices correctly
- [ ] Already-subscribed users see error

## Security Considerations

### 1. Webhook Signature Verification

**Critical**: ALWAYS verify webhook signatures to prevent:
- Malicious actors sending fake webhook events
- Unauthorized subscription upgrades
- Data manipulation

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

### 2. Metadata Validation

**Always include and validate**:
- `user_id` in subscription metadata
- `workspace_id` in subscription metadata

Prevents:
- Orphaned subscriptions
- Cross-workspace subscription abuse

### 3. Plan Limit Enforcement

**Enforce limits at multiple layers**:
1. Database functions (can_create_query, etc.)
2. API route validation
3. UI button states

Prevents:
- Users bypassing limits via API calls
- Race conditions

### 4. Idempotency

**Stripe events can be sent multiple times**:
- Use `stripe_event_id` unique constraint in billing_events
- Webhook processing should be idempotent
- Check subscription status before updating

### 5. PCI Compliance

**We are PCI compliant because**:
- Stripe Checkout handles all payment information
- No credit card data touches our servers
- No card storage in our database

## Error Handling

### Checkout Errors

**Scenario**: User already has active subscription
```typescript
if (user.plan === 'pro' && user.subscription_status === 'active') {
  return { error: 'You already have an active Pro subscription' }
}
```

**Scenario**: Stripe API error
```typescript
try {
  const session = await createCheckoutSession(...)
} catch (error) {
  console.error('Stripe error:', error)
  return { error: 'Failed to create checkout session' }
}
```

### Webhook Errors

**Scenario**: Missing metadata
```typescript
if (!subscription.metadata.user_id || !subscription.metadata.workspace_id) {
  throw new Error('Missing required metadata')
}
```

**Scenario**: Database update fails
```typescript
const { error } = await supabase.from('users').update(...)
if (error) {
  throw new Error(`Failed to update user: ${error.message}`)
}
```

### Portal Errors

**Scenario**: No stripe_customer_id
```typescript
if (!user.stripe_customer_id) {
  return { error: 'No active subscription found' }
}
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Subscription Events**:
   - Subscriptions created per day
   - Subscriptions cancelled per day
   - Churn rate

2. **Payment Failures**:
   - Failed payment count
   - Payment retry success rate
   - Past due subscriptions

3. **Revenue**:
   - Monthly Recurring Revenue (MRR)
   - Average Revenue Per User (ARPU)
   - Lifetime Value (LTV)

### Webhook Monitoring

**Log all webhook events**:
```typescript
console.log(`[Stripe Webhook] Received event: ${event.type}`)
```

**Alert on failures**:
- Webhook signature verification failures
- Database update failures
- Missing metadata errors

### Sentry Integration (Future)

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  await processWebhookEvent(event)
} catch (error) {
  Sentry.captureException(error, {
    tags: { event_type: event.type },
    contexts: { stripe_event: event },
  })
  throw error
}
```

## Customer Support Scenarios

### "I cancelled but was still charged"

**Check**:
1. Subscription cancelled at period end? (cancel_at_period_end)
2. Cancellation date vs charge date
3. Prorated charges for partial month

**Resolution**:
- Explain cancellation happens at period end
- Show subscription_period_end date
- Issue refund if error (via Stripe Dashboard)

### "I upgraded but still see Free plan"

**Check**:
1. Webhook received and processed?
2. User plan field in database
3. Stripe subscription status

**Resolution**:
- Check webhook logs in Stripe Dashboard
- Manually trigger webhook resend if needed
- Update user plan manually if webhook failed

### "My payment failed"

**Check**:
1. Invoice status in Stripe
2. Payment method on file
3. Retry attempts

**Resolution**:
- Direct to Customer Portal to update payment method
- Explain grace period before subscription cancellation
- Provide support email for payment issues

## Next Steps (Future Enhancements)

1. **Annual discount code**: AUTO20 for 20% off yearly plans
2. **Team plans**: Multi-user workspaces with user-based pricing
3. **Usage-based billing**: Pay per email reveal instead of daily credits
4. **Enterprise plan**: Custom pricing, contracts, invoicing
5. **Free trial**: 14-day Pro trial for new signups
6. **Referral program**: Give credits for successful referrals
7. **Billing alerts**: Email when payment fails or subscription cancels
8. **Invoice PDF**: Downloadable invoices from billing settings
9. **Payment history**: Table of all past payments
10. **Spending analytics**: Charts of monthly spending trends

---

**Last Updated**: 2026-01-22
**Phase Status**: ✅ Complete
