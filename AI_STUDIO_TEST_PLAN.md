# AI Studio End-to-End Testing Plan

## ✅ Prerequisites Check

- [x] Dev server running on port 3000
- [x] FIRECRAWL_API_KEY configured
- [x] OPENAI_API_KEY configured
- [x] FAL_KEY configured
- [x] STRIPE_SECRET_KEY configured
- [x] NEXT_PUBLIC_APP_URL configured
- [x] Supabase connected

---

## 🧪 Test 1: Brand Extraction (Real Screenshot + Progress)

### Steps:
1. Navigate to: http://localhost:3000/ai-studio
2. Enter URL: `stripe.com`
3. Click the arrow button (or press Enter)

### Expected Results:
✅ Loading steps appear (6 steps total)
✅ Screenshot appears within 10-15 seconds (ACTUAL website screenshot, not placeholder)
✅ Loading steps increment gradually (not all at once)
✅ Progress polls every 2 seconds
✅ Auto-redirects to branding page when complete (~30-60 seconds total)

### What to Check in Database:
```sql
-- Check workspace was created
SELECT id, name, url, extraction_status, brand_data->>'screenshot' as screenshot
FROM brand_workspaces
ORDER BY created_at DESC
LIMIT 1;

-- Should show:
-- extraction_status: 'completed'
-- screenshot: 'https://...' (actual Firecrawl screenshot URL)
```

### Potential Issues:
- ⚠️ If screenshot doesn't appear: Check browser console for errors
- ⚠️ If stuck on "Processing": Check server logs (terminal running npm run dev)
- ⚠️ If extraction fails: Check API key validity in Firecrawl dashboard

---

## 🧪 Test 2: Branding Page (Extracted Data Display)

### Steps:
1. After extraction completes, you should auto-redirect to branding page
2. Or manually navigate to: http://localhost:3000/ai-studio/branding?workspace=WORKSPACE_ID

### Expected Results:
✅ Logo displays (if found on website)
✅ Brand colors shown (4 color swatches with hex codes)
✅ Typography fonts displayed (heading + body)
✅ Value proposition/headline shown
✅ Website screenshot visible
✅ Brand images gallery (if images found)
✅ "Next: Knowledge Base" button works

### What to Check:
- Colors should match stripe.com color scheme
- Screenshot should be the actual website
- Logo should be the Stripe logo

---

## 🧪 Test 3: Knowledge Base (AI-Generated Content)

### Steps:
1. Click "Next: Knowledge Base" from branding page
2. Or navigate to: http://localhost:3000/ai-studio/knowledge?workspace=WORKSPACE_ID

### Expected Results:
✅ Company Overview section (2-3 paragraphs about Stripe)
✅ Products & Services grid (multiple product cards)
✅ Target Audience description
✅ Brand Voice breakdown (tone, energy, communication style)
✅ Value Propositions (3 numbered cards)
✅ Key Messages (bulleted list)

### What to Check:
- Content should be specific to Stripe (not generic)
- Products should include real Stripe products (Payments, Billing, etc.)
- Target audience should be relevant (developers, businesses)

---

## 🧪 Test 4: Customer Profiles (AI-Generated Personas)

### Steps:
1. Click "Next: Customer Profiles" from knowledge base page
2. Or navigate to: http://localhost:3000/ai-studio/profiles?workspace=WORKSPACE_ID

### Expected Results:
✅ 3-5 customer profile cards appear
✅ Each has a name (e.g., "Sarah, the Tech Startup Founder")
✅ Click a profile to see full details
✅ Demographics shown (age, income, location, education)
✅ Pain points listed (3+ items)
✅ Goals listed (3+ items)
✅ Preferred channels shown as badges

### What to Check in Database:
```sql
-- Check profiles were created
SELECT id, name, title, demographics, pain_points, goals
FROM customer_profiles
WHERE brand_workspace_id = 'WORKSPACE_ID'
ORDER BY created_at;

-- Should show 3-5 profiles
```

---

## 🧪 Test 5: Offers (Auto-Extracted Products)

### Steps:
1. Click "Next: Offers" from profiles page
2. Or navigate to: http://localhost:3000/ai-studio/offers?workspace=WORKSPACE_ID

### Expected Results:
✅ Multiple offer cards appear (products/services from Stripe)
✅ Each has a name (e.g., "Stripe Payments", "Stripe Billing")
✅ Description text visible
✅ Badge shows "Auto-extracted"
✅ Badge shows "Active" status

### What to Check in Database:
```sql
-- Check offers were created
SELECT id, name, description, source, status
FROM offers
WHERE brand_workspace_id = 'WORKSPACE_ID'
ORDER BY created_at;

-- Should show multiple offers with source='extracted'
```

### ⚠️ Critical Test:
This verifies the offer extraction we implemented is working!

---

## 🧪 Test 6: Creatives (AI Image Generation)

### Steps:
1. Click "Next: Creatives" from offers page
2. Or navigate to: http://localhost:3000/ai-studio/creatives?workspace=WORKSPACE_ID

### Generate a Creative:
1. Scroll to bottom (fixed generator bar)
2. Select style preset: "Flow of Creativity"
3. Enter prompt: "Professional tech startup office with modern design"
4. Select ICP from dropdown (one of the generated profiles)
5. Select Offer from dropdown (one of the extracted offers)
6. Select format: "Square (1:1)"
7. Click the arrow up button

### Expected Results:
✅ Button shows loading spinner
✅ After 5-10 seconds, new creative appears in gallery
✅ Image is AI-generated (not placeholder)
✅ Image matches the prompt
✅ Tags show style preset and format

### What to Check in Database:
```sql
-- Check creative was created
SELECT id, image_url, prompt, style_preset, format, generation_status
FROM ad_creatives
WHERE brand_workspace_id = 'WORKSPACE_ID'
ORDER BY created_at DESC
LIMIT 1;

-- Should show:
-- image_url: 'https://fal.media/files/...' (Fal.ai CDN)
-- generation_status: 'completed'
```

### Potential Issues:
- ⚠️ If generation fails: Check FAL_KEY validity
- ⚠️ If slow: Fal.ai Flux Schnell should be fast (~5-10 sec)
- ⚠️ If image doesn't match prompt: Try a more specific prompt

---

## 🧪 Test 7: Campaigns (Stripe Checkout)

### Steps:
1. Click "Next: Campaigns" from creatives page
2. Or navigate to: http://localhost:3000/ai-studio/campaigns?workspace=WORKSPACE_ID

### Configure Campaign:
1. Select pricing tier: **Growth** ($1,000 / 100 leads)
2. In "Select Ad Creatives" section: Click the creative you just generated
3. In "Target Customer Profiles" section: Click one or more profiles
4. In "Landing Page" section: Enter URL: `https://stripe.com`
5. Click "Proceed to Checkout"

### Expected Results:
✅ Button shows "Creating checkout..." with spinner
✅ Redirects to Stripe checkout page (stripe.com/pay/...)
✅ Checkout page shows:
   - Product: "Growth Meta Ads Campaign"
   - Price: $1,000.00
   - Description: "100 guaranteed leads for Stripe"

### Complete Payment (Test Mode):
1. Email: Enter any email (e.g., test@example.com)
2. Card number: `4242 4242 4242 4242`
3. Expiry: Any future date (e.g., 12/25)
4. CVC: Any 3 digits (e.g., 123)
5. ZIP: Any 5 digits (e.g., 12345)
6. Click "Pay"

### Expected Results After Payment:
✅ Redirects to success page: http://localhost:3000/ai-studio/campaigns/success?session_id=...&campaign_id=...
✅ Success message: "Campaign Created Successfully! 🎉"
✅ Campaign ID shown
✅ "What happens next" checklist visible
✅ Support email shown

### What to Check in Database:
```sql
-- Check campaign was created and paid
SELECT
  id,
  tier,
  tier_price,
  leads_guaranteed,
  landing_url,
  payment_status,
  campaign_status,
  stripe_session_id,
  stripe_payment_intent_id,
  creative_ids,
  target_icp_ids
FROM ad_campaigns
ORDER BY created_at DESC
LIMIT 1;

-- After webhook processes (may take 5-10 seconds):
-- payment_status: 'paid'
-- campaign_status: 'in_review'
-- stripe_payment_intent_id: 'pi_...'
```

### Verify Webhook (Optional):
```bash
# In a separate terminal, monitor Stripe webhook events:
stripe listen --forward-to localhost:3000/api/ai-studio/campaigns/webhook

# You should see:
# checkout.session.completed [200]
```

### Potential Issues:
- ⚠️ If redirect fails: Check NEXT_PUBLIC_APP_URL in .env.local
- ⚠️ If payment fails: Verify STRIPE_SECRET_KEY is test key (sk_test_...)
- ⚠️ If webhook doesn't fire: Stripe may not send webhooks in local dev (this is OK for testing)
- ⚠️ If campaign status doesn't update: Webhook secret may not be configured (also OK for manual testing)

---

## 🎯 Complete Flow Summary

```
1. Enter URL (stripe.com)
   ↓
2. Watch real screenshot load + progress tracking
   ↓
3. View extracted branding (colors, fonts, logo)
   ↓
4. View AI-generated knowledge base
   ↓
5. View AI-generated customer profiles (3-5 personas)
   ↓
6. View auto-extracted offers (products/services)
   ↓
7. Generate AI creative (Fal.ai image)
   ↓
8. Configure campaign (tier, creatives, profiles)
   ↓
9. Checkout with Stripe (test card)
   ↓
10. Success page confirmation
```

**Total Time**: ~5-10 minutes for complete flow

---

## ✅ Success Criteria

After completing all tests, you should have:

1. ✅ 1 brand workspace (status: completed)
2. ✅ Brand data with actual screenshot URL
3. ✅ Knowledge base with AI-generated content
4. ✅ 3-5 customer profiles
5. ✅ 3+ offers (auto-extracted from products)
6. ✅ 1+ ad creative (AI-generated image)
7. ✅ 1 campaign (payment_status: paid, campaign_status: in_review)

---

## 🐛 Troubleshooting

### Screenshot doesn't appear
- Check: Browser console for network errors
- Check: Server logs for Firecrawl API errors
- Solution: Verify FIRECRAWL_API_KEY is valid

### Extraction stuck at "Processing"
- Check: Server terminal for error messages
- Check: OpenAI API rate limits
- Solution: Wait 2 minutes, then refresh page

### No offers created
- Check: Database query for offers table
- Check: Server logs for insertion errors
- Solution: Verify products_services array in knowledge_base

### Creative generation fails
- Check: Browser console and server logs
- Solution: Verify FAL_KEY is valid and has credits

### Stripe checkout fails
- Check: STRIPE_SECRET_KEY starts with sk_test_
- Check: NEXT_PUBLIC_APP_URL is correct
- Solution: Verify all env vars loaded (restart dev server)

### Webhook doesn't fire
- Note: Normal in local development without Stripe CLI
- Solution: Manually update campaign status for testing:
```sql
UPDATE ad_campaigns
SET payment_status = 'paid', campaign_status = 'in_review'
WHERE id = 'CAMPAIGN_ID';
```

---

## 📊 Database Verification Queries

Run these after completing all tests:

```sql
-- 1. Check workspace
SELECT * FROM brand_workspaces ORDER BY created_at DESC LIMIT 1;

-- 2. Check profiles
SELECT COUNT(*) as profile_count FROM customer_profiles;

-- 3. Check offers
SELECT COUNT(*) as offer_count FROM offers WHERE source = 'extracted';

-- 4. Check creatives
SELECT COUNT(*) as creative_count FROM ad_creatives;

-- 5. Check campaigns
SELECT * FROM ad_campaigns ORDER BY created_at DESC LIMIT 1;
```

---

## 🎬 Ready to Test?

Open your browser to: **http://localhost:3000/ai-studio**

Start with Test 1 and work through each test sequentially. Good luck! 🚀
