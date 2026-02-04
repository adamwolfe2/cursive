# Services Integration Guide

## Overview

The services system is designed to work with the main Cursive website. The pricing page lives on the website, and checkout happens through direct links to the platform.

## Checkout URLs

Use these URLs from your website's pricing page:

### Cursive Data ($1,000/month)
```
https://leads.meetcursive.com/services/checkout?tier=cursive-data
```

### Cursive Outbound ($2,500/month)
```
https://leads.meetcursive.com/services/checkout?tier=cursive-outbound
```

### Cursive Automated Pipeline ($5,000/month)
```
https://leads.meetcursive.com/services/checkout?tier=cursive-pipeline
```

### Cursive Venture Studio (Custom Pricing - Calendar Booking)
```
https://leads.meetcursive.com/services/checkout?tier=cursive-venture-studio
```

This will redirect to: https://cal.com/adamwolfe/cursive-ai-audit

## User Flow

1. User clicks "Get Started" on pricing page
2. Platform checks if user is logged in
   - If not: Redirects to sign-up with return URL
   - If yes: Continues to checkout
3. Platform checks if user already has a subscription
   - If yes: Redirects to /services/manage
   - If no: Creates Stripe Checkout session
4. User completes payment in Stripe
5. Webhook processes subscription
6. Welcome email sent automatically
7. User redirected to success page

## API Integration (Optional)

For programmatic checkout (e.g., from JavaScript):

```typescript
const response = await fetch('https://leads.meetcursive.com/api/services/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tier_slug: 'cursive-data', // or cursive-outbound, cursive-pipeline
  })
})

const { checkout_url } = await response.json()
window.location.href = checkout_url
```

## Success/Cancel URLs

Default success URL: `/services/success?tier={tier_slug}`
Default cancel URL: `/services`

These can be overridden in the API call:

```json
{
  "tier_slug": "cursive-data",
  "success_url": "https://meetcursive.com/welcome",
  "cancel_url": "https://meetcursive.com/pricing"
}
```

## Environment Variables

Set in the platform's `.env.local`:

```
NEXT_PUBLIC_PRICING_URL=https://meetcursive.com/#pricing
```

This controls where `/services` redirects to.

## Email Notifications

Automatically sent by the platform:

- **Welcome Email**: Sent immediately after subscription creation
- **Payment Success**: Sent on recurring payment success
- **Payment Failed**: Sent when payment fails
- **Cancellation**: Sent when subscription is cancelled
- **Onboarding Reminder**: Sent 3 days after purchase if not completed
- **Renewal Reminder**: Sent 7 days before renewal

All emails sent from: `Adam @ Cursive <send@meetcursive.com>`

## Webhook Events

Stripe webhooks automatically handle:

- `customer.subscription.created` - Creates subscription record, sends welcome email
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Cancels subscription, sends cancellation email
- `invoice.payment_succeeded` - Confirms payment, sends receipt
- `invoice.payment_failed` - Marks pending payment, sends failed notification

## Testing

Test checkout flow:

1. Use Stripe test mode
2. Visit: `https://leads.meetcursive.com/services/checkout?tier=cursive-data`
3. Sign in with test account
4. Use Stripe test card: `4242 4242 4242 4242`
5. Check webhook logs for subscription creation
6. Verify welcome email sent

## Service Management

Users can manage their subscription at:

```
https://leads.meetcursive.com/services/manage
```

Features:
- View current subscription
- Download invoices
- Update payment method
- Cancel subscription
- View delivery history
