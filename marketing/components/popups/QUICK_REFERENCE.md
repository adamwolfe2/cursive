# Popup System - Quick Reference Card

## Installation (1 minute)

```tsx
// app/layout.tsx
import { PopupManager } from '@/components/popups'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <PopupManager /> {/* ← Add this */}
      </body>
    </html>
  )
}
```

## Test

Visit: `http://localhost:3000/popup-test`

## Popup Behavior

| Popup | Trigger | Pages | Frequency |
|-------|---------|-------|-----------|
| Exit Intent | Cursor to top / Scroll up | All except blog | Once/session, 7-day cooldown |
| Blog Scroll | 50% scroll | Blog posts only | Once/session, 30-day cooldown |

## API Endpoints

Configure in `lib/popup-submission.ts`:

```typescript
// Exit Intent & Newsletter
POST /api/leads/capture
POST /api/newsletter/subscribe
POST /api/reports/visitor-report

// Payload
{
  email: string,
  company?: string,
  source: string,
  timestamp: string
}
```

## Common Tasks

### Reset Popups (Testing)
```javascript
// Browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Disable Popups
```tsx
<PopupManager
  enableExitIntent={false}
  enableBlogScroll={false}
/>
```

### Custom Submission Handler
```tsx
<PopupManager
  onExitIntentSubmit={async (data) => {
    await yourAPI.createLead(data)
  }}
/>
```

### Change Copy
Edit directly in component files:
- `components/popups/exit-intent-popup.tsx` (line 103-110)
- `components/popups/blog-scroll-popup.tsx` (line 214-223)

### Change Triggers
```tsx
// Scroll depth
<BlogScrollPopup scrollThreshold={75} /> // 75% instead of 50%

// Exit intent delay
// Edit: hooks/use-exit-intent.ts, line 41
delay: 10000 // 10 seconds instead of 5
```

### Change Frequency
Edit `lib/popup-storage.ts`:
```typescript
// Line 45
shouldShowPopup(
  popupId,
  14,  // cooldown days (was 7)
  2    // max shows/session (was 1)
)
```

## Analytics Events

Tracked automatically:
- `popup_impression` - Popup shown
- `popup_interaction` - Form focused
- `popup_submission` - Form submitted
- `popup_dismiss` - Popup closed
- `conversion` - Lead captured

## Integrations

### HubSpot
```typescript
import { Client } from '@hubspot/api-client'
const hubspot = new Client({ accessToken: process.env.HUBSPOT_API_KEY })

await hubspot.crm.contacts.basicApi.create({
  properties: { email, company, lead_source: 'popup' }
})
```

### Mailchimp
```typescript
import mailchimp from '@mailchimp/mailchimp_marketing'
await mailchimp.lists.addListMember(LIST_ID, {
  email_address: email,
  status: 'subscribed'
})
```

### Resend
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'reports@meetcursive.com',
  to: email,
  subject: 'Your Free Report',
  html: emailTemplate
})
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Popup not showing | Clear localStorage, check page targeting |
| Form not submitting | Check API endpoint, verify network tab |
| Analytics not tracking | Verify `window.gtag` exists |
| Showing too often | Check frequency caps in `popup-storage.ts` |

## A/B Testing

```tsx
const variant = Math.random() < 0.5 ? 'A' : 'B'

<PopupManager>
  {variant === 'A' && <ExitIntentPopup />}
  {variant === 'B' && <ExitIntentPopupVariantB />}
</PopupManager>
```

## Files

```
components/popups/
  ├── exit-intent-popup.tsx           # Main exit intent
  ├── exit-intent-popup-variant-b.tsx # A/B test variant
  ├── blog-scroll-popup.tsx           # Blog scroll
  └── popup-manager.tsx               # Manager

hooks/
  ├── use-exit-intent.ts              # Exit detection
  ├── use-scroll-depth.ts             # Scroll tracking
  └── use-popup-analytics.ts          # Analytics

lib/
  ├── popup-storage.ts                # Storage utils
  └── popup-submission.ts             # Form handlers

app/
  ├── popup-test/page.tsx             # Test page
  └── api/*/route.ts                  # API routes
```

## Performance

- Bundle: ~15KB gzipped
- Lazy loaded
- Passive listeners
- No blocking

## Accessibility

- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Screen reader compatible
- ✅ ARIA labels
- ✅ Focus management
- ✅ Color contrast

## Support

1. Read: `README.md` (full docs)
2. Read: `IMPLEMENTATION.md` (setup guide)
3. Test: `/popup-test`
4. Check: Browser console

---

**Quick Links:**
- Full Docs: `README.md`
- Setup Guide: `IMPLEMENTATION.md`
- Task Summary: `TASK_SUMMARY.md`
- Test Page: `/popup-test`
