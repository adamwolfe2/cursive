# Popup System Implementation Guide

## Quick Start (5 Minutes)

### 1. Add to Root Layout

```tsx
// app/layout.tsx
import { PopupManager } from '@/components/popups'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <PopupManager /> {/* Add this line */}
      </body>
    </html>
  )
}
```

That's it! The popups will now show automatically based on user behavior.

## Testing

Visit: `/popup-test` to test both popups interactively.

## Customization

### Connect to Your API

Edit `/lib/popup-submission.ts`:

```typescript
export async function handlePopupSubmission(data: PopupFormData): Promise<void> {
  // Replace with your actual API endpoint
  const response = await fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) throw new Error('Failed to submit')
}
```

### Change Copy

Edit component files directly:
- `/components/popups/exit-intent-popup.tsx` - Line 103-110 (headline/subheadline)
- `/components/popups/blog-scroll-popup.tsx` - Line 214-223 (headline/subheadline)

### Change Triggers

```tsx
// Different scroll threshold
<BlogScrollPopup scrollThreshold={75} /> // 75% instead of 50%

// Different timing
// Edit: hooks/use-exit-intent.ts, line 41
delay: 10000 // 10 seconds instead of 5
```

### Change Frequency

Edit `/lib/popup-storage.ts`:

```typescript
// Line 45-47
shouldShowPopup(
  popupId,
  14,  // cooldown days (was 7)
  2    // max shows per session (was 1)
)
```

## A/B Testing

### Split Test Setup

```tsx
// app/layout.tsx
import { ExitIntentPopup } from '@/components/popups/exit-intent-popup'
import { ExitIntentPopupVariantB } from '@/components/popups/exit-intent-popup-variant-b'

export default function RootLayout({ children }) {
  // Simple random split
  const variant = Math.random() < 0.5 ? 'A' : 'B'

  return (
    <html>
      <body>
        {children}
        {variant === 'A' && <ExitIntentPopup />}
        {variant === 'B' && <ExitIntentPopupVariantB />}
      </body>
    </html>
  )
}
```

### Variant Differences

**Variant A (Original):**
- Headline: "Wait! See How Cursive Identifies 70% of Your Website Visitors"
- CTA: "Get My Free Report"
- No social proof badge

**Variant B (Alternative):**
- Headline: "Don't Leave Without Your Free Visitor Report"
- CTA: "Send Me My Free Report Now"
- Social proof badge: "Join 2,400+ companies using Cursive"
- More urgency-focused copy

## Integration Examples

### HubSpot

```typescript
// lib/popup-submission.ts
import { Client } from '@hubspot/api-client'

const hubspot = new Client({ accessToken: process.env.HUBSPOT_API_KEY })

export async function handlePopupSubmission(data: PopupFormData): Promise<void> {
  await hubspot.crm.contacts.basicApi.create({
    properties: {
      email: data.email,
      company: data.company,
      lead_source: 'exit_intent_popup',
    },
  })
}
```

### Mailchimp

```typescript
// lib/popup-submission.ts
import mailchimp from '@mailchimp/mailchimp_marketing'

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
})

export async function handleNewsletterSubscription(email: string): Promise<void> {
  await mailchimp.lists.addListMember(process.env.MAILCHIMP_LIST_ID, {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      SOURCE: 'blog_scroll_popup',
    },
  })
}
```

### Resend (Email)

```typescript
// lib/popup-submission.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function handleVisitorReportRequest(
  data: { email: string; company?: string }
): Promise<void> {
  await resend.emails.send({
    from: 'reports@meetcursive.com',
    to: data.email,
    subject: 'Your Free Website Visitor Report',
    html: generateReportEmail(data),
  })
}
```

### Slack Notification

```typescript
// lib/popup-submission.ts
export async function handlePopupSubmission(data: PopupFormData): Promise<void> {
  // Save to database first
  await saveToDatabase(data)

  // Notify team in Slack
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🎉 New lead from popup: ${data.email} (${data.company || 'No company'})`,
    }),
  })
}
```

## Analytics Setup

### Google Analytics 4

Already configured! Events are tracked automatically if `window.gtag` exists.

Events tracked:
- `popup_impression`
- `popup_interaction`
- `popup_submission`
- `popup_dismiss`
- `conversion`

### PostHog

```typescript
// hooks/use-popup-analytics.ts
import posthog from 'posthog-js'

const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, {
    popup_id: popupId,
    popup_variant: variant,
    ...properties,
  })
}
```

### Custom Analytics

```typescript
// hooks/use-popup-analytics.ts
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: eventName, properties }),
  })
}
```

## Production Checklist

Before deploying to production:

- [ ] API endpoints are configured and working
- [ ] Analytics tracking is verified
- [ ] Privacy policy link is correct
- [ ] Email service is configured (Resend, SendGrid, etc.)
- [ ] CRM integration is tested
- [ ] Mobile experience is tested on real devices
- [ ] Frequency caps are set appropriately
- [ ] Copy has been reviewed and approved
- [ ] Forms are validated properly
- [ ] Error handling is in place
- [ ] Success messages are clear
- [ ] Accessibility has been tested (keyboard, screen readers)
- [ ] Page targeting rules are correct
- [ ] GDPR compliance is verified

## Performance Optimization

Already optimized:
- Lazy loaded (only loads when needed)
- Minimal bundle size (~15KB gzipped)
- Passive scroll listeners
- No render blocking
- Debounced event handlers

## Troubleshooting

### Popup not showing?

1. Check localStorage: Open DevTools > Application > Local Storage
2. Look for: `cursive_popup_exit-intent-visitor-report`
3. Delete it and refresh
4. Or use the test page: `/popup-test`

### Form not submitting?

1. Check browser console for errors
2. Verify API endpoint exists and is working
3. Check network tab for failed requests
4. Test with the test page first

### Analytics not tracking?

1. Verify `window.gtag` exists (check console)
2. Check Google Analytics debug view
3. Look for events in real-time view
4. Check console logs in development mode

## Support

For questions or issues:
1. Read the README.md
2. Check this implementation guide
3. Review component source code
4. Test with `/popup-test` page

## File Structure

```
marketing/
├── components/
│   └── popups/
│       ├── exit-intent-popup.tsx          # Main exit intent popup
│       ├── exit-intent-popup-variant-b.tsx # A/B test variant
│       ├── blog-scroll-popup.tsx          # Blog scroll popup
│       ├── popup-manager.tsx              # Central control
│       ├── index.ts                       # Exports
│       ├── README.md                      # Full documentation
│       └── IMPLEMENTATION.md              # This file
├── hooks/
│   ├── use-exit-intent.ts                 # Exit intent detection
│   ├── use-scroll-depth.ts                # Scroll depth tracking
│   └── use-popup-analytics.ts             # Analytics tracking
├── lib/
│   ├── popup-types.ts                     # TypeScript types
│   ├── popup-storage.ts                   # LocalStorage management
│   └── popup-submission.ts                # Form submission handlers
└── app/
    ├── popup-test/
    │   └── page.tsx                       # Test page
    └── api/
        ├── leads/capture/route.ts         # Lead capture endpoint
        ├── newsletter/subscribe/route.ts  # Newsletter endpoint
        └── reports/visitor-report/route.ts # Report endpoint
```

## Next Steps

1. Add PopupManager to your layout
2. Test on `/popup-test`
3. Configure API endpoints
4. Verify analytics tracking
5. Test on mobile devices
6. Deploy to production
7. Monitor conversion rates
8. A/B test variations

---

Built with conversion optimization and user experience best practices.
