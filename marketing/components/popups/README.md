# Popup System Documentation

A production-ready, conversion-optimized popup system with exit intent and scroll-based triggers.

## Overview

This popup system includes:

1. **Exit Intent Popup** - Triggers when users attempt to leave the page
2. **Blog Scroll Popup** - Triggers at 50% scroll depth on blog posts
3. **Popup Manager** - Central control for all popups with conflict resolution
4. **Analytics Tracking** - Comprehensive event tracking
5. **Storage Management** - Frequency capping and user preferences

## Features

- Smooth animations with Framer Motion
- Mobile responsive design
- Full keyboard accessibility (Tab, Enter, Escape)
- GDPR-compliant (privacy policy links, no pre-checked opt-ins)
- localStorage-based frequency capping
- Session management
- A/B test ready (easy to swap copy/offers)
- Analytics integration (Google Analytics, PostHog)
- Form validation
- Success/error states
- Minimizable blog popup

## Installation

1. Ensure dependencies are installed:
```bash
pnpm install framer-motion lucide-react
```

2. Import the PopupManager in your root layout:

```tsx
// app/layout.tsx
import { PopupManager } from '@/components/popups'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <PopupManager />
      </body>
    </html>
  )
}
```

## Usage

### Basic Setup

```tsx
import { PopupManager } from '@/components/popups'

// Default configuration (recommended)
<PopupManager />

// Custom configuration
<PopupManager
  enableExitIntent={true}
  enableBlogScroll={true}
  onExitIntentSubmit={async (data) => {
    // Custom submission handler
    await fetch('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }}
/>
```

### Individual Components

You can also use popups individually:

```tsx
import { ExitIntentPopup, BlogScrollPopup } from '@/components/popups'

// Exit Intent only
<ExitIntentPopup
  enabled={true}
  onSubmit={handleSubmit}
/>

// Blog Scroll only
<BlogScrollPopup
  enabled={true}
  scrollThreshold={50} // 50% scroll depth
  onSubmit={handleSubmit}
/>
```

## Popup Behavior

### Exit Intent Popup

**When it shows:**
- User moves cursor toward browser close button (desktop)
- User scrolls up rapidly by 100px+ (mobile fallback)
- Minimum 5 seconds on page before triggering
- Maximum once per session
- 7-day cooldown after dismissal

**What it offers:**
- Free Website Visitor Report
- Shows 20 companies that visited in last 7 days

**Form fields:**
- Email (required)
- Company name (optional)

### Blog Scroll Popup

**When it shows:**
- At 50% scroll depth on blog posts only
- Maximum once per session
- 30-day cooldown after dismissal (longer for newsletter)

**What it offers:**
- Newsletter subscription
- Weekly B2B growth insights

**Form fields:**
- Email only

**Special features:**
- Minimizable (slides to corner)
- Can be expanded again
- Slide-in from bottom-right

## Frequency Rules

### Exit Intent
- Max shows per session: 1
- Cooldown after dismiss: 7 days
- Cooldown after submit: Never shown again (converted)

### Blog Scroll
- Max shows per session: 1
- Cooldown after dismiss: 30 days
- Cooldown after submit: Never shown again (subscribed)

## Page Targeting

### Exit Intent
- **Shows on:** All pages
- **Excludes:** Blog posts, checkout, thank-you pages

### Blog Scroll
- **Shows on:** Blog posts only (e.g., `/blog/category/post-slug`)
- **Excludes:** Everything else

## Analytics Events

All popups track these events:

```javascript
// Impression (popup shown)
popup_impression {
  popup_id: 'exit-intent-visitor-report',
  popup_variant: 'exit-intent'
}

// Interaction (user focuses form field)
popup_interaction {
  popup_id: 'exit-intent-visitor-report',
  interaction_type: 'form_focus'
}

// Submission (form submitted)
popup_submission {
  popup_id: 'exit-intent-visitor-report',
  email_provided: true,
  company_provided: true
}

// Conversion (successful submission)
conversion {
  event_category: 'lead_generation',
  event_label: 'popup_exit-intent-visitor-report',
  value: 1
}

// Dismiss (user closes popup)
popup_dismiss {
  popup_id: 'exit-intent-visitor-report',
  dismiss_method: 'close-button' // or 'outside-click', 'escape-key'
}
```

## Form Submission

### Default Behavior

By default, popups use the `handlePopupSubmission` function from `lib/popup-submission.ts`:

```typescript
// Sends to /api/leads/capture
{
  email: string,
  company?: string,
  source: 'popup',
  timestamp: ISO string
}
```

### Custom Handlers

Override with your own submission logic:

```tsx
<PopupManager
  onExitIntentSubmit={async (data) => {
    // Send to your CRM
    await yourCRM.createLead({
      email: data.email,
      company: data.company,
      source: 'exit_intent_popup'
    })
  }}
  onBlogScrollSubmit={async (data) => {
    // Send to newsletter service
    await newsletterService.subscribe(data.email)
  }}
/>
```

## Accessibility

All popups are fully accessible:

- **Keyboard Navigation:**
  - Tab: Move between form fields
  - Enter: Submit form
  - Escape: Close/minimize popup

- **Screen Readers:**
  - Proper ARIA labels
  - Role="dialog" and aria-modal="true"
  - Focus management

- **Visual:**
  - Sufficient color contrast
  - Large touch targets (44x44px minimum)
  - Clear focus indicators

## GDPR Compliance

- Clear privacy policy link
- No pre-checked opt-ins
- Easy to dismiss
- Respects user choice (localStorage)
- Can be permanently disabled by user

## Mobile Optimization

- Full-width on mobile, centered on desktop
- Touch-friendly close buttons (44x44px)
- Scroll-based exit intent fallback (no cursor on mobile)
- Bottom slide-in for blog popup (doesn't block content)
- Larger form inputs for easier typing

## Storage & Privacy

All popup state is stored in localStorage:

```javascript
// Storage keys
cursive_popup_exit-intent-visitor-report
cursive_popup_blog-scroll-newsletter

// Stored data
{
  isOpen: boolean,
  hasBeenShown: boolean,
  lastShownAt: timestamp,
  lastDismissedAt: timestamp,
  showCount: number
}
```

Session tracking uses sessionStorage:
```javascript
cursive_session_start: timestamp
```

## Testing

### Force Show Popup

Clear localStorage to reset:

```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Or use the utility function:

```javascript
import { clearPopupData } from '@/lib/popup-storage'

// Clear specific popup
clearPopupData('exit-intent-visitor-report')

// Clear all popups
clearPopupData()
```

### Disable Popups

```tsx
<PopupManager
  enableExitIntent={false}
  enableBlogScroll={false}
/>
```

## A/B Testing

Easy to create variations:

```tsx
// Variation A: Original
<ExitIntentPopup
  enabled={variant === 'A'}
  onSubmit={handleSubmit}
/>

// Variation B: Different headline
<ExitIntentPopupVariantB
  enabled={variant === 'B'}
  onSubmit={handleSubmit}
/>
```

Or modify copy directly in the component files.

## Performance

- Lazy loaded (only loads when needed)
- Minimal bundle size (~15KB gzipped with Framer Motion)
- No render blocking
- Passive scroll listeners
- Debounced event handlers

## Customization

### Change Triggers

```tsx
// Exit intent after 10 seconds instead of 5
// Edit: hooks/use-exit-intent.ts
delay: 10000

// Scroll trigger at 75% instead of 50%
<BlogScrollPopup scrollThreshold={75} />
```

### Change Frequency

```tsx
// Edit: lib/popup-storage.ts
shouldShowPopup(
  popupId,
  14, // cooldown days (was 7)
  2   // max shows per session (was 1)
)
```

### Change Copy

Edit the component files directly:
- `components/popups/exit-intent-popup.tsx`
- `components/popups/blog-scroll-popup.tsx`

All copy is in the JSX for easy modification.

## Troubleshooting

### Popup not showing

1. Check localStorage: `localStorage.getItem('cursive_popup_exit-intent-visitor-report')`
2. Check cooldown hasn't been triggered
3. Verify page is not excluded
4. Check console for errors

### Analytics not tracking

1. Verify Google Analytics is installed
2. Check `window.gtag` exists
3. Look for events in GA debug view
4. Check console logs in development

### Form not submitting

1. Check API endpoint exists
2. Verify CORS headers
3. Check network tab for failed requests
4. Add error handling to submission function

## Best Practices

1. **Test on real devices** - Mobile behavior differs from desktop
2. **Monitor analytics** - Track conversion rates and dismiss rates
3. **A/B test copy** - Try different headlines and offers
4. **Respect the user** - Don't show too often
5. **Keep forms simple** - Email only when possible
6. **Mobile first** - Design for touch before mouse

## Support

For issues or questions:
1. Check this README
2. Review component source code
3. Check browser console for errors
4. Test with localStorage cleared

## License

Part of the Cursive marketing site. Internal use only.
