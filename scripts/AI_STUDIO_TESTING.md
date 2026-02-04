# AI Studio Testing Checklist

Complete end-to-end testing for AI Studio features.

## Prerequisites

- [ ] FIRECRAWL_API_KEY configured
- [ ] FAL_KEY configured
- [ ] ANTHROPIC_API_KEY or OPENAI_API_KEY configured
- [ ] Run `npx tsx scripts/test-api-keys.ts` to verify

---

## Test 1: Brand DNA Extraction

### 1.1 Start Extraction
- [ ] Login to platform
- [ ] Go to `/ai-studio`
- [ ] See "Start New Brand Workspace" form
- [ ] Enter URL: `https://stripe.com`
- [ ] Click "Analyze Website"
- [ ] Redirects to `/ai-studio/branding?workspace=[id]`

### 1.2 Wait for Processing
- [ ] See loading state: "Analyzing Stripe"
- [ ] Message: "Extracting brand DNA from https://stripe.com"
- [ ] Badge: "This may take 30-60 seconds"
- [ ] Page polls every 3 seconds
- [ ] **Wait patiently** - extraction takes time

### 1.3 Verify Extraction Complete
After 30-60 seconds, page should update to show:
- [ ] Header shows Stripe logo (if found)
- [ ] Company name: "Stripe"
- [ ] URL: https://stripe.com
- [ ] Badge: "Brand DNA extracted" ✓

---

## Test 2: Branding Page

### 2.1 Brand Colors Section
- [ ] See "Brand Colors" section
- [ ] 4 color swatches displayed:
  - Primary (Stripe's purple/blue)
  - Secondary
  - Accent
  - Background
- [ ] Each swatch shows:
  - Color preview (filled background)
  - Color name (capitalized)
  - Hex code (e.g., #635BFF)
- [ ] Click any color swatch
- [ ] Color hex code copied to clipboard
- [ ] Checkmark icon appears briefly

### 2.2 Typography Section
- [ ] See "Typography" section
- [ ] 2 font cards:
  - Heading Font (displayed in that font)
  - Body Font (displayed in that font)
- [ ] Font names should be real fonts (not "Inter" unless that's actually used)

### 2.3 Brand Messaging Section
- [ ] See "Brand Messaging" section
- [ ] Main Headline displayed (Stripe's H1)
- [ ] Tagline displayed (if found)
- [ ] Text should be actual content from Stripe's site

### 2.4 Logo Section
- [ ] If Stripe logo found, see "Logo" section
- [ ] Logo image displayed
- [ ] Image is clear and not broken
- [ ] Logo is Stripe's actual logo

### 2.5 Website Screenshot Section
- [ ] See "Website Preview" section
- [ ] Screenshot of Stripe homepage displayed
- [ ] Screenshot loads successfully
- [ ] Screenshot shows recognizable Stripe design

### 2.6 Brand Imagery Gallery
- [ ] See "Brand Imagery" section
- [ ] Up to 8 images displayed in grid
- [ ] Images are from Stripe's website
- [ ] Images load successfully
- [ ] **No placeholder/broken images**

### 2.7 Verify Database
```sql
SELECT
  id,
  name,
  url,
  logo_url,
  extraction_status,
  brand_data->>'screenshot' as has_screenshot,
  jsonb_array_length(brand_data->'images') as image_count
FROM brand_workspaces
WHERE url = 'https://stripe.com';

-- Expected:
-- name: 'Stripe'
-- extraction_status: 'completed'
-- has_screenshot: URL string
-- image_count: > 0
```

---

## Test 3: Knowledge Base

### 3.1 Navigate to Knowledge
- [ ] From branding page, click "Next: Knowledge Base"
- [ ] Redirects to `/ai-studio/knowledge?workspace=[id]`

### 3.2 View Knowledge Base
- [ ] See "Brand Knowledge Base" header
- [ ] Multiple sections displayed:
  - Company Overview
  - Products & Services
  - Target Audience
  - Value Proposition
  - Brand Voice
  - Competitive Advantages
- [ ] Each section has text content
- [ ] Content is relevant to Stripe
- [ ] **Not generic placeholder text**

### 3.3 Verify AI-Generated Content
- [ ] Content should be coherent and specific
- [ ] Mentions Stripe's actual products (payments, billing, etc.)
- [ ] Target audience describes Stripe's customers (developers, businesses)
- [ ] Brand voice captures Stripe's tone

---

## Test 4: Customer Profiles (ICPs)

### 4.1 Navigate to Profiles
- [ ] From knowledge page, click "Next: Profiles"
- [ ] Redirects to `/ai-studio/profiles?workspace=[id]`

### 4.2 View Generated Profiles
- [ ] See "Customer Profiles" header
- [ ] At least 2-3 profile cards displayed
- [ ] Each profile shows:
  - Name (e.g., "Tech Startup Founder")
  - Title/Role
  - Description (2-3 sentences)
- [ ] Profiles are relevant to Stripe's audience

### 4.3 View Profile Details
- [ ] Click "View Details" on any profile
- [ ] See expanded information:
  - Demographics (age, income, location)
  - Pain points (3-5 bullet points)
  - Goals (3-5 bullet points)
  - Preferred channels (email, LinkedIn, etc.)
- [ ] Information is realistic and relevant

### 4.4 Verify Database
```sql
SELECT
  name,
  title,
  description,
  jsonb_array_length(pain_points) as pain_point_count,
  jsonb_array_length(goals) as goal_count
FROM customer_profiles
WHERE brand_workspace_id = '[workspace-id]';

-- Expected: 2-3 profiles with realistic data
```

---

## Test 5: Offers

### 5.1 Navigate to Offers
- [ ] From profiles page, click "Next: Offers"
- [ ] Redirects to `/ai-studio/offers?workspace=[id]`

### 5.2 View Extracted Offers
- [ ] See "Offers & Products" header
- [ ] Multiple offer cards (Stripe's products)
- [ ] Each offer shows:
  - Name (e.g., "Stripe Payments")
  - Description (2-3 sentences)
  - Source badge: "Extracted"
  - Status badge: "Active"
- [ ] Offers match Stripe's actual products

### 5.3 Create Custom Offer (Optional)
- [ ] Click "Create Offer" button
- [ ] Fill in form:
  - Name: "Test Offer"
  - Description: "Test description"
- [ ] Click "Create"
- [ ] New offer appears in list
- [ ] Source badge: "Custom"

---

## Test 6: Image Generation (CRITICAL TEST)

### 6.1 Navigate to Creatives
- [ ] From offers page, click "Next: Creatives"
- [ ] Redirects to `/ai-studio/creatives?workspace=[id]`

### 6.2 Generate First Creative
- [ ] See "Generate Creative" form
- [ ] Enter prompt: "Professional photo of a credit card on a desk with laptop in background"
- [ ] Select style: "Write with Elegance"
- [ ] Select format: "Square (1:1)"
- [ ] Select ICP: Any profile (optional)
- [ ] Select Offer: Any offer (optional)
- [ ] Click "Generate Creative"

### 6.3 Wait for Generation
- [ ] Button shows loading state
- [ ] Takes 10-30 seconds
- [ ] **Wait patiently**

### 6.4 Verify Generated Image
After generation completes:
- [ ] New creative card appears at top
- [ ] **Image displays successfully** ← CRITICAL
- [ ] Image is relevant to prompt
- [ ] Image uses Stripe's brand colors (purple/blue tones)
- [ ] Image is high quality (1024x1024 pixels)
- [ ] No broken image icon
- [ ] Image URL starts with `https://fal.media/`

### 6.5 Test Multiple Formats
- [ ] Generate another creative
- [ ] Select format: "Story (9:16)"
- [ ] Verify image is vertical/tall
- [ ] Generate another creative
- [ ] Select format: "Landscape (1.91:1)"
- [ ] Verify image is wide

### 6.6 Test Different Styles
- [ ] Generate with "Flow of Creativity" style
- [ ] Verify image has more creative/abstract elements
- [ ] Generate with "Handcrafted Perfection" style
- [ ] Verify image has organic/artisanal feel

### 6.7 Verify Database
```sql
SELECT
  id,
  prompt,
  image_url,
  style_preset,
  format,
  generation_status
FROM ad_creatives
WHERE brand_workspace_id = '[workspace-id]'
ORDER BY created_at DESC;

-- Expected:
-- generation_status: 'completed'
-- image_url: starts with 'https://fal.media/'
-- All images should be accessible URLs
```

### 6.8 Test Image URLs
- [ ] Copy image URL from creative card
- [ ] Open in new tab
- [ ] **Image loads successfully** ← CRITICAL
- [ ] If image doesn't load: FAL_KEY issue or API credit exhausted

---

## Test 7: AI Studio Error Handling

### 7.1 Test Invalid URL
- [ ] Go to `/ai-studio`
- [ ] Enter URL: `not-a-url`
- [ ] Click "Analyze Website"
- [ ] **Expected:** Error message: "Invalid URL format"

### 7.2 Test Already Extracted URL
- [ ] Enter URL: `https://stripe.com` (already extracted)
- [ ] Click "Analyze Website"
- [ ] **Expected:** Redirects to existing workspace OR shows message

### 7.3 Test Extraction Failure
- [ ] Enter URL: `https://example.com/nonexistent-page`
- [ ] Wait for extraction
- [ ] **Expected:** Error state after timeout OR extraction completes with limited data

### 7.4 Test Image Generation Without Prompt
- [ ] Go to creatives page
- [ ] Leave prompt empty
- [ ] Click "Generate Creative"
- [ ] **Expected:** Button disabled OR error message

---

## Test 8: AI Studio with Different Websites

Test extraction quality with various sites:

### 8.1 Simple Company Site
- [ ] Extract: `https://linear.app`
- [ ] Verify logo, colors, screenshot extracted
- [ ] Verify knowledge base makes sense
- [ ] Generate creative with Linear's brand colors

### 8.2 E-commerce Site
- [ ] Extract: `https://shopify.com`
- [ ] Verify product images captured
- [ ] Verify offers extracted (Shopify's plans)
- [ ] Generate creative for e-commerce

### 8.3 SaaS Product
- [ ] Extract: `https://notion.so`
- [ ] Verify brand personality captured correctly
- [ ] Verify ICPs are relevant (product managers, teams)
- [ ] Generate creative with Notion's aesthetic

---

## Test 9: Performance & Quality

### 9.1 Extraction Speed
- [ ] Time how long extraction takes
- [ ] **Expected:** 30-90 seconds for most sites
- [ ] If > 2 minutes: Firecrawl API issue or complex site

### 9.2 Image Generation Speed
- [ ] Time how long image generation takes
- [ ] **Expected:** 10-30 seconds
- [ ] If > 60 seconds: Fal.ai API issue

### 9.3 Image Quality Check
For each generated image, verify:
- [ ] Resolution matches format (1024x1024 for square)
- [ ] No text/letters in image (clean background)
- [ ] Professional photography style
- [ ] Brand colors are prominent
- [ ] Composition follows rule of thirds
- [ ] Sharp focus and good lighting

### 9.4 Brand Consistency
- [ ] Generate 3 images for same brand
- [ ] All should use consistent color palette
- [ ] All should match brand personality
- [ ] Style variations should still feel "on-brand"

---

## Test 10: API Key Failures

### 10.1 Test Without FIRECRAWL_API_KEY
- [ ] Temporarily remove FIRECRAWL_API_KEY
- [ ] Try to extract brand DNA
- [ ] **Expected:** Error: "Firecrawl API key not configured"
- [ ] User sees friendly error message

### 10.2 Test Without FAL_KEY
- [ ] Temporarily remove FAL_KEY
- [ ] Try to generate creative
- [ ] **Expected:** Error: "FAL_KEY is not set in environment variables"
- [ ] User sees friendly error message

### 10.3 Test Without AI Key
- [ ] Temporarily remove ANTHROPIC_API_KEY and OPENAI_API_KEY
- [ ] Try to extract brand DNA
- [ ] **Expected:** Error: "AI API key not configured"
- [ ] Extraction fails gracefully

---

## Common Issues & Fixes

### Issue: "Images not displaying"
**Check:**
- [ ] FAL_KEY is configured correctly
- [ ] Fal.ai account has credits
- [ ] Check browser console for CORS errors
- [ ] Verify image_url in database is valid

### Issue: "Extraction stuck at 'Processing'"
**Check:**
- [ ] FIRECRAWL_API_KEY is valid
- [ ] Firecrawl account has credits
- [ ] Check Supabase logs for errors
- [ ] Verify website is accessible (not behind paywall)

### Issue: "Generic/placeholder content"
**Check:**
- [ ] ANTHROPIC_API_KEY or OPENAI_API_KEY configured
- [ ] Website has enough content to extract
- [ ] Check if website blocks scrapers (robots.txt)

### Issue: "No brand colors extracted"
**Check:**
- [ ] Website uses standard CSS colors
- [ ] LLM extraction prompt working correctly
- [ ] Firecrawl returned HTML with style information

---

## Sign-Off Checklist

Before marking AI Studio production-ready:

- [ ] Successfully extracted 3+ different websites
- [ ] All brand DNA components extracted correctly
- [ ] Images displayed on branding page
- [ ] Knowledge base content is relevant and accurate
- [ ] Customer profiles are realistic
- [ ] Offers extracted correctly
- [ ] Image generation works consistently
- [ ] Generated images match brand colors
- [ ] Generated images are high quality
- [ ] All API keys verified working
- [ ] Error handling works gracefully
- [ ] No broken images or 404s
- [ ] Performance is acceptable (< 2 min total)

**AI Studio Sign-off:**
- [ ] Tested by: _______________
- [ ] Date: _______________
- [ ] Production-ready: YES / NO
- [ ] Notes: _______________
