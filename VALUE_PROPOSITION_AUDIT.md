# Cursive Value Proposition Audit & Simplification
**Date:** 2026-02-05
**Goal:** Users should understand "what is Cursive" and "what should I do next" in 10 seconds

---

## Executive Summary

**CURRENT PROBLEM:** The value proposition is **unclear and fragmented**. Multiple competing messages, feature-heavy language, and unclear next steps create confusion for new users.

**CORE INSIGHT:** Cursive does 3 things:
1. **Identify** anonymous website visitors
2. **Enrich** them with contact data
3. **Activate** them through AI-powered outreach

**RECOMMENDATION:** Simplify to ONE clear message everywhere, role-based CTAs, and obvious next steps.

---

## 1. HOMEPAGE/LANDING PAGE AUDIT

**File:** `/Users/adamwolfe/cursive-project/cursive-work/marketing/app/page.tsx`

### Current State

**Hero Message:**
- Title: "AI Intent Systems That Never Sleep"
- Description: "Identify and track website visitors, build targeted lists, launch direct mail campaigns, and maximize ad performance—all from one platform that unites verified B2C and B2B data."

**Problems:**
1. "AI Intent Systems" is too abstract - what does that mean?
2. Description lists 4+ different capabilities - too much cognitive load
3. Metadata description is 38 words long (should be <20)
4. No clear "who this is for" statement
5. Multiple competing value props (visitor ID, intent data, direct mail, ad performance)

### Proposed Fix

**NEW Hero Message (Marketing Site):**
```
Title: "See Who's Visiting Your Site. Reach Out Before They Leave."
Subtitle: "Cursive reveals anonymous website visitors, enriches them with verified contact data, and automates personalized outreach—so you never miss a warm lead."

WHO IT'S FOR: "Built for B2B SaaS teams who want to convert more website traffic into booked meetings"
```

**NEW Metadata (SEO):**
```typescript
title: "Identify Website Visitors & Automate Outreach | Cursive"
description: "Turn anonymous visitors into qualified leads. Cursive identifies website visitors, enriches contact data, and automates AI-powered outreach."
// 21 words vs. 38 words
```

**Benefits Section - Simplify to 3 Core Outcomes:**
```
1. KNOW WHO'S INTERESTED
   "70% of your anonymous visitors identified with name, company, and email"

2. REACH THEM FAST
   "AI agents send personalized outreach across email, LinkedIn, and SMS within hours"

3. BOOK MORE MEETINGS
   "Autonomous follow-ups and meeting scheduling that runs 24/7"
```

---

## 2. DASHBOARD CLARITY AUDIT

**File:** `/Users/adamwolfe/cursive-project/cursive-work/src/app/(dashboard)/dashboard/page.tsx`

### Current State

**What's Good:**
- Clean stats cards (Total Leads, Industry, Current Plan)
- Recent leads list
- Onboarding checklist component

**Problems:**
1. No clear "What should I do first?" guidance
2. 4 "Quick Actions" with no priority indication
3. Service tier upsell banner appears for free users but messaging is unclear ("Cursive Data" - what is that?)
4. Onboarding checklist has 5 steps but they're not prioritized
5. No indication of progress toward value (e.g., "0 campaigns created", "0 visitors identified")

### Proposed Fix

**Add "Getting Started" Hero Section (for new users with 0 leads):**
```tsx
{leadsCount === 0 && (
  <GradientCard variant="primary" className="mb-8">
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold text-white mb-3">
        Let's Get Your First Leads
      </h2>
      <p className="text-white/90 mb-6 max-w-2xl mx-auto">
        Choose how you want to use Cursive:
      </p>

      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* Option 1: DIY */}
        <Link href="/marketplace" className="bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Browse Marketplace</h3>
          <p className="text-sm text-white/80 mb-4">Buy pre-verified leads from our partners</p>
          <span className="text-xs text-white/70">Best for: Testing quickly</span>
        </Link>

        {/* Option 2: Identify Visitors */}
        <Link href="/integrations" className="bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Install Tracking</h3>
          <p className="text-sm text-white/80 mb-4">Identify your website visitors automatically</p>
          <span className="text-xs text-white/70">Best for: Ongoing pipeline</span>
        </Link>

        {/* Option 3: Done-for-you */}
        <Link href="/services" className="bg-white hover:bg-white/90 border-2 border-white rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-600 mb-2">Get Done-For-You</h3>
          <p className="text-sm text-blue-600 mb-4">We build + manage campaigns for you</p>
          <span className="text-xs text-blue-600/70">Best for: Hands-off approach</span>
        </Link>
      </div>
    </div>
  </GradientCard>
)}
```

**Simplify Quick Actions (Priority Order):**
```tsx
// ONLY show top 2-3 actions based on user state
1. If no campaigns: "Create Your First Campaign"
2. If no integrations: "Install Visitor Tracking"
3. Always: "Browse Marketplace"
```

---

## 3. NAVIGATION AUDIT

**File:** `/Users/adamwolfe/cursive-project/cursive-work/src/components/nav-bar.tsx`

### Current State

**Navigation Items (for owner/admin/member):**
- Dashboard
- Marketplace
- Queries
- Campaigns

**Problems:**
1. "Queries" is developer jargon - what does this mean to a user?
2. No indication of which section is most important
3. Missing key features (AI Studio, CRM) from top nav
4. Navigation doesn't match the value prop (Identify → Enrich → Activate)

### Proposed Fix

**NEW Navigation Structure (aligned with user journey):**
```tsx
const allNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Visitors', href: '/visitors', description: 'See who visited your site' },
  { name: 'Campaigns', href: '/campaigns', description: 'AI-powered outreach' },
  { name: 'Marketplace', href: '/marketplace', description: 'Buy verified leads' },
  { name: 'CRM', href: '/crm', description: 'Manage your pipeline' },
]
```

**Group Related Features in Dropdown:**
```tsx
// Advanced menu (dropdown)
- AI Studio (branding, offers, knowledge)
- Integrations
- Settings
```

---

## 4. ONBOARDING FLOW AUDIT

**Files:**
- `/Users/adamwolfe/cursive-project/cursive-work/src/app/(auth)/role-selection/page.tsx`
- `/Users/adamwolfe/cursive-project/cursive-work/src/app/(auth)/onboarding/page.tsx`
- `/Users/adamwolfe/cursive-project/cursive-work/src/components/onboarding/checklist.tsx`

### Current State

**Role Selection:**
- Two roles: Business vs. Partner
- Clear differentiation
- Good: Visual design, benefit lists

**Business Onboarding (3 steps):**
1. Business info (name, industry, website)
2. Service areas (US states)
3. Review & create

**Onboarding Checklist (5 items):**
1. Complete profile
2. Invite team
3. Purchase credits
4. Browse marketplace
5. Set up lead preferences

**Problems:**
1. Onboarding asks for service areas (US states) - confusing for B2B SaaS
2. No explanation of what happens after onboarding
3. Checklist has 5 items but no indication of which is most important
4. "Purchase credits" step assumes user knows what credits are
5. No "quick win" - user completes onboarding but has 0 leads

### Proposed Fix

**SIMPLIFY Role Selection:**
```tsx
// Current: "I'm a Business" vs "I'm a Partner"
// Problem: Too broad, unclear value prop

// NEW: More specific value props
"Buy Leads" → "I want to buy verified leads for my business"
"Sell Leads" → "I want to upload and sell leads (70% commission)"
"Install Tracking" → "I want to identify my own website visitors"
```

**SIMPLIFY Business Onboarding (2 steps only):**
```
Step 1: Tell us about your business
- Business name
- Website URL (optional)
- What do you sell? (dropdown: SaaS, Services, E-commerce, etc.)

Step 2: What do you want to do first?
○ Install visitor tracking (see who's on your site right now)
○ Browse marketplace (buy leads immediately)
○ Schedule onboarding call (we'll set everything up)
```

**REMOVE Service Areas Step:**
- This is confusing for B2B SaaS companies
- Can be configured later in settings if needed
- Not essential for first-time setup

**SIMPLIFY Checklist (3 items max):**
```
1. Choose your path (marketplace, tracking, or done-for-you)
2. Set up payment method
3. Create first campaign (or) Install tracking script
```

---

## 5. SERVICE TIERS AUDIT

**File:** `/Users/adamwolfe/cursive-project/cursive-work/src/app/services/page.tsx`

### Current State

**Current Behavior:**
- `/services` redirects to `https://meetcursive.com/#pricing`
- No in-app service tier explanation

**Problems:**
1. Users land on dashboard, see "Services" link, click, get redirected to external site
2. No clear explanation of service tiers in-app
3. Pricing page (separate file) shows subscription plans, but no "service tiers"
4. Dashboard upsell mentions "Cursive Data" but user has no context

### Proposed Fix

**CREATE In-App Services Page:**

**File:** `/Users/adamwolfe/cursive-project/cursive-work/src/app/services/page.tsx`

```tsx
export default function ServicesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Choose Your Approach"
        description="From DIY to done-for-you, we've got you covered"
      />

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {/* DIY */}
        <ServiceCard
          icon={<Package />}
          title="DIY Platform"
          price="$2k-5k/mo"
          description="Use the platform yourself"
          features={[
            "Visitor identification",
            "AI Studio for outreach",
            "CRM & integrations",
            "Marketplace access"
          ]}
          cta="Start Free"
          href="/signup"
        />

        {/* Data Service */}
        <ServiceCard
          icon={<Database />}
          title="Cursive Data"
          price="$1k/mo"
          description="We deliver 500+ fresh leads monthly"
          features={[
            "Custom lead lists",
            "Industry-specific targeting",
            "Verified contact data",
            "Weekly delivery"
          ]}
          cta="Get Started"
          href="/services/onboarding?tier=cursive-data"
          popular
        />

        {/* Done-for-you */}
        <ServiceCard
          icon={<Sparkles />}
          title="Cursive Outbound"
          price="$5k/mo"
          description="We run campaigns for you"
          features={[
            "Everything in Data",
            "Campaign strategy",
            "Content creation",
            "Meeting booking"
          ]}
          cta="Book Call"
          href="https://cal.com/adamwolfe/cursive-ai-audit"
        />
      </div>

      {/* Comparison Table */}
      <ComparisonTable className="mt-16" />
    </PageContainer>
  )
}
```

---

## 6. ROLE-BASED CTA STRATEGY

### Current State
- Homepage has 1 CTA: "Book Your Free AI Audit"
- Dashboard has multiple CTAs with no prioritization
- No differentiation for different user types

### Proposed Fix

**Define 3 User Personas:**

1. **DIY Users** (B2B SaaS, tech-savvy)
   - Primary CTA: "Start Free Trial"
   - Secondary CTA: "Install Visitor Tracking"
   - Value: Control, flexibility, hands-on

2. **Buyer Users** (Service businesses, less technical)
   - Primary CTA: "Browse Marketplace"
   - Secondary CTA: "Get Done-For-You Service"
   - Value: Speed, simplicity, no setup

3. **Enterprise Users** (need custom solution)
   - Primary CTA: "Book Strategy Call"
   - Secondary CTA: "See Platform Demo"
   - Value: Customization, dedicated support

**Implement Role Detection:**
```tsx
// Detect user type based on:
1. Industry vertical (from onboarding)
2. Company size (from enrichment data)
3. Behavior (marketplace vs. tracking installation)

// Show relevant CTAs:
if (persona === 'diy') {
  <Button>Install Tracking Script</Button>
}
if (persona === 'buyer') {
  <Button>Browse Marketplace</Button>
}
if (persona === 'enterprise') {
  <Button>Book Strategy Call</Button>
}
```

---

## 7. COPYWRITING FIXES

### Principle: Clear > Clever

**BEFORE vs. AFTER:**

| Before | After | Why |
|--------|-------|-----|
| "AI Intent Systems That Never Sleep" | "Identify Website Visitors & Book Meetings on Autopilot" | Specific action vs. abstract concept |
| "Build AI intent systems" | "Set up automated outreach in 10 minutes" | Concrete outcome vs. jargon |
| "Queries" (nav item) | "Lead Search" | User language vs. developer language |
| "Service tiers" | "Choose your approach" | Inviting vs. corporate |
| "Purchase marketplace credits" | "Add $100 to get started" | Specific vs. abstract |
| "Cursive Data" | "Custom Lead Lists (500+ leads/month)" | Descriptive vs. branded |

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Critical Fixes (Do First)
- [ ] **Homepage:** Update hero message (1 sentence value prop)
- [ ] **Homepage:** Add 3 clear benefit pillars (not 4+)
- [ ] **Dashboard:** Add "Getting Started" section for new users
- [ ] **Navigation:** Rename "Queries" to "Lead Search"
- [ ] **Onboarding:** Remove "Service Areas" step for B2B users

### Phase 2: UX Improvements
- [ ] **Dashboard:** Prioritize Quick Actions based on user state
- [ ] **Services:** Create in-app services page (don't redirect)
- [ ] **Checklist:** Reduce to 3 items max
- [ ] **Navigation:** Group advanced features in dropdown

### Phase 3: Role-Based Optimization
- [ ] **CTAs:** Implement role detection (DIY, Buyer, Enterprise)
- [ ] **Dashboard:** Show role-specific quick start guide
- [ ] **Onboarding:** Add "What do you want to do first?" step
- [ ] **Pricing:** Create role-based pricing pages

---

## 9. METRICS TO TRACK

**Success Metrics (10-second test):**
- Time to understand value prop (goal: <10 seconds)
- % of users who complete first action (goal: >40%)
- % of dashboard visitors who click CTA (goal: >25%)
- Bounce rate on homepage (goal: <60%)

**Track by User Segment:**
1. New visitors (never logged in)
2. Free users (0 leads)
3. Active users (1+ campaigns)
4. Paying customers

---

## 10. SUMMARY OF CHANGES

### Core Message (Everywhere)
**ONE SENTENCE:**
"Cursive identifies your website visitors, enriches them with verified contact data, and automates personalized outreach to book more meetings."

**THREE BENEFITS:**
1. Know who's interested (70% of visitors identified)
2. Reach them fast (AI agents work 24/7)
3. Book more meetings (autonomous follow-ups)

**THREE PATHS:**
1. DIY Platform (install tracking, use AI Studio)
2. Buy Leads (browse marketplace, get started fast)
3. Done-For-You (we run campaigns for you)

### Key Files to Update
1. `/marketing/app/page.tsx` - Hero message, metadata
2. `/src/app/(dashboard)/dashboard/page.tsx` - Getting started section
3. `/src/components/nav-bar.tsx` - Rename "Queries", add descriptions
4. `/src/app/(auth)/onboarding/page.tsx` - Remove service areas step
5. `/src/components/onboarding/checklist.tsx` - Reduce to 3 items
6. `/src/app/services/page.tsx` - Create in-app service tiers page

---

## NEXT STEPS

1. **Review this audit** with team
2. **Prioritize changes** (Phase 1 → 2 → 3)
3. **Update messaging** across all pages
4. **A/B test** new value props
5. **Measure** 10-second comprehension test with real users

---

**END OF AUDIT**
