# Technical SEO Audit Report
**Cursive Platform (meetcursive.com)**
**Date:** February 4, 2026
**Audited by:** Claude (SEO Audit Skill)

---

## Executive Summary

### Overall Health Assessment: **6.5/10**

The Cursive platform has a solid technical foundation with proper Next.js 15 implementation, but there are several critical SEO issues that need immediate attention. The site is currently in waitlist mode with limited public-facing content, which significantly impacts its SEO potential.

### Top 5 Priority Issues

1. **CRITICAL:** Missing canonical tags on most pages - no implementation found
2. **CRITICAL:** No structured data implementation on live pages (components exist but not used)
3. **HIGH:** Missing Google Search Console verification
4. **HIGH:** Missing security headers (HSTS, CSP, X-Frame-Options)
5. **HIGH:** Homepage redirects to /waitlist - poor UX and SEO

### Quick Wins Identified

1. Add canonical tags to all pages (Next.js metadata API)
2. Implement structured data on pricing page (components already exist)
3. Add missing security headers in next.config.js
4. Add Google Search Console verification
5. Optimize image alt text (currently missing on many marketing images)

---

## 1. Crawlability

### Robots.txt ✅ GOOD

**File:** `/src/app/robots.ts`

**Status:** Properly configured

**Implementation:**
```typescript
userAgent: '*'
allow: '/'
disallow: ['/api/', '/admin/', '/dashboard/', '/_next/', '/private/']
sitemap: 'https://meetcursive.com/sitemap.xml'
```

**Findings:**
- ✅ Googlebot allowed on all marketing pages
- ✅ Properly blocks admin, dashboard, and API routes
- ✅ Blocks GPTBot and ChatGPT-User (prevents AI scraping)
- ✅ References sitemap correctly

**Issues:** None

**Priority:** N/A

---

### XML Sitemap ⚠️ NEEDS IMPROVEMENT

**File:** `/src/app/sitemap.ts`

**Status:** Generated but contains non-existent pages

**Findings:**

✅ **Good:**
- Dynamic sitemap generation implemented
- Proper priority and changeFrequency values
- Includes lastModified timestamps

❌ **Issues:**

1. **Issue:** Sitemap includes pages that don't exist
   - `/about` - not found
   - `/solutions` - not found
   - `/integrations` - not found
   - `/blog` - directory doesn't exist
   - `/contact` - redirects
   - `/docs` - not implemented
   - `/solutions/engineering`, `/solutions/marketing`, etc. - don't exist
   - `/docs/*` pages - don't exist
   - Blog posts - hardcoded fake posts

2. **Issue:** Missing actual pages from sitemap
   - `/services` - exists but not in sitemap
   - `/services/checkout` - exists but not in sitemap
   - `/services/contact` - exists but not in sitemap
   - `/marketplace` - exists but should be noindex
   - `/partner` - exists but should be noindex

**Impact:** HIGH - Google is crawling 404 pages, wasting crawl budget

**Fix:**
```typescript
// Remove all non-existent pages
const staticPages = [
  '',           // Homepage (redirects to /waitlist)
  '/waitlist',  // Public waitlist page
  '/pricing',   // Pricing page
  '/services',  // Services hub
]

// Remove fake blog posts and solution pages until they exist
```

**Priority:** HIGH (P1)

---

### Site Architecture ❌ CRITICAL

**Findings:**

❌ **Critical Issue:** Homepage (`/`) redirects to `/waitlist`

**File:** `/src/app/page.tsx`
```typescript
export default function Home() {
  redirect('/waitlist')
}
```

**Impact:** CRITICAL
- Poor user experience
- Wastes link equity
- Confusing for search engines
- Homepage should be most important page, not redirect

**Fix:** Create a proper marketing homepage at `/` and move waitlist to `/join` or keep it as secondary CTA

❌ **Issue:** Multiple redirect layers

Example redirect chain:
1. User visits `https://meetcursive.com`
2. Redirects to `/waitlist`
3. Middleware may add additional redirects based on auth state

**Impact:** HIGH - Redirect chains slow down crawlers and waste crawl budget

**Fix:** Eliminate all redirect chains; use direct links

✅ **Good:** Important pages generally within 3 clicks (when they exist)

**Priority:** CRITICAL (P0)

---

### Orphan Pages 🔍 UNKNOWN

**Status:** Cannot verify without full site crawl

**Recommendation:** Use Screaming Frog or similar tool to identify orphan pages once marketing site is live

**Priority:** MEDIUM (P2) - Check after launch

---

## 2. Indexation

### Index Status 🔍 NEEDS VERIFICATION

**Current State:** Site is in waitlist mode on `leads.meetcursive.com`

**site:meetcursive.com check:** Not performed (requires live verification)

**Expected indexed pages:**
- `/waitlist` - should be indexed
- `/pricing` - should be indexed
- `/services` - should be indexed

**Should NOT be indexed:**
- `/dashboard/*` - protected routes
- `/admin/*` - admin only
- `/api/*` - API endpoints
- `/marketplace/*` - user-specific
- `/partner/*` - partner only

**Action Required:**
1. Perform `site:meetcursive.com` search in Google
2. Check Google Search Console Coverage report
3. Document what's currently indexed
4. Identify unexpected indexed pages

**Priority:** HIGH (P1) - Do immediately

---

### Canonical Tags ❌ CRITICAL

**Status:** NOT IMPLEMENTED

**Findings:**

❌ **Critical Issue:** No canonical tags found in metadata

Searched all page files - no canonical implementation found in:
- `/src/app/layout.tsx` - base metadata has no canonical
- `/src/app/pricing/page.tsx` - no canonical
- `/src/app/waitlist/page.tsx` - no canonical
- Other pages - no canonical

**Current metadata structure:**
```typescript
export const metadata: Metadata = {
  title: '...',
  description: '...',
  // ❌ NO CANONICAL TAG
}
```

**Impact:** CRITICAL
- Duplicate content issues
- No control over which URL Google indexes
- Potential issues with:
  - `http://` vs `https://`
  - `www.` vs non-www
  - Trailing slashes
  - Query parameters

**Fix:** Add canonical to all pages

```typescript
// In layout.tsx
export const metadata: Metadata = {
  title: 'Cursive - AI Intent Systems That Never Sleep',
  description: '...',
  metadataBase: new URL('https://meetcursive.com'),
  alternates: {
    canonical: '/',
  },
  // ... rest of metadata
}

// In individual pages (e.g., pricing/page.tsx)
export const metadata: Metadata = {
  title: 'Pricing',
  description: '...',
  alternates: {
    canonical: '/pricing',
  },
}
```

**Priority:** CRITICAL (P0) - Implement immediately

---

### Noindex Tags ✅ GOOD

**Findings:**

✅ No unintentional noindex tags found on important pages

**Verified:**
- `/src/app/layout.tsx` - `robots: { index: true, follow: true }`
- `/src/app/waitlist/page.tsx` - `robots: { index: true, follow: true }`
- `/src/app/pricing/page.tsx` - No explicit noindex

**Recommendation:** Add explicit `robots: { index: true, follow: true }` to all public marketing pages

**Priority:** LOW (P3)

---

### Redirect Chains/Loops ⚠️ NEEDS REVIEW

**Findings:**

⚠️ **Potential Issue:** Homepage redirect

```typescript
// src/app/page.tsx
export default function Home() {
  redirect('/waitlist')
}
```

This creates a 307/308 redirect that could be chained with:
- HTTPS redirects (if configured at hosting level)
- www redirects (if configured)
- Trailing slash redirects (Next.js default)

**Action Required:**
1. Test redirect chain: `curl -I http://meetcursive.com`
2. Test: `curl -I http://www.meetcursive.com`
3. Test: `curl -I https://meetcursive.com/`
4. Verify no more than 1 redirect

**Priority:** HIGH (P1)

---

### Duplicate Content ⚠️ POTENTIAL ISSUES

**Findings:**

⚠️ **Potential Issue:** URL variations

Without canonical tags, these could all be indexed separately:
- `http://meetcursive.com/pricing`
- `https://meetcursive.com/pricing`
- `http://www.meetcursive.com/pricing`
- `https://www.meetcursive.com/pricing`
- `https://meetcursive.com/pricing/`
- `https://leads.meetcursive.com/pricing` (subdomain)

**Fix:**
1. Add canonical tags (see above)
2. Implement 301 redirects at hosting level:
   - All HTTP → HTTPS
   - www → non-www (or vice versa)
   - Trailing slash consistency

**Priority:** HIGH (P1)

---

## 3. Site Speed & Core Web Vitals

### Build Performance ✅ GOOD

**Build Results:**
```
✓ Compiled successfully in 3.6s
✓ Generating static pages (2/2)
Route (pages)                Size    First Load JS
─ ○ /404                    180 B    98.3 kB
+ First Load JS shared      98.1 kB
```

**Findings:**

✅ **Good:**
- Fast build time (3.6s)
- Small bundle size (98.1 kB shared)
- Static generation working
- No build errors

**Priority:** N/A

---

### Image Optimization ⚠️ NEEDS IMPROVEMENT

**Configuration:** `/next.config.js`

✅ **Good:**
```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

❌ **Issues:**

1. **Issue:** Large unoptimized images in `/public` directory
   - `cursive web image.png` - 558KB (likely too large)
   - `Google_Sheets_Logo_512px.png` - 100KB
   - `Salesforce.com_logo.svg.png` - 56KB
   - `zapier-logo-png-transparent.png` - 69KB

2. **Issue:** Not all images use Next.js `<Image>` component

**Impact:** MEDIUM - Slow page loads, poor Core Web Vitals

**Fix:**
1. Convert all PNG/JPG to WebP/AVIF
2. Compress all images (use tinypng.com or similar)
3. Replace all `<img>` tags with Next.js `<Image>` component
4. Add proper `width` and `height` attributes
5. Add meaningful `alt` text (currently missing on marketing images)

**Priority:** HIGH (P1)

---

### Core Web Vitals 🔍 NEEDS TESTING

**Status:** Not tested (requires live site + Lighthouse audit)

**Action Required:**

1. **Run PageSpeed Insights** on:
   - `https://meetcursive.com`
   - `https://meetcursive.com/pricing`
   - `https://meetcursive.com/waitlist`

2. **Target Metrics:**
   - LCP (Largest Contentful Paint): < 2.5s ⚠️ UNKNOWN
   - INP (Interaction to Next Paint): < 200ms ⚠️ UNKNOWN
   - CLS (Cumulative Layout Shift): < 0.1 ⚠️ UNKNOWN

3. **Check:**
   - Time to First Byte (TTFB)
   - Total Blocking Time (TBT)
   - First Contentful Paint (FCP)

**Potential Issues Identified:**

⚠️ **Middleware overhead:**
```typescript
// src/middleware.ts - Complex auth checks on every request
const sessionPromise = supabase.auth.getSession()
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Auth session timeout')), 5000)
)
```

This 5-second timeout could significantly impact TTFB on protected routes.

**Recommendation:**
- Bypass middleware for static marketing pages
- Use edge caching for `/pricing`, `/waitlist`

**Priority:** HIGH (P1) - Test immediately

---

### CSS/JS Minification ✅ GOOD

**Findings:**

✅ Next.js 15 automatically minifies CSS/JS in production build

✅ **Good configuration:**
```javascript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn'],
  } : false,
}
```

**Priority:** N/A

---

### Caching Headers ⚠️ PARTIAL

**Configuration:** `/next.config.js`

✅ **Good:**
```javascript
async headers() {
  return [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ]
}
```

❌ **Missing:**
- No cache headers for images
- No cache headers for API routes
- No cache headers for marketing pages

**Fix:**
```javascript
async headers() {
  return [
    {
      source: '/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/(pricing|services|waitlist)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate' },
      ],
    },
  ]
}
```

**Priority:** MEDIUM (P2)

---

## 4. Mobile Optimization

### Viewport Configuration ✅ GOOD

**File:** `/src/app/layout.tsx`

```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7c3aed',
}
```

✅ Properly configured for mobile

**Priority:** N/A

---

### Responsive Design 🔍 NEEDS TESTING

**Status:** Cannot verify without live testing

**Action Required:**
1. Run Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
2. Test on real devices (iOS, Android)
3. Check Tailwind responsive classes (found throughout codebase)

**Potential Issues:**

⚠️ **Tailwind classes used but need verification:**
- Touch targets (buttons, links)
- Font sizes (minimum 16px to prevent zoom)
- Horizontal scroll
- Tap target spacing (48px minimum)

**Priority:** HIGH (P1) - Test immediately

---

### PWA Configuration ⚠️ INCOMPLETE

**File:** `/public/manifest.json`

✅ **Good:**
- Manifest exists
- Icons defined (72x72 to 512x512)
- Theme color set
- Shortcuts defined

❌ **Issues:**

1. **Outdated branding:** Name was "LeadMe" not "Cursive" (FIXED)
   ```json
   "name": "Cursive - Lead Generation Platform",
   "short_name": "Cursive",
   ```

2. **Broken icon references:**
   - `/icons/icon-72x72.png` - may not exist
   - `/screenshots/dashboard.png` - may not exist
   - `/icons/shortcut-query.png` - may not exist

**Fix:**
1. Update branding to "Cursive"
2. Verify all icon files exist
3. Generate missing icons if needed

**Priority:** MEDIUM (P2)

---

## 5. Security

### HTTPS ✅ ASSUMED GOOD

**Status:** Using `https://meetcursive.com` in metadata

**Assumptions:**
- Vercel hosting likely handles HTTPS automatically
- SSL certificate auto-renewed by Vercel

**Action Required:**
1. Verify SSL certificate at https://www.ssllabs.com/ssltest/
2. Check certificate expiration
3. Verify A+ rating

**Priority:** MEDIUM (P2) - Verify only

---

### Security Headers ❌ CRITICAL

**File:** `/next.config.js`

**Current Headers:**
```javascript
headers: [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
]
```

❌ **CRITICAL Missing Headers:**

1. **Strict-Transport-Security (HSTS)**
   ```javascript
   {
     key: 'Strict-Transport-Security',
     value: 'max-age=31536000; includeSubDomains; preload'
   }
   ```

2. **Content-Security-Policy (CSP)**
   ```javascript
   {
     key: 'Content-Security-Policy',
     value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
   }
   ```

3. **X-Frame-Options**
   ```javascript
   {
     key: 'X-Frame-Options',
     value: 'SAMEORIGIN'
   }
   ```

4. **Permissions-Policy**
   ```javascript
   {
     key: 'Permissions-Policy',
     value: 'camera=(), microphone=(), geolocation=()'
   }
   ```

**Impact:** CRITICAL - Site vulnerable to:
- Clickjacking attacks
- XSS attacks
- Man-in-the-middle attacks
- Session hijacking

**Priority:** CRITICAL (P0)

---

### Mixed Content ✅ GOOD

**Findings:**

✅ No hardcoded HTTP URLs found in codebase
✅ All references use HTTPS or protocol-relative URLs

**Priority:** N/A

---

## 6. Schema Markup (Structured Data)

### Implementation Status ❌ NOT IMPLEMENTED

**Files Found:**
- `/src/lib/seo/index.ts` - Schema generators exist ✅
- `/src/components/marketing/seo/structured-data.tsx` - Components exist ✅

**Available Schemas:**
- ✅ Organization schema
- ✅ SoftwareApplication schema
- ✅ FAQPage schema
- ✅ BlogPosting schema
- ✅ BreadcrumbList schema
- ✅ Product/Pricing schema

❌ **CRITICAL Issue:** Schema components are NOT USED on any pages

**Verified:**
- `/src/app/layout.tsx` - No schema
- `/src/app/pricing/page.tsx` - No schema (despite having FAQ section!)
- `/src/app/waitlist/page.tsx` - No schema
- Other pages - No schema

**Impact:** CRITICAL
- Missing rich snippets in search results
- No star ratings shown
- No FAQ rich results
- Poor CTR from SERPs

---

### Organization Schema ❌ NOT IMPLEMENTED

**Status:** Code exists but not used

**File:** `/src/lib/seo/index.ts`

**Implementation:**
```typescript
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cursive',
    url: 'https://meetcursive.com',
    logo: 'https://meetcursive.com/logo.png',
    description: '...',
    sameAs: [
      'https://twitter.com/meetcursive',
      'https://github.com/meetcursive',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-CURSIVE',
      contactType: 'customer service',
    },
  }
}
```

⚠️ **Issue:** Fake phone number `+1-800-CURSIVE` - needs real number

**Fix:** Add to `/src/app/layout.tsx`:
```tsx
import { OrganizationJsonLd } from '@/components/marketing'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <OrganizationJsonLd />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Priority:** CRITICAL (P0)

---

### FAQPage Schema ❌ NOT IMPLEMENTED

**Status:** Code exists but not used on pricing page

**File:** `/src/app/pricing/page.tsx`

**Current State:**
- Page has 6 FAQ items ✅
- FAQJsonLd component exists ✅
- Component NOT used ❌

**Impact:** HIGH - Missing FAQ rich results in Google

**Fix:**
```tsx
import { PricingPageJsonLd } from '@/components/marketing'

export default async function PricingPage() {
  const faqs = [
    {
      question: 'What counts as a lead?',
      answer: 'A lead is a company we identify...'
    },
    // ... other FAQs
  ]

  return (
    <>
      <PricingPageJsonLd faqs={faqs} />
      {/* Rest of page */}
    </>
  )
}
```

**Priority:** HIGH (P1)

---

### SoftwareApplication Schema ❌ NOT IMPLEMENTED

**Status:** Code exists but not used

**File:** `/src/lib/seo/index.ts`

⚠️ **Issues with implementation:**

1. **Fake ratings:**
   ```typescript
   aggregateRating: {
     ratingValue: '4.9',
     ratingCount: '1250',
   }
   ```
   This violates Google's guidelines - ratings must be real.

2. **Incorrect pricing:**
   ```typescript
   offers: {
     lowPrice: '0',
     highPrice: '99',
   }
   ```
   Needs to match actual pricing from database.

**Fix:**
1. Remove fake ratings (or use real G2/Capterra ratings)
2. Fetch actual pricing from subscription_plans table
3. Add to homepage

**Priority:** HIGH (P1)

---

### BlogPosting Schema 🔍 N/A

**Status:** No blog exists yet

**Recommendation:** Implement when blog is created

**Priority:** N/A (future)

---

### BreadcrumbList Schema 🔍 RECOMMENDED

**Status:** Not implemented, but would be useful

**Use Cases:**
- `/services/checkout` → Home > Services > Checkout
- `/pricing` → Home > Pricing
- `/blog/[slug]` → Home > Blog > Post Title

**Priority:** MEDIUM (P2)

---

### Validation Status ❌ NOT TESTED

**Action Required:**

1. Test Organization schema at: https://search.google.com/test/rich-results
2. Test FAQ schema at: https://search.google.com/test/rich-results
3. Test Software schema at: https://search.google.com/test/rich-results

**Priority:** HIGH (P1) - After implementing schemas

---

## 7. Canonical Tags (Detailed)

### Current State ❌ NONE IMPLEMENTED

**Critical Findings:**

1. **No canonical in root layout:**
   ```typescript
   // src/app/layout.tsx
   export const metadata: Metadata = {
     title: 'Cursive - AI Intent Systems That Never Sleep',
     description: '...',
     // ❌ NO CANONICAL
   }
   ```

2. **No canonical in pricing:**
   ```typescript
   // src/app/pricing/page.tsx
   export const metadata = {
     title: 'Pricing',
     description: '...',
     // ❌ NO CANONICAL
   }
   ```

3. **No canonical in waitlist:**
   ```typescript
   // src/app/waitlist/page.tsx
   export const metadata: Metadata = {
     title: 'Join the Waitlist | Cursive',
     description: '...',
     // ❌ NO CANONICAL
   }
   ```

---

### Self-Referencing Canonicals ❌ MISSING

**Required on:**
- ✅ `/` (homepage)
- ✅ `/pricing`
- ✅ `/waitlist`
- ✅ `/services`
- ✅ All future marketing pages

**Implementation:**
```typescript
export const metadata: Metadata = {
  title: 'Page Title',
  description: '...',
  alternates: {
    canonical: '/current-path',
  },
}
```

**Priority:** CRITICAL (P0)

---

### HTTP → HTTPS Canonicals ⚠️ NEEDS VERIFICATION

**Status:** Likely handled by hosting (Vercel)

**Action Required:**
1. Test: `curl -I http://meetcursive.com`
2. Verify 301 redirect to HTTPS
3. Ensure redirect happens at edge, not in application

**Priority:** HIGH (P1)

---

### Trailing Slash Consistency ⚠️ NEEDS CONFIGURATION

**Current State:** Next.js default behavior

**Issue:** Both versions may be accessible:
- `/pricing` (no trailing slash)
- `/pricing/` (with trailing slash)

**Fix:** Add to `next.config.js`:
```javascript
module.exports = {
  trailingSlash: false, // Choose one: true or false
  // ...
}
```

**Recommendation:** `trailingSlash: false` (cleaner URLs)

**Priority:** MEDIUM (P2)

---

### www vs non-www ⚠️ NEEDS VERIFICATION

**Status:** Unknown - needs testing

**Action Required:**
1. Test: `curl -I http://www.meetcursive.com`
2. Test: `curl -I https://www.meetcursive.com`
3. Verify ONE canonical version

**Recommendation:**
- Choose non-www (`meetcursive.com`)
- 301 redirect www to non-www at DNS level

**Priority:** HIGH (P1)

---

## 8. Additional Technical Findings

### Google Search Console ❌ NOT CONFIGURED

**File:** `/src/lib/seo/index.ts`

```typescript
verification: {
  google: process.env.GOOGLE_SITE_VERIFICATION,
}
```

❌ **Issue:** Environment variable likely not set

**Action Required:**
1. Add property to Google Search Console
2. Get verification meta tag
3. Add to `.env.local`:
   ```
   GOOGLE_SITE_VERIFICATION=your_verification_code
   ```
4. Deploy and verify

**Priority:** HIGH (P1)

---

### Analytics Tracking ⚠️ NOT CONFIGURED

**Findings:**

No analytics implementation found:
- ❌ No Google Analytics
- ❌ No Google Tag Manager
- ❌ No Plausible/Fathom

**Recommendation:**
1. Add Google Analytics 4
2. Track Core Web Vitals
3. Monitor SEO performance

**Priority:** MEDIUM (P2)

---

### Meta Descriptions ⚠️ NEEDS IMPROVEMENT

**Findings:**

✅ **Good pages:**
- Root layout: 200 characters
- Waitlist: 195 characters
- Pricing: 62 characters ⚠️ (too short)

❌ **Issues:**

1. **Pricing meta description too short:**
   ```typescript
   description: 'Simple, transparent pricing for B2B lead intelligence.'
   // Only 62 characters - should be 150-160
   ```

2. **Generic descriptions:**
   Some descriptions are too generic, missing key selling points

**Fix:**
```typescript
// pricing/page.tsx
export const metadata = {
  title: 'Pricing - Cursive Lead Intelligence',
  description: 'Transparent pricing for AI-powered lead generation. Start free with 10 leads/month, or upgrade to Pro for 100 leads/month at $29. Enterprise plans available for high-volume needs.',
}
```

**Priority:** MEDIUM (P2)

---

### Open Graph Images ⚠️ NEEDS VERIFICATION

**Current:** `/cursive-logo.png`

**Issues:**
1. Image may not be optimized for OG (should be 1200x630)
2. No custom OG image for different pages
3. File may not exist or be too large

**Action Required:**
1. Create 1200x630 OG image for homepage
2. Create custom OG images for:
   - Pricing page
   - Services page
   - Blog posts (when created)
3. Verify images exist and load quickly

**Priority:** MEDIUM (P2)

---

### Title Tags ✅ MOSTLY GOOD

**Findings:**

✅ **Good:**
- Root layout: "Cursive - AI Intent Systems That Never Sleep" (48 chars)
- Waitlist: "Join the Waitlist | Cursive" (28 chars)
- Pricing: "Pricing" (7 chars) ⚠️

❌ **Issues:**

1. **Pricing title too short:**
   ```typescript
   title: 'Pricing'
   // Should be: 'Pricing - Cursive Lead Intelligence'
   ```

**Fix:**
```typescript
export const metadata = {
  title: 'Pricing - Cursive Lead Intelligence',
  // ...
}
```

**Priority:** LOW (P3)

---

### Internal Linking 🔍 NEEDS REVIEW

**Status:** Cannot verify without full site audit

**Observations:**
- Footer/header navigation not reviewed (need to see components)
- No obvious internal linking strategy
- Blog doesn't exist (no topical clusters)

**Recommendation:**
1. Create footer with links to:
   - Pricing
   - Services
   - About (when created)
   - Contact
   - Blog (when created)
2. Add contextual internal links in content
3. Create topic clusters when blog launches

**Priority:** MEDIUM (P2)

---

## 9. Prioritized Action Plan

### Phase 1: CRITICAL FIXES (P0) - Do Now

**Estimated Time:** 4-6 hours

1. **Add canonical tags to all pages**
   - Root layout: `canonical: '/'`
   - Pricing: `canonical: '/pricing'`
   - Waitlist: `canonical: '/waitlist'`
   - Services: `canonical: '/services'`

2. **Implement Organization schema**
   - Add `<OrganizationJsonLd />` to root layout
   - Update phone number to real number (or remove)
   - Verify social media URLs

3. **Add security headers**
   - HSTS header
   - X-Frame-Options
   - Content-Security-Policy (basic)
   - Permissions-Policy

4. **Fix homepage redirect**
   - Create proper marketing homepage
   - Remove redirect from `/`
   - Or move waitlist to `/join` and create landing page at `/`

5. **Fix sitemap**
   - Remove all non-existent pages
   - Add only real pages
   - Remove fake blog posts

---

### Phase 2: HIGH IMPACT (P1) - This Week

**Estimated Time:** 8-10 hours

1. **Implement FAQ schema on pricing**
   - Extract FAQ data
   - Add `<PricingPageJsonLd />`
   - Test with Rich Results Test

2. **Add Google Search Console**
   - Claim property
   - Add verification meta tag
   - Submit sitemap
   - Monitor coverage

3. **Run Core Web Vitals audit**
   - PageSpeed Insights on all pages
   - Fix LCP issues (likely image optimization)
   - Fix CLS issues (add dimensions to images)
   - Optimize middleware for public pages

4. **Optimize images**
   - Convert all images to WebP/AVIF
   - Compress all images
   - Replace `<img>` with `<Image>`
   - Add alt text to all images

5. **Test and fix redirect chains**
   - Test all URL variations
   - Ensure single redirect (if any)
   - Configure www vs non-www
   - Configure trailing slash

6. **Mobile-friendly testing**
   - Run mobile-friendly test
   - Test on real devices
   - Fix touch target sizes
   - Verify font sizes

---

### Phase 3: QUICK WINS (P2) - Next 2 Weeks

**Estimated Time:** 4-6 hours

1. **Improve meta descriptions**
   - Pricing page (expand to 150-160 chars)
   - Add compelling CTAs
   - Include key benefits

2. **Update PWA manifest**
   - Change "LeadMe" to "Cursive" (DONE)
   - Verify all icon files exist
   - Test manifest validity

3. **Add cache headers**
   - Cache images for 1 year
   - Cache marketing pages for 1 hour
   - Add stale-while-revalidate

4. **Create custom OG images**
   - Homepage: 1200x630
   - Pricing: 1200x630
   - Services: 1200x630

5. **Implement breadcrumbs**
   - Add BreadcrumbJsonLd to deep pages
   - Test with Rich Results Test

6. **Verify SSL/HTTPS**
   - Test at SSL Labs
   - Ensure A+ rating
   - Verify HTTPS redirect

---

### Phase 4: LONG-TERM (P3) - Next Month

**Estimated Time:** Ongoing

1. **Create marketing pages**
   - About page
   - Solutions pages
   - Integrations page
   - Contact page
   - Docs/Help center

2. **Launch blog**
   - Implement BlogPosting schema
   - Create content calendar
   - Build topic clusters
   - Internal linking strategy

3. **Monitor and optimize**
   - Weekly Search Console checks
   - Monthly Core Web Vitals review
   - Quarterly full SEO audit
   - Track organic traffic growth

4. **Advanced schema**
   - Product schema with real pricing
   - Review schema (when have reviews)
   - HowTo schema (for guides)
   - VideoObject schema (for video content)

5. **Performance optimization**
   - Implement ISR for dynamic pages
   - Add edge caching
   - Optimize database queries
   - Implement service worker

---

## 10. Implementation Checklist

### Canonical Tags
- [ ] Add `metadataBase: new URL('https://meetcursive.com')` to root layout
- [ ] Add `canonical: '/'` to homepage
- [ ] Add `canonical: '/pricing'` to pricing page
- [ ] Add `canonical: '/waitlist'` to waitlist page
- [ ] Add `canonical: '/services'` to services page
- [ ] Test with View Source on live site
- [ ] Verify canonical tag in `<head>`

### Structured Data
- [ ] Import `OrganizationJsonLd` in root layout
- [ ] Update organization contact info (phone, email)
- [ ] Add Organization schema to site
- [ ] Extract FAQ data from pricing page
- [ ] Implement `PricingPageJsonLd` on pricing page
- [ ] Test Organization schema at Rich Results Test
- [ ] Test FAQ schema at Rich Results Test
- [ ] Fix/remove fake review data from Software schema
- [ ] Verify all schema passes validation

### Security Headers
- [ ] Add HSTS header to next.config.js
- [ ] Add X-Frame-Options header
- [ ] Add basic CSP header
- [ ] Add Permissions-Policy header
- [ ] Test headers with securityheaders.com
- [ ] Verify A rating on Security Headers

### Sitemap
- [ ] Remove `/about` from sitemap
- [ ] Remove `/solutions` from sitemap
- [ ] Remove `/integrations` from sitemap
- [ ] Remove `/blog` from sitemap
- [ ] Remove `/contact` from sitemap
- [ ] Remove `/docs` from sitemap
- [ ] Remove fake blog posts from sitemap
- [ ] Remove solution pages from sitemap
- [ ] Add `/services` to sitemap
- [ ] Verify sitemap.xml is accessible
- [ ] Submit updated sitemap to Search Console

### Homepage
- [ ] Create proper marketing homepage at `/`
- [ ] Remove redirect from `/src/app/page.tsx`
- [ ] Add hero section
- [ ] Add value proposition
- [ ] Add social proof
- [ ] Add CTAs (waitlist, pricing)
- [ ] Add Organization + Software schema
- [ ] Test page loads correctly

### Google Search Console
- [ ] Create Search Console property
- [ ] Get verification meta tag
- [ ] Add `GOOGLE_SITE_VERIFICATION` to .env
- [ ] Deploy and verify ownership
- [ ] Submit sitemap
- [ ] Enable email alerts
- [ ] Check Coverage report

### Images
- [ ] Audit all images in `/public`
- [ ] Convert large PNGs to WebP
- [ ] Compress all images (< 100KB each)
- [ ] Replace `<img>` with `<Image>` in components
- [ ] Add width/height to all images
- [ ] Add meaningful alt text to all images
- [ ] Lazy load below-fold images
- [ ] Test image loading performance

### Core Web Vitals
- [ ] Run Lighthouse audit on homepage
- [ ] Run Lighthouse audit on pricing
- [ ] Run Lighthouse audit on waitlist
- [ ] Fix LCP issues (target < 2.5s)
- [ ] Fix INP issues (target < 200ms)
- [ ] Fix CLS issues (target < 0.1)
- [ ] Optimize middleware for public pages
- [ ] Add loading="lazy" to images
- [ ] Test on slow 3G connection

### Mobile Optimization
- [ ] Run mobile-friendly test on all pages
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Verify touch targets > 48px
- [ ] Verify font sizes > 16px
- [ ] Check for horizontal scroll
- [ ] Test form inputs on mobile
- [ ] Verify viewport meta tag

### Redirects
- [ ] Test: `curl -I http://meetcursive.com`
- [ ] Test: `curl -I https://www.meetcursive.com`
- [ ] Test: `curl -I https://meetcursive.com/pricing/`
- [ ] Ensure max 1 redirect per URL
- [ ] Configure www redirect at DNS
- [ ] Set `trailingSlash: false` in config
- [ ] Test all redirect chains eliminated

### Meta Descriptions
- [ ] Expand pricing description to 150-160 chars
- [ ] Add compelling CTA to descriptions
- [ ] Include key benefits in descriptions
- [ ] Verify all pages have unique descriptions
- [ ] Test descriptions in SERP preview tool
- [ ] Avoid duplicate descriptions

### PWA Manifest
- [ ] Update name to "Cursive"
- [ ] Update short_name to "Cursive"
- [ ] Verify all icon files exist
- [ ] Generate missing icons
- [ ] Test manifest at web.dev
- [ ] Verify manifest loads correctly

### SSL/HTTPS
- [ ] Test at https://www.ssllabs.com/ssltest/
- [ ] Verify A+ rating
- [ ] Check certificate expiration
- [ ] Verify HTTPS redirect works
- [ ] Check for mixed content warnings
- [ ] Test on multiple browsers

---

## 11. Before/After Comparisons

### Canonical Tags

**BEFORE:**
```typescript
// No canonical tag
export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for B2B lead intelligence.',
}
```

**AFTER:**
```typescript
export const metadata: Metadata = {
  title: 'Pricing - Cursive Lead Intelligence',
  description: 'Transparent pricing for AI-powered lead generation. Start free with 10 leads/month, or upgrade to Pro for 100 leads/month at $29. Enterprise plans available.',
  alternates: {
    canonical: '/pricing',
  },
}
```

---

### Structured Data

**BEFORE:**
```tsx
// No structured data
export default async function PricingPage() {
  return <div>...</div>
}
```

**AFTER:**
```tsx
import { PricingPageJsonLd } from '@/components/marketing'

export default async function PricingPage() {
  const faqs = [
    { question: 'What counts as a lead?', answer: '...' },
    { question: 'Can I cancel anytime?', answer: '...' },
    // ...
  ]

  return (
    <>
      <PricingPageJsonLd faqs={faqs} />
      <div>...</div>
    </>
  )
}
```

---

### Security Headers

**BEFORE:**
```javascript
headers: [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
]
```

**AFTER:**
```javascript
headers: [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```

---

### Sitemap

**BEFORE:**
```typescript
const staticPages = [
  '',
  '/about',        // ❌ Doesn't exist
  '/pricing',
  '/solutions',    // ❌ Doesn't exist
  '/integrations', // ❌ Doesn't exist
  '/blog',         // ❌ Doesn't exist
  '/contact',      // ❌ Doesn't exist
  '/docs',         // ❌ Doesn't exist
]
```

**AFTER:**
```typescript
const staticPages = [
  '',
  '/waitlist',
  '/pricing',
  '/services',
]
```

---

### Homepage

**BEFORE:**
```typescript
// Redirect to waitlist
export default function Home() {
  redirect('/waitlist')
}
```

**AFTER:**
```tsx
import { OrganizationJsonLd, SoftwareJsonLd } from '@/components/marketing'

export const metadata: Metadata = {
  title: 'Cursive - AI Intent Systems That Never Sleep',
  description: '...',
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  return (
    <>
      <OrganizationJsonLd />
      <SoftwareJsonLd />
      <main>
        <Hero />
        <Features />
        <SocialProof />
        <CTA />
      </main>
    </>
  )
}
```

---

## 12. Monitoring & Maintenance

### Weekly Tasks
- [ ] Check Search Console for errors
- [ ] Review Coverage report for new issues
- [ ] Check Core Web Vitals report
- [ ] Monitor organic traffic in Analytics

### Monthly Tasks
- [ ] Run full Lighthouse audit
- [ ] Review PageSpeed Insights scores
- [ ] Check for new 404 errors
- [ ] Update sitemap if new pages added
- [ ] Review keyword rankings

### Quarterly Tasks
- [ ] Full technical SEO audit
- [ ] Review structured data implementation
- [ ] Check for new Google algorithm updates
- [ ] Update content for freshness
- [ ] Competitor SEO analysis

---

## 13. Tools & Resources

### Free Tools Used
- ✅ Next.js built-in sitemap/robots
- ✅ Next.js metadata API
- ⚠️ Google Search Console (needs setup)
- 🔍 PageSpeed Insights (needs testing)
- 🔍 Mobile-Friendly Test (needs testing)
- 🔍 Rich Results Test (needs testing)

### Recommended Tools
- **Screaming Frog** - Full site crawl (after launch)
- **Google Analytics 4** - Traffic monitoring
- **Ahrefs/Semrush** - Keyword research & tracking
- **Hotjar** - User behavior (for CRO)
- **Vercel Analytics** - Core Web Vitals monitoring

---

## 14. Risk Assessment

### High Risk Issues
1. **No canonical tags** - Duplicate content penalties possible
2. **Missing security headers** - Vulnerable to attacks
3. **Homepage redirect** - Poor UX, wasted link equity
4. **No structured data** - Missing rich results, lower CTR
5. **Sitemap has 404s** - Wasting crawl budget

### Medium Risk Issues
1. **Large images** - Slow Core Web Vitals
2. **No Search Console** - Can't monitor issues
3. **Redirect chains** - Slower crawling
4. **Missing cache headers** - Slower page loads

### Low Risk Issues
1. **Short meta descriptions** - Suboptimal CTR
2. **PWA branding** - Incorrect name (minor UX issue)
3. **No analytics** - Can't measure success

---

## 15. Expected Outcomes

### After Phase 1 (Critical Fixes)
- ✅ No duplicate content issues
- ✅ Proper canonicalization
- ✅ Basic structured data (Organization)
- ✅ Security headers in place
- ✅ Clean sitemap with only real pages

### After Phase 2 (High Impact)
- ✅ FAQ rich results in Google
- ✅ Search Console monitoring active
- ✅ Core Web Vitals > 90
- ✅ Fast page loads (< 2s LCP)
- ✅ Mobile-friendly

### After Phase 3 (Quick Wins)
- ✅ Better click-through rates
- ✅ Improved OG previews
- ✅ Faster cache performance
- ✅ Better branding consistency

### After Phase 4 (Long-term)
- ✅ Growing organic traffic
- ✅ Multiple ranking pages
- ✅ Strong topical authority
- ✅ Established brand presence

---

## 16. Summary of Files to Modify

### Critical Files
1. `/src/app/layout.tsx` - Add canonical, Organization schema
2. `/src/app/pricing/page.tsx` - Add canonical, FAQ schema, better meta
3. `/src/app/waitlist/page.tsx` - Add canonical
4. `/src/app/page.tsx` - Remove redirect, create homepage
5. `/src/app/sitemap.ts` - Remove 404 pages
6. `/next.config.js` - Add security headers, cache headers

### Environment Variables
1. `.env.local` - Add `GOOGLE_SITE_VERIFICATION`

### New Files Needed
1. `/src/app/og-image.png` - 1200x630 OG image for homepage
2. `/src/app/pricing/og-image.png` - 1200x630 OG image for pricing
3. `/public/icons/*` - PWA icons (if missing)

---

## 17. Questions for Stakeholders

1. **Homepage Strategy:**
   - Do you want to keep the waitlist-first approach?
   - Or create a traditional marketing homepage at `/`?
   - What should be the primary CTA?

2. **Contact Information:**
   - What's the correct phone number for Organization schema?
   - What's the support email?
   - Do you have a physical address to add?

3. **Social Proof:**
   - Do you have real customer reviews (G2, Capterra)?
   - Can we remove the fake 4.9/5 rating from Software schema?
   - What's the actual customer count?

4. **Content Roadmap:**
   - When will the blog launch?
   - What other marketing pages are planned?
   - Do you need help creating /about, /contact, etc.?

5. **Analytics:**
   - Which analytics platform to use (GA4, Plausible, other)?
   - What conversion goals to track?
   - Need help setting up tracking?

---

## 18. Conclusion

The Cursive platform has a **solid technical foundation** with Next.js 15, but has **critical SEO gaps** that need immediate attention:

**Strengths:**
- ✅ Proper robots.txt
- ✅ Dynamic sitemap generation
- ✅ Image optimization configured
- ✅ Mobile viewport configured
- ✅ Schema components built (just not used)

**Critical Gaps:**
- ❌ No canonical tags anywhere
- ❌ Structured data not implemented
- ❌ Missing security headers
- ❌ Homepage redirects to /waitlist
- ❌ Sitemap contains 404 pages
- ❌ No Search Console setup

**Recommended Approach:**
1. **Week 1:** Fix critical P0 issues (canonicals, security, schema)
2. **Week 2:** Implement P1 high-impact items (Search Console, Core Web Vitals)
3. **Week 3-4:** Quick wins and testing
4. **Month 2+:** Long-term content strategy

**Estimated Total Time:** 20-30 hours for all phases

**Expected Impact:**
- Better search rankings (canonicals fix duplicate content)
- Higher click-through rates (rich results from schema)
- Improved security (headers protect users and site)
- Better user experience (faster Core Web Vitals)
- Measurable growth (Search Console tracking)

---

**Next Steps:**
1. Review this report with team
2. Prioritize fixes based on business goals
3. Assign tasks to developers
4. Set up monitoring (Search Console, Analytics)
5. Begin Phase 1 implementation

**Questions?** Review section 17 for stakeholder questions.

---

*Report generated by Claude SEO Audit Skill v1.0*
*For questions or clarifications, please consult the implementation checklist in Section 10.*
