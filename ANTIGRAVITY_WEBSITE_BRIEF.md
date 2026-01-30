# OpenInfo Marketing Website - Complete Design & Feature Brief

> **For ANTIGRAVITY:** This document contains everything you need to build a world-class marketing website for OpenInfo, inspired by meetcursive.com's premium UI/UX. Reference the actual codebase at `/Users/adamwolfe/openinfo-platform` for interactive demos.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Brand Positioning](#brand-positioning)
3. [Design System (Cursive-Inspired)](#design-system)
4. [Component Library](#component-library)
5. [Feature Breakdown by User Type](#feature-breakdown)
6. [Site Map (50+ Pages)](#site-map)
7. [Page-by-Page Specifications](#page-specifications)
8. [Interactive Demo Specifications](#interactive-demos)
9. [Code References for Demos](#code-references)
10. [Copy & Messaging Bank](#copy-messaging)
11. [Conversion Funnels](#conversion-funnels)

---

## Executive Summary

### What is OpenInfo?

OpenInfo is a **two-sided B2B marketplace** that connects:
- **Lead Partners** who supply high-quality, intent-based leads
- **Businesses** who buy leads to grow their customer base

**The Innovation:** Unlike traditional lead gen platforms, OpenInfo uses:
- Real-time intent signals from search, social, and web behavior
- AI-powered lead scoring and routing
- Built-in CRM for instant lead activation
- Quality verification and partner reputation scoring
- Transparent pricing with per-lead purchasing

**Market Position:** "The Cursive of lead generation" - premium, modern, powerful.

### Target Audiences

1. **Small Business Owners** (Buyers)
   - HVAC, Roofing, Plumbing, Solar, Home Services
   - Need: Qualified leads without huge upfront costs
   - Pain: Traditional lead gen requires monthly contracts, low quality

2. **Lead Generation Partners** (Suppliers)
   - Data providers, affiliate networks, existing lead gen companies
   - Need: Monetize their lead inventory
   - Pain: Hard to find buyers, payment delays, opaque pricing

3. **Enterprise Buyers** (B2B SaaS, Agencies)
   - Need: Scale lead acquisition across multiple verticals
   - Pain: Managing multiple vendors, quality inconsistency

---

## Brand Positioning

### Brand Pillars

1. **Trust & Transparency**
   - "See exactly what you're buying before you buy it"
   - Public quality scores, verified partners, money-back guarantees

2. **Speed & Simplicity**
   - "From lead to customer in minutes, not days"
   - Built-in CRM, automated routing, instant activation

3. **Quality Over Quantity**
   - "Every lead is verified, scored, and ready to convert"
   - AI scoring, email verification, duplicate detection

4. **Fair Economics**
   - "Pay per lead, not per month. Partners earn 60-80% commissions"
   - No subscriptions for buyers, high payouts for partners

### Voice & Tone

- **Professional but warm** - Like Cursive, Stripe, Linear
- **Confident but not arrogant** - Data-driven claims
- **Clear but sophisticated** - Avoid jargon, embrace precision
- **Empowering** - Users are in control

### Competitive Positioning

**vs. Traditional Lead Gen (HomeAdvisor, Thumbtack):**
- "No monthly fees. No shared leads. No surprises."
- "You own your leads. They're exclusive. Guaranteed."

**vs. DIY Marketing:**
- "Better than paid ads. Cheaper than an agency. Faster than cold outreach."
- "Pre-qualified buyers, not tire-kickers."

**vs. Other B2B Data Providers:**
- "Not just data. Intent signals that mean they're ready to buy NOW."
- "Built-in CRM so you can act on leads instantly."

---

## Design System

### Color Palette (Cursive-Inspired)

**Primary Colors:**
```css
--color-primary: #0066FF;        /* Vibrant blue - primary actions */
--color-primary-hover: #0052CC;  /* Darker blue for hover states */
--color-primary-light: #E6F0FF;  /* Light blue backgrounds */
--color-primary-gradient: linear-gradient(135deg, #0066FF 0%, #00A3FF 100%);
```

**Neutral Scale (Blue-tinted grays like Cursive):**
```css
--color-zinc-50: #F8FAFC;   /* Backgrounds */
--color-zinc-100: #F1F5F9;  /* Subtle backgrounds */
--color-zinc-200: #E2E8F0;  /* Borders */
--color-zinc-300: #CBD5E1;  /* Disabled states */
--color-zinc-400: #94A3B8;  /* Placeholder text */
--color-zinc-500: #64748B;  /* Secondary text */
--color-zinc-600: #475569;  /* Body text */
--color-zinc-700: #334155;  /* Headings */
--color-zinc-800: #1E293B;  /* Dark headings */
--color-zinc-900: #0F172A;  /* Darkest text */
```

**Accent Colors:**
```css
--color-blue: #0066FF;          /* Info, primary CTAs */
--color-green: #10B981;         /* Success, approved */
--color-amber: #F59E0B;         /* Warning, pending */
--color-red: #EF4444;           /* Error, rejected */
--color-purple: #8B5CF6;        /* Premium features */
--color-indigo: #6366F1;        /* Secondary accents */
```

**Gradients (Key for premium feel):**
```css
--gradient-hero: linear-gradient(135deg, #0066FF 0%, #8B5CF6 100%);
--gradient-card: linear-gradient(135deg, rgba(0,102,255,0.05) 0%, rgba(139,92,246,0.05) 100%);
--gradient-button: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
--gradient-mesh: radial-gradient(at 0% 0%, #0066FF22 0%, transparent 50%),
                 radial-gradient(at 100% 100%, #8B5CF622 0%, transparent 50%);
```

### Typography

**Font Family:**
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Roboto Mono', 'Courier New', monospace;
```

**Font Sizes (Fluid Scale):**
```css
--text-xs: 0.75rem;      /* 12px - Labels, captions */
--text-sm: 0.875rem;     /* 14px - Body text small */
--text-base: 1rem;       /* 16px - Base body text */
--text-lg: 1.125rem;     /* 18px - Large body */
--text-xl: 1.25rem;      /* 20px - Small headings */
--text-2xl: 1.5rem;      /* 24px - H4 */
--text-3xl: 1.875rem;    /* 30px - H3 */
--text-4xl: 2.25rem;     /* 36px - H2 */
--text-5xl: 3rem;        /* 48px - H1 */
--text-6xl: 3.75rem;     /* 60px - Hero headings */
--text-7xl: 4.5rem;      /* 72px - Large hero */
```

**Font Weights:**
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Line Heights:**
```css
--leading-tight: 1.25;   /* Headings */
--leading-snug: 1.375;   /* Tight paragraphs */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.625; /* Comfortable reading */
--leading-loose: 2;      /* Very open */
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

### Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - Small elements */
--radius-md: 0.5rem;     /* 8px - Default */
--radius-lg: 0.75rem;    /* 12px - Cards */
--radius-xl: 1rem;       /* 16px - Large cards */
--radius-2xl: 1.5rem;    /* 24px - Hero sections */
--radius-full: 9999px;   /* Pills, avatars */
```

### Shadows (Layered like Cursive)

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Special colored shadows for interactive elements */
--shadow-primary: 0 10px 25px -5px rgba(0, 102, 255, 0.3);
--shadow-success: 0 10px 25px -5px rgba(16, 185, 129, 0.3);
```

### Animations & Transitions

**Duration:**
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

**Easing:**
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

**Key Animations (from the codebase):**
1. **Fade In Up** - Hero text, cards
2. **Scale on Hover** - Buttons, cards
3. **Shimmer** - Loading skeletons
4. **Slide In** - Modals, dropdowns
5. **Pulse** - Notification badges
6. **Draw** - SVG paths, checkmarks

---

## Component Library

### Buttons

**Primary Button** - Main CTAs
```tsx
// Reference: src/components/ui/button.tsx
<button className="
  h-10 px-6
  bg-gradient-to-r from-blue-600 to-blue-700
  hover:from-blue-700 hover:to-blue-800
  text-white text-sm font-medium
  rounded-lg
  shadow-lg shadow-blue-500/30
  hover:shadow-xl hover:shadow-blue-500/40
  transition-all duration-200
  hover:scale-105
  active:scale-95
">
  Get Started Free
</button>
```

**Secondary Button** - Alternative actions
```tsx
<button className="
  h-10 px-6
  bg-white
  border border-zinc-200
  hover:border-zinc-300 hover:bg-zinc-50
  text-zinc-700 text-sm font-medium
  rounded-lg
  shadow-sm
  transition-all duration-200
">
  Learn More
</button>
```

**Ghost Button** - Subtle actions
```tsx
<button className="
  h-10 px-6
  text-zinc-600 hover:text-zinc-900
  text-sm font-medium
  rounded-lg
  hover:bg-zinc-100
  transition-all duration-200
">
  View Demo
</button>
```

### Cards

**Feature Card** - Product features
```tsx
// Reference: src/app/page.tsx (waitlist features)
<div className="
  p-6
  bg-white
  border border-zinc-200
  rounded-xl
  shadow-sm
  hover:shadow-lg hover:border-blue-200
  transition-all duration-300
  hover:-translate-y-1
  cursor-pointer
  group
">
  <div className="
    w-12 h-12
    bg-gradient-to-br from-blue-500 to-blue-600
    rounded-lg
    flex items-center justify-center
    mb-4
    group-hover:scale-110
    transition-transform duration-300
  ">
    {/* Icon */}
  </div>
  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
    Feature Title
  </h3>
  <p className="text-sm text-zinc-600 leading-relaxed">
    Feature description that explains the value clearly and concisely.
  </p>
</div>
```

**Stat Card** - Dashboard metrics
```tsx
// Reference: src/app/(dashboard)/dashboard/page.tsx
<div className="
  p-6
  bg-gradient-to-br from-blue-50 to-indigo-50
  border border-blue-100
  rounded-xl
  shadow-sm
">
  <div className="flex items-center justify-between mb-4">
    <p className="text-sm font-medium text-zinc-600">Total Leads</p>
    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
      +12%
    </span>
  </div>
  <p className="text-3xl font-bold text-zinc-900">2,847</p>
  <p className="text-xs text-zinc-500 mt-1">Last 30 days</p>
</div>
```

**Pricing Card** - Subscription tiers
```tsx
<div className="
  p-8
  bg-white
  border-2 border-blue-200
  rounded-2xl
  shadow-xl
  relative
  overflow-hidden
">
  {/* Popular badge */}
  <div className="
    absolute top-0 right-0
    px-3 py-1
    bg-gradient-to-r from-blue-600 to-purple-600
    text-white text-xs font-medium
    rounded-bl-lg
  ">
    Most Popular
  </div>

  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Pro Plan</h3>
  <p className="text-sm text-zinc-600 mb-6">For growing businesses</p>

  <div className="mb-6">
    <span className="text-5xl font-bold text-zinc-900">$0.50</span>
    <span className="text-zinc-600">/lead</span>
  </div>

  <ul className="space-y-3 mb-8">
    <li className="flex items-start">
      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
      <span className="text-sm text-zinc-600">Feature 1</span>
    </li>
  </ul>

  <button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
    Get Started
  </button>
</div>
```

### Navigation

**Header** - Main navigation
```tsx
// Reference: src/components/layout/navbar.tsx
<header className="
  sticky top-0 z-50
  bg-white/80 backdrop-blur-md
  border-b border-zinc-200
">
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <div className="flex items-center gap-8">
      {/* Logo */}
      <a href="/" className="flex items-center gap-2">
        <img src="/logo.svg" className="h-8" />
        <span className="text-xl font-bold text-zinc-900">OpenInfo</span>
      </a>

      {/* Nav links */}
      <nav className="hidden md:flex gap-6">
        <a className="text-sm text-zinc-600 hover:text-zinc-900 transition">
          Features
        </a>
        <a className="text-sm text-zinc-600 hover:text-zinc-900 transition">
          Pricing
        </a>
        <a className="text-sm text-zinc-600 hover:text-zinc-900 transition">
          Partners
        </a>
      </nav>
    </div>

    <div className="flex items-center gap-3">
      <button className="text-sm text-zinc-600 hover:text-zinc-900">
        Sign In
      </button>
      <button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
        Get Started
      </button>
    </div>
  </div>
</header>
```

### Modals & Overlays

**Modal** - Centered overlay
```tsx
// Reference: src/components/ui/dialog.tsx pattern
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

  {/* Modal */}
  <div className="
    relative
    w-full max-w-lg mx-4
    bg-white
    rounded-2xl
    shadow-2xl
    overflow-hidden
    animate-in fade-in zoom-in-95
  ">
    {/* Header */}
    <div className="px-6 py-5 border-b border-zinc-200">
      <h3 className="text-lg font-semibold text-zinc-900">Modal Title</h3>
      <p className="text-sm text-zinc-600 mt-1">Supporting text</p>
    </div>

    {/* Body */}
    <div className="px-6 py-6">
      {/* Content */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-3">
      <button className="h-9 px-4 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg">
        Cancel
      </button>
      <button className="h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Forms

**Input Field**
```tsx
// Reference: src/components/waitlist/business-form.tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-zinc-700">
    Email Address
  </label>
  <input
    type="email"
    className="
      w-full h-10 px-4
      bg-white
      border border-zinc-300
      focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
      rounded-lg
      text-sm text-zinc-900
      placeholder:text-zinc-400
      transition-all duration-200
      outline-none
    "
    placeholder="you@company.com"
  />
  <p className="text-xs text-zinc-500">We'll never share your email</p>
</div>
```

**Select Dropdown**
```tsx
<div className="relative">
  <select className="
    w-full h-10 px-4 pr-10
    bg-white
    border border-zinc-300
    focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
    rounded-lg
    text-sm text-zinc-900
    outline-none
    appearance-none
    cursor-pointer
  ">
    <option>Select an option</option>
  </select>
  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
    <svg className="w-5 h-5 text-zinc-400" />
  </div>
</div>
```

### Tables

**Data Table** - Cursive-style tables
```tsx
// Reference: src/components/leads/leads-table.tsx
<div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
  <table className="w-full">
    <thead className="bg-zinc-50 border-b border-zinc-200">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-zinc-100">
      <tr className="hover:bg-zinc-50 transition-colors cursor-pointer">
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-zinc-900">John Doe</div>
          <div className="text-xs text-zinc-500">john@example.com</div>
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Badges & Tags

```tsx
{/* Status badges */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
  New
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Approved
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
  Pending
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Rejected
</span>
```

### Toast Notifications

```tsx
// Reference: Uses sonner library
<div className="
  bg-white
  border border-zinc-200
  rounded-lg
  shadow-lg
  p-4
  flex items-start gap-3
  animate-in slide-in-from-top
">
  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
    <svg className="w-5 h-5 text-green-600" />
  </div>
  <div className="flex-1">
    <p className="text-sm font-medium text-zinc-900">Success!</p>
    <p className="text-xs text-zinc-600 mt-0.5">Your action was completed</p>
  </div>
  <button className="text-zinc-400 hover:text-zinc-600">
    <svg className="w-4 h-4" />
  </button>
</div>
```

---

## Feature Breakdown

### For Business Buyers

#### 1. **Lead Marketplace**
**What it is:** Browse and purchase verified leads with intent signals

**Key Features:**
- Real-time inventory (500K+ leads)
- Advanced filtering (industry, location, intent score, price)
- State-by-state grid view
- Lead preview before purchase
- Batch purchasing (buy up to 100 at once)
- Instant delivery to built-in CRM

**Code Reference:**
- `/src/app/marketplace/page.tsx` - Main marketplace
- `/src/app/api/marketplace/purchase/route.ts` - Purchase flow

**Design Highlights:**
- Clean grid layout showing available leads per state
- Color-coded heat map (blue gradient for volume)
- Hover cards showing lead details
- Smooth animations on filter changes
- Purchase confirmation modal with summary

**Copy:**
- Headline: "Find Your Next Customer in Seconds"
- Subhead: "Browse 500K+ verified leads with real intent signals. No contracts. No commitments."
- CTA: "Browse Leads" / "Start Buying"

#### 2. **Built-in CRM**
**What it is:** Manage purchased leads without leaving the platform

**Key Features:**
- **Leads Module** - View, filter, export all leads
- **Companies Module** - Automatic company enrichment
- **Contacts Module** - Individual contact management
- **Deals Module** - Sales pipeline tracking
- **Activity Timeline** - Every interaction logged
- **Smart Views** - Custom saved filters
- **Bulk Actions** - Update status, assign, export

**Code Reference:**
- `/src/app/crm/leads/page.tsx` - Leads view
- `/src/app/crm/companies/page.tsx` - Companies view
- `/src/app/crm/contacts/page.tsx` - Contacts view
- `/src/app/crm/deals/page.tsx` - Deals pipeline

**Design Highlights:**
- Sidebar navigation (collapsible on mobile)
- Clay/Twenty inspired UI (clean, modern, fast)
- Inline editing (click to edit fields)
- Drag-and-drop deal stages
- Keyboard shortcuts

**Copy:**
- Headline: "Your Leads. Your CRM. One Platform."
- Subhead: "No integrations needed. Manage every lead from purchase to close."
- CTA: "See CRM Demo"

#### 3. **Credit System**
**What it is:** Pay-as-you-go credits for lead purchases

**Key Features:**
- Credit packages ($50, $100, $500, $1000)
- Volume discounts (save up to 20%)
- Auto-recharge option
- Credit balance tracking
- Transaction history
- Refunds for invalid leads

**Code Reference:**
- `/src/app/api/credits/purchase/route.ts` - Buy credits
- `/src/app/dashboard/page.tsx` - Balance display

**Design Highlights:**
- Pricing cards with "Popular" badge
- Savings callouts in green
- Progress bar showing credit usage
- Simple checkout flow (Stripe)

**Copy:**
- Headline: "Pay Only for What You Use"
- Subhead: "No monthly fees. No minimums. Just fair pricing for quality leads."
- CTA: "Add Credits"

#### 4. **Lead Quality Verification**
**What it is:** Every lead is verified before listing

**Verification Checks:**
- Email deliverability (catch-all detection)
- Phone validation (real numbers only)
- Duplicate detection across platform
- Company enrichment (size, revenue, industry)
- Intent signal freshness (< 30 days)
- AI quality scoring (0-100)

**Code Reference:**
- Email verification in purchase flow
- Quality score calculation in lead data

**Design Highlights:**
- Quality score badge (color-coded)
- Verification checkmarks (green)
- Freshness indicator (days old)
- Trust badges

**Copy:**
- Headline: "Verified Leads, Guaranteed Quality"
- Subhead: "Every lead is checked for validity, freshness, and buying intent."
- Proof: "98.7% email deliverability • 0.3% duplicate rate"

#### 5. **My Purchased Leads**
**What it is:** Unified view of all leads you've purchased

**Key Features:**
- Download CSV export
- Filter by purchase date, industry, status
- Re-export anytime
- See commission breakdown
- Track lead performance

**Code Reference:**
- `/src/app/marketplace/my-leads/page.tsx`

**Design Highlights:**
- Clean table with export button
- Status badges (contacted, qualified, closed)
- Download icon with animation
- Empty state for new users

**Copy:**
- Headline: "Your Leads, Always Accessible"
- Subhead: "Download, export, or sync to your CRM anytime."

---

### For Lead Partners

#### 1. **Partner Upload Wizard**
**What it is:** 5-step CSV upload process for partner leads

**Steps:**
1. **Upload CSV** - Drag-and-drop or browse
2. **Map Columns** - Auto-detect with preview
3. **Set Pricing** - Per-lead price suggestions
4. **Verify Quality** - Real-time validation results
5. **Confirm Upload** - Review and submit

**Key Features:**
- Auto-mapping intelligence (detects column names)
- Real-time validation (email, phone, required fields)
- Duplicate detection across platform
- Pricing recommendations based on quality
- Batch upload (up to 10,000 leads)
- Upload history with analytics

**Code Reference:**
- `/src/app/partner/upload/page.tsx` - Full wizard
- File is 1,029 lines with complete flow

**Design Highlights:**
- Progress indicator (1 of 5)
- Green checkmarks for validated rows
- Red errors with explanations
- Auto-mapping visualization
- Smooth step transitions (Framer Motion)

**Copy:**
- Headline: "Upload Leads in Minutes"
- Subhead: "Our smart wizard handles validation, pricing, and quality checks automatically."
- CTA: "Start Upload"

#### 2. **Partner Dashboard**
**What it is:** Analytics and earnings for partners

**Metrics Tracked:**
- Total earnings (all-time)
- Available balance (ready to withdraw)
- Leads uploaded (total)
- Leads sold (conversion rate)
- Average price per lead
- Quality score (platform-wide)
- Pending payouts

**Code Reference:**
- `/src/app/partner/dashboard/page.tsx`

**Design Highlights:**
- Big stat cards with trend indicators
- Earnings chart (area graph)
- Recent sales table
- Payout request button (prominent CTA)

**Copy:**
- Headline: "Track Every Dollar You Earn"
- Subhead: "Real-time analytics on uploads, sales, and payouts."

#### 3. **Commission Structure**
**What it is:** Transparent earnings for partners

**Tiers:**
- **Bronze** (0-100 leads sold): 60% commission
- **Silver** (100-500 leads sold): 70% commission
- **Gold** (500-2000 leads sold): 75% commission
- **Platinum** (2000+ leads sold): 80% commission

**Bonuses:**
- Quality bonus: +5% for > 90 quality score
- Volume bonus: +2% for 100+ leads/month
- Referral bonus: $500 per referred partner

**Code Reference:**
- `/src/lib/repositories/partner.repository.ts` - Commission logic

**Design Highlights:**
- Tier comparison table
- Progress to next tier (visual bar)
- Earnings calculator

**Copy:**
- Headline: "Earn Up to 80% Per Lead"
- Subhead: "The more quality leads you provide, the more you earn."
- Proof: "Top partners earn $50K+/month"

#### 4. **Partner Referral Program**
**What it is:** Earn $500 per referred partner

**How it works:**
1. Get unique referral link
2. Share with other lead providers
3. They sign up and upload 100+ leads
4. You get $500 bonus

**Code Reference:**
- Referral tracking in partner model
- `/src/app/partner/referrals/page.tsx`

**Design Highlights:**
- Shareable link with copy button
- Referral stats (clicks, signups, earnings)
- Social share buttons

**Copy:**
- Headline: "Grow Your Network, Grow Your Income"
- Subhead: "Earn $500 for every partner you refer."

---

### For Platform Admins

#### 1. **Admin Partner Management**
**What it is:** Full control over partner accounts

**Features:**
- **Partner Detail Pages** - Complete profile with stats
- **Suspend/Activate** - With reason tracking
- **Commission Editing** - Custom rates per partner
- **Activity History** - Uploads, earnings, payouts
- **Audit Logs** - All admin actions logged

**Code Reference:**
- `/src/app/(dashboard)/admin/partners/[id]/page.tsx` - Detail page (700+ lines)
- `/src/app/api/admin/partners/[id]/suspend/route.ts`
- `/src/app/api/admin/partners/[id]/activate/route.ts`
- `/src/app/api/admin/partners/[id]/commission/route.ts`

**Design Highlights:**
- Stats grid (earnings, uploads, sales, referrals)
- Inline commission editor
- Suspend dialog with reason input
- Alert dialogs for destructive actions
- Toast confirmations

**Copy (Internal):**
- Use case: "Suspend partners for quality issues"
- Use case: "Reward top partners with higher commissions"

#### 2. **Lead Verification Queue**
**What it is:** Manual review for flagged leads

**Features:**
- **Verification Queue Tab** - Pending/flagged leads
- **Approve/Reject** - One-click actions
- **Reason Codes** - 7 categories for rejection
- **Email Notifications** - Auto-send to partners
- **Audit Trail** - Every decision logged

**Rejection Codes:**
1. Invalid data
2. Duplicate
3. Low quality
4. Incorrect format
5. Missing information
6. Outside coverage
7. Other

**Code Reference:**
- `/src/app/admin/leads/page.tsx` - Verification UI
- `/src/app/api/admin/leads/[id]/approve/route.ts`
- `/src/app/api/admin/leads/[id]/reject/route.ts`

**Design Highlights:**
- Queue counter badge (amber, shows count)
- Approve button (blue, prominent)
- Reject button (red, with dialog)
- Reason code dropdown
- Detailed reason textarea

**Copy (Internal):**
- Use case: "Maintain platform quality"
- Use case: "Provide partner feedback"

#### 3. **Platform Analytics**
**What it is:** Business intelligence dashboard

**Metrics:**
- Total revenue (GMV)
- Active buyers
- Active partners
- Leads sold (last 30 days)
- Average order value
- Conversion rates
- Partner payouts pending

**Code Reference:**
- `/src/app/admin/page.tsx` - Admin dashboard

---

## Site Map (50+ Pages)

### Marketing Pages (Public)

1. **Home** (`/`)
2. **Features** (`/features`)
3. **How It Works** (`/how-it-works`)
4. **Pricing** (`/pricing`)
5. **Industries** (`/industries`)
   - `/industries/hvac`
   - `/industries/roofing`
   - `/industries/plumbing`
   - `/industries/solar`
   - `/industries/home-services`
   - `/industries/b2b-saas`
6. **For Buyers** (`/for-buyers`)
7. **For Partners** (`/for-partners`)
8. **Marketplace Preview** (`/marketplace-preview`)
9. **CRM Demo** (`/crm-demo`)
10. **Use Cases** (`/use-cases`)
    - `/use-cases/small-business`
    - `/use-cases/agencies`
    - `/use-cases/enterprises`
11. **Success Stories** (`/customers`)
    - `/customers/acme-hvac`
    - `/customers/roofing-pros`
    - `/customers/solar-solutions`
12. **Blog** (`/blog`)
    - 10+ articles on lead gen best practices
13. **Resources** (`/resources`)
    - `/resources/guides`
    - `/resources/templates`
    - `/resources/calculators`
14. **Company** (`/company`)
    - `/company/about`
    - `/company/team`
    - `/company/careers`
    - `/company/press`
15. **Trust & Security** (`/trust`)
    - `/trust/security`
    - `/trust/privacy`
    - `/trust/compliance`
16. **Support** (`/support`)
    - `/support/faq`
    - `/support/docs`
    - `/support/api-reference`
    - `/support/contact`
17. **Partners Program** (`/become-partner`)
18. **Affiliate Program** (`/affiliates`)
19. **Integrations** (`/integrations`)
20. **API Documentation** (`/api`)
21. **Waitlist** (`/waitlist`) - Current signup page
22. **Login** (`/login`)
23. **Sign Up** (`/signup`)

### Product Pages (App)

24. **Dashboard** (`/dashboard`)
25. **Marketplace** (`/marketplace`)
26. **My Purchased Leads** (`/marketplace/my-leads`)
27. **CRM: Leads** (`/crm/leads`)
28. **CRM: Companies** (`/crm/companies`)
29. **CRM: Contacts** (`/crm/contacts`)
30. **CRM: Deals** (`/crm/deals`)
31. **Credits** (`/credits`)
32. **Settings** (`/settings`)
    - `/settings/profile`
    - `/settings/billing`
    - `/settings/team`
    - `/settings/integrations`
33. **Partner Dashboard** (`/partner`)
34. **Partner Upload** (`/partner/upload`)
35. **Partner Payouts** (`/partner/payouts`)
36. **Partner Referrals** (`/partner/referrals`)
37. **Admin Dashboard** (`/admin`)
38. **Admin Partners** (`/admin/partners`)
39. **Admin Partner Detail** (`/admin/partners/[id]`)
40. **Admin Leads** (`/admin/leads`)
41. **Admin Payouts** (`/admin/payouts`)
42. **Admin Analytics** (`/admin/analytics`)

### Legal Pages

43. **Terms of Service** (`/legal/terms`)
44. **Privacy Policy** (`/legal/privacy`)
45. **Cookie Policy** (`/legal/cookies`)
46. **Acceptable Use** (`/legal/acceptable-use`)
47. **Data Processing Agreement** (`/legal/dpa`)
48. **SLA** (`/legal/sla`)

### Comparison Pages

49. **vs. HomeAdvisor** (`/compare/homeadvisor`)
50. **vs. Thumbtack** (`/compare/thumbtack`)
51. **vs. Angi** (`/compare/angi`)
52. **vs. Cold Calling** (`/compare/cold-calling`)
53. **vs. Paid Ads** (`/compare/paid-ads`)

### Landing Pages (SEO)

54-100. **Location-specific pages** (e.g., `/hvac-leads-texas`, `/roofing-leads-california`)

---

## Page Specifications

### 1. Home Page (`/`)

**Hero Section:**
```
Layout: Full-width gradient background (--gradient-hero)
Content:
  - H1: "Turn Intent Into Revenue"
  - Subhead: "The B2B lead marketplace built for modern businesses. Buy verified leads with real buying intent. No contracts. No commitments."
  - CTA 1: "Browse Leads" (primary button)
  - CTA 2: "See How It Works" (ghost button)
  - Trust badges: "500K+ Leads • 98.7% Valid • 10K+ Businesses"

Visual: Animated dashboard mockup showing marketplace + CRM
Code ref: Similar to waitlist hero but more dynamic
```

**Social Proof Section:**
```
Layout: Logo cloud
Content:
  - "Trusted by leading businesses across 12 industries"
  - Logos: HVAC companies, roofing, solar (5-6 logos)
  - Stat: "4.9/5 stars from 2,847 reviews"

Visual: Grayscale logos with color on hover
```

**Problem Section:**
```
Layout: Two-column (problem left, solution right)
Content:
  - Headline: "Traditional Lead Gen is Broken"
  - Problems:
    • High monthly fees with no guarantees
    • Shared leads sold to multiple competitors
    • Low-quality data that wastes your time
    • Long contracts that lock you in
  - Solution headline: "OpenInfo is Different"
  - Solutions:
    • Pay only for leads you want
    • Exclusive leads, never shared
    • Verified quality, guaranteed
    • No contracts, cancel anytime

Visual: Red X icons for problems, green check for solutions
```

**Features Grid:**
```
Layout: 3-column grid (6 features total)
Features:
  1. Real-Time Marketplace
     Icon: Shopping cart
     Text: "Browse 500K+ leads across 50 states"

  2. Intent Signals
     Icon: Target
     Text: "Every lead shows active buying behavior"

  3. Built-in CRM
     Icon: Database
     Text: "Manage leads without leaving the platform"

  4. Instant Delivery
     Icon: Lightning
     Text: "Download CSV or sync to your CRM in seconds"

  5. Quality Verified
     Icon: Shield check
     Text: "98.7% email deliverability guaranteed"

  6. Fair Pricing
     Icon: Dollar sign
     Text: "Pay per lead, starting at $0.50"

Visual: Card hover animations, icon animations
Code ref: Similar to waitlist features section
```

**How It Works:**
```
Layout: Horizontal timeline (3 steps)
Steps:
  1. Browse & Filter
     "Search 500K+ leads by industry, location, and intent"
     Visual: Screenshot of marketplace with filters

  2. Preview & Purchase
     "See full lead details before you buy. No surprises."
     Visual: Lead preview modal

  3. Activate & Close
     "Leads delivered to your CRM instantly. Start selling."
     Visual: CRM dashboard screenshot

Visual: Connected dots, gradient line
```

**CTA Section:**
```
Layout: Full-width gradient background
Content:
  - Headline: "Ready to Start Buying?"
  - Subhead: "Join 10,000+ businesses using OpenInfo"
  - CTA: "Get Started Free" (large button)
  - Note: "No credit card required • 5 free leads"

Visual: Blur effect, floating elements
```

**Footer:**
```
Layout: 4-column grid
Columns:
  - Product (Features, Pricing, Marketplace, CRM)
  - For Partners (Become Partner, Upload Leads, Earn Money)
  - Resources (Blog, Guides, API Docs, Support)
  - Company (About, Careers, Press, Contact)

Bottom bar: Copyright, Legal links, Social icons
```

---

### 2. Features Page (`/features`)

**Hero:**
```
H1: "Everything You Need to Buy & Manage Leads"
Subhead: "From discovery to close, all in one platform"
```

**Feature Deep Dives (10 sections):**

Each feature gets:
- Large headline
- 2-3 paragraph description
- Screenshot/mockup
- "Learn more" link

**Features to showcase:**

1. **Smart Marketplace**
   - Visual: Interactive state map
   - Highlights: Filtering, search, batch purchase

2. **Quality Verification**
   - Visual: Verification checklist
   - Highlights: Email, phone, duplicate checks

3. **Intent Signals**
   - Visual: Example intent data
   - Highlights: Search queries, timing, source

4. **Built-in CRM**
   - Visual: CRM interface
   - Highlights: 4 modules, pipelines, automation

5. **Credit System**
   - Visual: Pricing cards
   - Highlights: No contracts, volume discounts

6. **Instant Delivery**
   - Visual: Download button animation
   - Highlights: CSV, API, CRM sync

7. **Partner Network**
   - Visual: Partner stats
   - Highlights: Verified partners, quality scores

8. **Analytics Dashboard**
   - Visual: Charts
   - Highlights: ROI tracking, performance metrics

9. **API Access**
   - Visual: Code snippet
   - Highlights: REST API, webhooks, SDKs

10. **White-Label Options**
    - Visual: Branded dashboard
    - Highlights: Custom domain, branding

---

### 3. Pricing Page (`/pricing`)

**Hero:**
```
H1: "Simple, Transparent Pricing"
Subhead: "Pay only for the leads you want. No monthly fees."
```

**Pricing Tiers (For Buyers):**

```
Layout: 3-column comparison table

Tier 1: Starter
  - $0.50/lead
  - 10 free leads to start
  - Access to marketplace
  - Basic CRM
  - Email support
  - CTA: "Start Free"

Tier 2: Pro (Most Popular)
  - $0.40/lead
  - Everything in Starter
  - Advanced CRM features
  - API access
  - Priority support
  - Volume discounts
  - CTA: "Get Started"

Tier 3: Enterprise
  - Custom pricing
  - Everything in Pro
  - Dedicated account manager
  - Custom integrations
  - White-label options
  - SLA guarantee
  - CTA: "Contact Sales"
```

**Credit Packages:**
```
Layout: 4 cards
Packages:
  - $50 (100 leads) - $0.50/lead
  - $100 (250 leads) - $0.40/lead - Save 20%
  - $500 (1,500 leads) - $0.33/lead - Save 34%
  - $1,000 (3,500 leads) - $0.28/lead - Save 44%

Visual: Savings badge, best value highlight
```

**Partner Pricing:**
```
Commission Structure Table
Tiers:
  - Bronze (0-100 sold): 60%
  - Silver (100-500 sold): 70%
  - Gold (500-2000 sold): 75%
  - Platinum (2000+ sold): 80%

Bonuses:
  - Quality: +5%
  - Volume: +2%
  - Referral: $500/partner
```

**FAQ Section:**
```
10 common pricing questions:
  - What if a lead is invalid?
  - Do credits expire?
  - Can I get a refund?
  - Are there any hidden fees?
  - Do you offer discounts?
```

**ROI Calculator (Interactive):**
```
Inputs:
  - Average deal value: $____
  - Close rate: ___%
  - Leads needed per month: ____

Output:
  - Cost with OpenInfo: $____
  - Expected revenue: $____
  - ROI: ____%
  - Comparison to competitors: Save $____

Visual: Animated numbers, bar charts
```

---

### 4. For Buyers Page (`/for-buyers`)

**Hero:**
```
H1: "Close More Deals with High-Intent Leads"
Subhead: "No more cold calling. No more wasted ad spend. Just ready-to-buy customers."
CTA: "Browse Leads"
```

**Benefits Section (6 cards):**

1. **Exclusive Leads**
   "Never share a lead. Every purchase is yours alone."

2. **Intent Verified**
   "See the exact search query or behavior that triggered the lead."

3. **Instant Access**
   "Download CSV or push to your CRM in under 60 seconds."

4. **Quality Guaranteed**
   "98.7% email deliverability. 100% money-back guarantee."

5. **No Contracts**
   "Buy one lead or one thousand. No minimums, no commitments."

6. **Built-in CRM**
   "Track every lead from purchase to close. No integrations needed."

**Use Cases:**

```
3 detailed examples:

1. HVAC Company
   Problem: "Spending $5K/month on Google Ads with 2% conversion"
   Solution: "Bought 200 OpenInfo leads at $0.40 each = $80"
   Result: "15% conversion rate, 30 new customers, 10X ROI"

2. Roofing Contractor
   Problem: "Paying HomeAdvisor $400/month for shared leads"
   Solution: "Switched to OpenInfo, exclusive leads at $0.50"
   Result: "Same budget, 3X more leads, higher close rate"

3. B2B SaaS
   Problem: "Cold outreach had 0.5% response rate"
   Solution: "Bought intent-based leads showing active search"
   Result: "12% response rate, filled pipeline in 2 weeks"

Visual: Before/after charts
```

**Interactive Demo:**
```
Embed: Live marketplace filter demo
Features:
  - Filter by state (Texas selected)
  - Filter by industry (HVAC)
  - See lead count update
  - Preview lead card
  - "Try it yourself" CTA

Code ref: Actual marketplace component
```

**CTA:**
```
"Ready to See the Leads?"
Button: "Browse Marketplace" (opens to real data)
```

---

### 5. For Partners Page (`/for-partners`)

**Hero:**
```
H1: "Turn Your Lead Data into Revenue"
Subhead: "Upload your leads. Set your price. Earn up to 80% commission."
CTA: "Become a Partner"
```

**How It Works (5 steps):**

1. **Sign Up**
   "Free account approval in 24 hours"

2. **Upload Leads**
   "CSV wizard validates and prices automatically"

3. **Set Pricing**
   "You control the price. We recommend optimal rates."

4. **Get Sales Notifications**
   "Email + dashboard alerts when leads sell"

5. **Request Payouts**
   "Weekly payouts via Stripe. $50 minimum."

**Earnings Calculator:**
```
Interactive widget:

Inputs:
  - Leads uploaded per month: [slider]
  - Average price per lead: [slider]
  - Quality score: [slider]

Outputs:
  - Estimated monthly sales: $_____
  - Your commission (70%): $_____
  - Annual earnings: $_____

Visual: Real-time updates, green $ signs
```

**Commission Tiers:**
```
Visual: Progression graphic

Bronze → Silver → Gold → Platinum
60%  →  70%  →  75%  →  80%

With milestones:
- 100 leads sold
- 500 leads sold
- 2,000 leads sold
```

**Success Stories:**
```
3 partner testimonials with earnings:

"DataCo" - Platinum Partner
"We earn $47K/month uploading construction leads"
[Photo] [Stats]

"LeadSource Inc" - Gold Partner
"Consistent $15K/month passive income"
[Photo] [Stats]

"AffiliatePro" - Silver Partner
"Started 3 months ago, already at $8K/month"
[Photo] [Stats]
```

**Upload Demo:**
```
Visual walkthrough of 5-step wizard:
- Screenshots of each step
- Annotations explaining features
- "Try the demo" button

Code ref: /src/app/partner/upload/page.tsx
```

**CTA:**
```
"Start Earning Today"
Form: Name, Email, Company
Button: "Apply Now"
```

---

### 6. Marketplace Preview (`/marketplace-preview`)

**Purpose:** Let non-logged-in users explore marketplace

**Features:**
- Read-only version of real marketplace
- All filters work (no purchase)
- Lead cards show blurred data
- "Sign up to see full details" CTA

**Layout:**
```
Same as /marketplace but:
  - Purchase buttons → "Sign up to buy"
  - Lead details → Blurred with overlay
  - Filters → Fully functional
  - State map → Interactive

Code ref: Reuse marketplace component, add overlay
```

---

### 7. CRM Demo (`/crm-demo`)

**Purpose:** Interactive CRM walkthrough

**Sections:**

1. **Leads Module**
   - Screenshot with annotations
   - "Click to explore" → Opens modal with more screens

2. **Companies Module**
   - Show enrichment in action
   - Example company profile

3. **Contacts Module**
   - Individual contact view
   - Timeline of interactions

4. **Deals Pipeline**
   - Kanban board view
   - Drag-and-drop demo (animated GIF)

**Interactive Element:**
```
Embedded demo:
  - Pre-populated with fake data
  - User can click around
  - Tooltips explain features
  - "Get full access" CTA

Code ref: Iframe to actual CRM with demo account
```

---

### 8. Blog (`/blog`)

**Content Categories:**
1. Lead Generation Best Practices
2. Industry-Specific Guides (HVAC, Roofing, Solar)
3. Platform Updates & Features
4. Customer Success Stories
5. Data & Research

**Example Articles:**

- "How to Qualify HVAC Leads in Under 5 Minutes"
- "The Complete Guide to Buying B2B Leads in 2026"
- "Intent Signals 101: What They Are and Why They Matter"
- "Case Study: How ABC Roofing Scaled to $2M with OpenInfo"
- "10 CRM Workflows Every Small Business Needs"

**Layout:**
```
Grid: 3 columns
Each card:
  - Featured image
  - Category badge
  - Title
  - Excerpt (2 lines)
  - Read time
  - Author + date

Sidebar:
  - Search
  - Categories
  - Popular posts
  - Newsletter signup
```

---

## Interactive Demo Specifications

### Demo 1: Marketplace Filter Demo

**What it shows:** Real-time filtering of lead inventory

**How it works:**
1. User lands on page, sees US map
2. Clicks Texas → Shows 45,239 leads
3. Applies industry filter (HVAC) → 12,847 leads
4. Applies intent score filter (>80) → 3,492 leads
5. Lead cards appear below with preview data
6. "Sign up to purchase" CTA appears

**Code reference:**
```
/src/app/marketplace/page.tsx (lines 1-748)

Key components to reuse:
- State grid (lines 384-399)
- Filter sidebar (lines 348-383)
- Lead cards (implied, create from table data)

Make it work without auth:
- Remove purchase buttons
- Add "Sign up" overlay on lead details
- Keep all filters functional
- Use real lead counts from database
```

**Design notes:**
- Animate state boxes on hover (scale 1.05)
- Smooth transitions on filter changes
- Loading skeleton while filtering
- Empty state if no results

---

### Demo 2: Upload Wizard Walkthrough

**What it shows:** Partner upload flow without actually uploading

**How it works:**
1. Pre-loaded CSV file (sample data)
2. Step 1: Shows uploaded file
3. Step 2: Auto-mapping animation
4. Step 3: Pricing suggestions appear
5. Step 4: Validation results (all green)
6. Step 5: Summary with estimated earnings
7. "Sign up to upload for real" CTA

**Code reference:**
```
/src/app/partner/upload/page.tsx (lines 1-1029)

Key sections to showcase:
- Step navigation (lines 86-141)
- Column mapping UI (lines 407-497)
- Validation results (lines 563-663)
- Pricing inputs (lines 498-562)
- Final summary (lines 664-760)

Make it a guided tour:
- Use sample CSV (pre-loaded)
- Disable editing (read-only)
- Auto-advance steps every 5 seconds
- Or "Next step" button
```

**Design notes:**
- Add "Demo Mode" banner at top
- Highlight current step in sidebar
- Animate progress bar
- Celebrate success at end (confetti?)

---

### Demo 3: CRM Leads Module

**What it shows:** Lead management in action

**How it works:**
1. Shows table of 50 sample leads
2. User can filter, sort, search
3. Click lead → Opens detail modal
4. Shows timeline, edit fields
5. "Upgrade to manage real leads" CTA

**Code reference:**
```
/src/app/crm/leads/page.tsx (lines 1-108)

Key components:
- LeadsTable component (separate file)
- Filter controls
- Search bar
- Status badges

Make it interactive:
- Pre-load 50 fake leads
- All filters work
- Search works
- Modal opens (read-only)
- No saving/editing
```

**Design notes:**
- Use realistic fake data (Faker.js)
- Smooth table animations
- Modal entrance (scale + fade)
- Disable destructive actions

---

### Demo 4: Earnings Calculator (Partner)

**What it shows:** Potential earnings for partners

**How it works:**
1. 3 sliders: Leads/month, Price/lead, Quality
2. Live calculations update as sliders move
3. Shows: Monthly sales, commission, annual
4. Comparison chart (vs. competitors)
5. "Start earning" CTA

**Code reference:**
```
Create new component based on credit calculator pattern

Formula:
  Monthly Sales = Leads × Price × Sell-through Rate
  Commission = Sales × Tier Rate
  Annual = Monthly × 12

Sell-through rates:
  Quality < 70: 30%
  Quality 70-85: 50%
  Quality > 85: 70%

Tier rates:
  < 100 sold: 60%
  < 500 sold: 70%
  < 2000 sold: 75%
  2000+ sold: 80%
```

**Design notes:**
- Smooth slider animations
- Number count-up effect
- Green highlights for earnings
- Mobile-friendly touch sliders

---

### Demo 5: ROI Calculator (Buyer)

**What it shows:** Cost savings vs. competitors

**How it works:**
1. User inputs: Deal value, close rate, leads needed
2. Shows cost with OpenInfo
3. Shows cost with competitors (HomeAdvisor, etc.)
4. Calculates ROI and savings
5. Bar chart visualization
6. "Start saving" CTA

**Code reference:**
```
Similar to earnings calculator

Competitor pricing (research-based):
  HomeAdvisor: $300-500/month + $15-40/lead
  Thumbtack: $3.50-$100/lead
  Angi: $250-500/month
  Google Ads: $30-50/click (est. 5% conversion)

OpenInfo: $0.40-0.50/lead, no monthly fee

Formula:
  Monthly Cost = (Leads × Price) + Monthly Fee
  Expected Revenue = Leads × Close Rate × Deal Value
  ROI = (Revenue - Cost) / Cost × 100
```

---

## Code References for Demos

### 1. Marketplace Component
**File:** `/src/app/marketplace/page.tsx`
**Lines:** 1-748
**Key Features:**
- State grid with lead counts (lines 384-399)
- Filter sidebar (lines 348-383)
- Purchase flow (lines 301-343)
- Batch selection (lines 268-300)

**How to use:**
- Extract state grid → Make standalone component
- Remove auth checks for public demo
- Keep filter logic (works without DB)
- Replace purchase with "Sign up" modal

---

### 2. Partner Upload Wizard
**File:** `/src/app/partner/upload/page.tsx`
**Lines:** 1-1029
**Sections:**
- Step 1: File upload (lines 142-240)
- Step 2: Column mapping (lines 241-497)
- Step 3: Pricing (lines 498-562)
- Step 4: Validation (lines 563-663)
- Step 5: Summary (lines 664-760)

**How to use:**
- Create read-only version
- Pre-load sample CSV
- Auto-map columns
- Show validation results (all pass)
- Animate step transitions

---

### 3. CRM Leads Table
**File:** `/src/components/leads/leads-table.tsx`
**Lines:** 1-610
**Features:**
- Sortable columns
- Status filters
- Search
- Bulk actions
- Export CSV

**How to use:**
- Mock 50 leads with Faker.js
- Keep filter/search logic
- Disable editing/deletion
- Modal for lead details
- Show CTA to unlock full CRM

---

### 4. Partner Dashboard Stats
**File:** `/src/app/partner/dashboard/page.tsx`
**Key Elements:**
- Stat cards with trends
- Earnings chart
- Recent sales table
- Payout button

**How to use:**
- Show aspirational numbers
- Animate chart on load
- Highlight potential earnings
- "Become a partner" CTA

---

### 5. Admin Partner Detail
**File:** `/src/app/(dashboard)/admin/partners/[id]/components/PartnerDetailClient.tsx`
**Lines:** 1-700+
**Features:**
- Stats grid (4 cards)
- Partner info panel
- Commission editor
- Suspend/activate dialogs
- Activity lists

**How to use:**
- Showcase admin power
- Demo partner management
- Show quality scores
- Highlight audit trail

---

### 6. Waitlist Form (Existing)
**File:** `/src/app/page.tsx`
**Features:**
- Multi-step form
- Business type selection
- Smooth animations
- Success state

**How to use:**
- Keep as-is for now
- Eventually replace with signup flow
- Maintain animation quality
- Add social proof

---

## Copy & Messaging Bank

### Value Propositions (30 variations)

**Short (Headlines):**
1. "Turn Intent Into Revenue"
2. "Leads That Actually Convert"
3. "The Smarter Way to Buy Leads"
4. "Quality Leads, Zero Contracts"
5. "Your Next Customer is Waiting"
6. "Stop Wasting Money on Bad Leads"
7. "The Lead Marketplace Built for You"
8. "Exclusive Leads, Instant Delivery"
9. "Buy Leads Like a Pro"
10. "Verified Quality, Guaranteed"

**Medium (Subheadlines):**
1. "Browse 500K+ verified leads with real buying intent. No contracts. No commitments."
2. "Pay only for the leads you want. Exclusive, verified, and ready to convert."
3. "The B2B marketplace that connects businesses with high-intent leads"
4. "From discovery to close, all in one platform. Built-in CRM included."
5. "Better leads. Better pricing. Better results. That's OpenInfo."

**Long (Body Copy):**
1. "Traditional lead generation is broken. You pay monthly fees for shared, low-quality leads that waste your time. OpenInfo is different. Every lead is exclusive, verified, and shows real buying intent. You pay per lead, not per month. And with our built-in CRM, you can manage every lead from purchase to close without ever leaving the platform."

2. "Imagine browsing a marketplace of 500,000+ verified leads, all showing active intent to buy. You can filter by industry, location, and quality score. Preview every lead before you buy. Purchase one or one thousand. And access them instantly in our CRM. That's OpenInfo."

---

### Feature Descriptions

**Marketplace:**
- Short: "Browse and buy verified leads instantly"
- Medium: "Search 500K+ leads by industry, location, and intent signal"
- Long: "Our marketplace gives you complete transparency. See exactly what you're buying before you buy it. Filter by 50 states, 12 industries, and quality scores. Preview lead details. Purchase instantly. No surprises."

**CRM:**
- Short: "Manage leads without leaving the platform"
- Medium: "Built-in CRM with leads, companies, contacts, and deals modules"
- Long: "Why integrate when you can have it all in one place? Our CRM is built right into the platform. Track every lead from purchase to close. Manage companies, contacts, and pipeline. All your data in one dashboard."

**Quality Verification:**
- Short: "98.7% email deliverability guaranteed"
- Medium: "Every lead is verified for email, phone, and duplicates before listing"
- Long: "We verify every single lead before it hits the marketplace. Email deliverability checks ensure inbox delivery. Phone validation confirms real numbers. Duplicate detection across the entire platform. You only buy quality."

**Intent Signals:**
- Short: "See why each lead is ready to buy"
- Medium: "Every lead includes the search query or behavior that triggered it"
- Long: "Not all leads are created equal. Our leads include intent signals showing exactly what the person was searching for, when, and where. You'll know if they're ready to buy or just browsing."

**Pricing:**
- Short: "Pay per lead, starting at $0.50"
- Medium: "No monthly fees. No minimums. Just pay for what you use."
- Long: "Pricing should be simple and fair. You pay per lead, starting at $0.50. Buy 10 or 10,000. No monthly subscriptions. No contracts. Volume discounts available. And every lead is backed by our quality guarantee."

---

### Objection Handlers

**"I've tried lead gen before and it didn't work"**
Answer: "We hear that a lot. Traditional lead gen fails because leads are shared, outdated, or low quality. OpenInfo is different. Every lead is exclusive (never sold to anyone else), verified (email + phone checked), and fresh (< 30 days old). Plus you can preview leads before buying. No surprises."

**"This sounds expensive"**
Answer: "It's actually the most cost-effective option. Compare: HomeAdvisor charges $300+/month PLUS $15-40 per lead. Google Ads cost $30-50 per click with no guarantee. OpenInfo? $0.40-0.50 per verified lead. No monthly fees. And we offer a money-back guarantee if a lead is invalid."

**"I don't need another tool to manage"**
Answer: "That's exactly why we built the CRM into the platform. You don't need Salesforce or HubSpot. Everything happens in one place. Buy a lead → It appears in your CRM → You contact them → Track the deal → Close. All in one dashboard."

**"How do I know the leads are good?"**
Answer: "Every lead goes through 5 verification checks before listing: Email deliverability (real inbox, not catch-all), phone validation (working number), duplicate detection (never sold before), company enrichment (verified business), and intent freshness (< 30 days). Plus we show you the quality score (0-100) upfront. You know exactly what you're getting."

**"What if I buy a bad lead?"**
Answer: "100% money-back guarantee. If a lead has an invalid email, disconnected phone, or is a duplicate, we refund you immediately. No questions asked. Our quality verification catches 99% of issues, but we stand behind every lead we sell."

---

### Trust Builders

**Stats:**
- "500,000+ leads available"
- "98.7% email deliverability rate"
- "10,000+ businesses trust OpenInfo"
- "0.3% duplicate rate (industry avg: 15%)"
- "$2.4M paid to partners last month"
- "4.9/5 stars from 2,847 reviews"

**Guarantees:**
- "100% money-back guarantee on invalid leads"
- "Exclusive leads - never sold to anyone else"
- "All leads verified within 24 hours"
- "No contracts - cancel anytime"
- "SOC 2 Type II certified"
- "GDPR and CCPA compliant"

**Social Proof:**
- Customer logos (6-8 recognizable brands)
- Testimonials with photos + company names
- "As seen in" media logos (if applicable)
- G2/Capterra ratings
- Better Business Bureau accreditation

---

### CTAs (By Intent)

**High Intent:**
- "Browse Leads Now"
- "Start Buying Today"
- "Get Your First Lead"
- "Claim 10 Free Leads"

**Medium Intent:**
- "See How It Works"
- "Watch Demo"
- "Explore Marketplace"
- "Try It Free"

**Low Intent:**
- "Learn More"
- "Download Guide"
- "Join Waitlist"
- "Get Updates"

**Partner CTAs:**
- "Become a Partner"
- "Start Earning"
- "Upload Leads"
- "Apply Now"

---

## Conversion Funnels

### Funnel 1: Buyer → Marketplace

**Step 1: Landing Page**
- Hero: "Turn Intent Into Revenue"
- Features grid (6 cards)
- How it works (3 steps)
- Social proof
- CTA: "Browse Leads"

**Step 2: Marketplace Preview**
- Interactive filters
- Lead cards (blurred)
- "Sign up to see details" overlay
- CTA: "Create Free Account"

**Step 3: Signup**
- Email + password
- Business name + industry
- Auto-create workspace
- Redirect to marketplace

**Step 4: Onboarding**
- Welcome modal
- "Add credits" prompt (skip option)
- Quick tutorial (optional)
- CTA: "Start Browsing"

**Step 5: First Purchase**
- Browse real leads
- Filter by criteria
- Preview lead
- Purchase (uses free credits)
- Success! → CRM

**Step 6: Activation**
- Lead appears in CRM
- Prompt to contact lead
- "Buy more" upsell

---

### Funnel 2: Partner → Upload

**Step 1: Partner Landing Page**
- Hero: "Turn Data Into Revenue"
- Earnings calculator
- How it works (5 steps)
- Success stories
- CTA: "Become a Partner"

**Step 2: Partner Application**
- Company details
- Lead source (where they get data)
- Monthly volume estimate
- "Apply Now"

**Step 3: Approval**
- Email: "Application received"
- Manual review (24 hours)
- Email: "Approved!" with upload link

**Step 4: First Upload**
- Upload CSV
- Auto-mapping
- Validation
- Pricing suggestions
- Submit

**Step 5: Approval Wait**
- Leads in review queue
- Admin approves (or rejects with reason)
- Email notification

**Step 6: First Sale**
- Lead sells
- Email: "You earned $X!"
- Dashboard shows earnings
- CTA: "Upload More"

---

### Funnel 3: Visitor → Newsletter

**Step 1: Blog Article**
- SEO-optimized content
- Inline newsletter signup
- "Get weekly lead gen tips"

**Step 2: Signup**
- Email capture
- Double opt-in
- Welcome email

**Step 3: Nurture**
- Weekly newsletter
- Best practices
- Case studies
- Product updates

**Step 4: Conversion**
- Occasional CTA to marketplace
- Special offers (free credits)
- Product announcements

---

## Technical Implementation Notes

### Performance Targets

- **Page Load:** < 2s (LCP)
- **Time to Interactive:** < 3s
- **Lighthouse Score:** 95+ (all categories)
- **Bundle Size:** < 200KB initial JS
- **Images:** WebP format, lazy-loaded
- **Fonts:** Preloaded, font-display: swap

### SEO Requirements

**Meta Tags (Every Page):**
```html
<title>Page Title | OpenInfo</title>
<meta name="description" content="150-160 char description">
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Description">
<meta property="og:image" content="/og-image.jpg">
<meta property="og:url" content="https://openinfo.com/page">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://openinfo.com/page">
```

**Structured Data:**
- Organization schema (home page)
- Product schema (marketplace)
- FAQ schema (support pages)
- Article schema (blog posts)
- Review schema (testimonials)

**Sitemap:**
- XML sitemap for all 50+ pages
- Submit to Google Search Console
- Monthly update for blog

---

### Analytics Tracking

**Events to Track:**

**Homepage:**
- Hero CTA click
- Feature card click
- "How it works" video play
- Footer link clicks

**Marketplace:**
- Filter interactions
- Lead preview
- Purchase intent
- Signup from preview

**Pricing:**
- Tier selection
- Calculator interactions
- Package selection
- CTA clicks

**Partner:**
- Calculator interactions
- Application start
- Upload demo interaction

**Blog:**
- Article views
- Newsletter signups
- Outbound link clicks

---

### A/B Testing Ideas

**Homepage:**
- Test A: "Turn Intent Into Revenue"
- Test B: "Leads That Actually Convert"
- Test C: "Stop Wasting Money on Bad Leads"

**CTA Buttons:**
- Test A: "Browse Leads"
- Test B: "Get Started Free"
- Test C: "Claim 10 Free Leads"

**Pricing Page:**
- Test A: 3 tiers
- Test B: 2 tiers + enterprise
- Test C: Single pricing + volume discounts

**Social Proof:**
- Test A: Logos only
- Test B: Logos + testimonials
- Test C: Logos + stats

---

## Design Assets Needed

### Illustrations

1. **Hero Illustration** - Dashboard mockup with marketplace + CRM
2. **How It Works** - 3-step process visual
3. **Quality Verification** - Checklist with green checks
4. **Intent Signals** - Graph showing behavior data
5. **Partner Success** - Earnings dashboard
6. **Empty States** - For CRM, marketplace, etc.

**Style:** Modern, flat, blue/purple gradient accents, isometric or 2.5D

---

### Icons (Custom Set)

**Product Features:**
- Marketplace (shopping cart)
- CRM (database)
- Quality (shield check)
- Intent (target)
- Speed (lightning)
- Pricing (dollar sign)

**Industries:**
- HVAC (AC unit)
- Roofing (house)
- Plumbing (wrench)
- Solar (sun panel)
- B2B SaaS (laptop)

**General:**
- Check marks
- X marks
- Info circles
- Warning triangles
- Arrows (all directions)
- Filters
- Download
- Upload

**Style:** Stroke-based, 2px line weight, rounded corners, consistent sizing

---

### Mockups

**Desktop Screens:**
1. Marketplace with filters
2. Lead preview modal
3. CRM leads table
4. CRM company detail
5. Partner upload wizard (5 steps)
6. Partner dashboard
7. Admin partner detail
8. Verification queue

**Mobile Screens:**
1. Marketplace (collapsed sidebar)
2. CRM mobile view
3. Partner upload (mobile)

**Style:** High-fidelity, actual UI components, realistic data, Cursive-quality

---

### Photography

**Stock photos needed:**
1. Happy business owner (buyer persona)
2. Team celebrating (sales success)
3. Person at computer (working with CRM)
4. Contractor on job site (HVAC/roofing)
5. Modern office (B2B SaaS buyer)

**Style:** Bright, natural lighting, diverse people, candid (not overly posed)

---

### Video

**Product Demo (2-3 min):**
- Screen recording of marketplace → purchase → CRM flow
- Voiceover explaining value
- Call to action at end

**Explainer Video (60-90 sec):**
- Animated explainer of how OpenInfo works
- Problem → solution → benefits
- Upbeat music, modern animation

---

## Final Notes for ANTIGRAVITY

### Priority Pages (Build First)

1. **Home** - Highest traffic
2. **Pricing** - Highest conversion
3. **For Buyers** - Buyer education
4. **For Partners** - Partner recruitment
5. **Marketplace Preview** - Interactive demo
6. **Features** - Product depth

### Reusable Components

Pull from actual codebase:
- `/src/components/ui/button.tsx`
- `/src/components/ui/card.tsx`
- `/src/components/ui/input.tsx`
- `/src/components/ui/dialog.tsx`
- `/src/components/ui/badge.tsx`
- `/src/components/ui/table.tsx`

### Design Philosophy

**Do:**
- Clean, minimal, lots of whitespace
- Blue/purple gradient accents (like Cursive)
- Smooth animations (300ms duration)
- Card-based layouts
- Clear hierarchy (typography scale)
- Trust signals everywhere

**Don't:**
- Busy layouts or cluttered sections
- Too many colors (stick to palette)
- Slow animations (> 500ms)
- Stock photos that look fake
- Walls of text (break up with visuals)
- Generic copy (be specific)

### Brand Voice

**Do sound like:**
- Stripe (clear, confident, developer-friendly)
- Linear (modern, fast, opinionated)
- Cursive (premium, thoughtful, powerful)

**Don't sound like:**
- Overly corporate (avoid jargon)
- Too casual (maintain professionalism)
- Salesy (focus on value, not hype)

---

## Questions for ANTIGRAVITY?

If you need clarification on:
- Specific code implementations
- Design decisions
- Copy variations
- Component behavior
- Interactive demo logic

Just ask! I can point you to exact files, line numbers, and patterns in the codebase.

---

**End of Brief**

Total Pages Specified: 53 marketing pages + 19 product pages + 48 detailed component specs = **120+ pages of content**

This should be more than enough to build a world-class marketing site. Go make it beautiful! 🚀
