# Cursive Platform - Demo Routes Reference

## Admin Login
- Email: adam@meetcursive.com
- Password: AdminPass123!

## IMPORTANT: Enable Full Access

If you're experiencing redirect loops, visit this URL to enable full platform access:
```
https://leads.meetcursive.com/api/admin/set-bypass
```

This sets a bypass cookie that allows navigation without session checks.

## Main Routes

### Waitlist (Public)
- `/waitlist` - Main waitlist page
- Small "Admin Login" button in top right corner

### Admin Routes (Admin Only)
- `/admin` → Redirects to `/admin/dashboard`
- `/admin/dashboard` - Admin dashboard with routing rules, leads overview, CSV upload
- `/admin/leads` - Lead management
- `/admin/accounts` - Account management
- `/admin/payouts` - Partner payouts
- `/admin/analytics` - Platform analytics
- `/admin/marketplace` - Marketplace admin
- `/admin/partners` - Partner management

### Partner Routes (Partners Only)
- `/partner` - Partner dashboard with stats, upload button
- `/partner/upload` - CSV upload for leads
- `/partner/payouts` - Partner earnings and payouts

### Buyer Dashboard
- `/dashboard` - Main buyer dashboard
- `/queries` - Search queries and discovery
- `/my-leads` - Your assigned leads
- `/leads` - All leads management (admin only)
  - `/leads/discover` - Discover new leads
  - `/data` - Lead data analytics
- `/people-search` - People search tool
- `/agents` - AI agents (admin only)
- `/campaigns` - Email campaigns (admin only)
- `/templates` - Email templates (admin only)
- `/trends` - Analytics and trends
- `/settings` - Account settings
- `/crm` - **CRM for lead management** (Full CRM interface)

### Marketplace
- `/marketplace` - Browse and purchase leads
- `/marketplace/credits` - Purchase credits
- `/marketplace/my-leads` - View purchased leads
- `/marketplace/history` - Purchase history

## Color Scheme
- All gradients and accents are now BLUE (no purple/green/emerald)
- Primary: blue-600
- Success states: blue-100, blue-700
- Backgrounds: blue-50

## Branding
- Platform name: "Cursive" (NO "OpenInfo" anywhere)
- All references updated
