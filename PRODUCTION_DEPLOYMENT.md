# Production Deployment Guide

Complete guide for deploying service subscriptions and AI Studio to production.

## 📋 Pre-Deployment Checklist

### Required Before Starting:
- [ ] GitHub repository synced
- [ ] Vercel project connected to repo
- [ ] Supabase project created
- [ ] Stripe account configured
- [ ] All API keys obtained (see below)

---

## 🔑 Step 1: Configure API Keys

### In Vercel Dashboard (Settings > Environment Variables):

#### Required for Service Subscriptions:
```env
RESEND_API_KEY=re_xxxxx                    # Email sending
STRIPE_SECRET_KEY=sk_live_xxxxx            # Payments
STRIPE_WEBHOOK_SECRET=whsec_xxxxx          # Webhook verification
INNGEST_EVENT_KEY=xxxxx                    # Background jobs
INNGEST_SIGNING_KEY=xxxxx                  # Inngest security
```

#### Required for AI Studio:
```env
FIRECRAWL_API_KEY=fc-xxxxx                 # Website scraping
FAL_KEY=xxxxx                               # Image generation (CRITICAL!)
```

#### Required for AI Features (choose one):
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx             # Preferred (Claude)
# OR
OPENAI_API_KEY=sk-xxxxx                    # Alternative (GPT)
```

#### Already Configured:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### Test API Keys:
```bash
npx tsx scripts/test-api-keys.ts
```

**Expected Output:**
```
✅ Resend (Email) - API key is valid and working
✅ Stripe (Payments) - API key is valid
✅ Firecrawl (Website Scraping) - API key is valid
✅ Fal.ai (Image Generation) - API key is valid and working
✅ Anthropic (Claude) - API key is valid and working
✅ Inngest (Background Jobs) - Keys are configured
✅ Supabase (Database) - Connection successful
```

---

## 🗄️ Step 2: Apply Database Migrations

### In Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/[your-project]/sql
2. Create new query
3. Copy contents of `scripts/deploy-service-subscriptions.sql`
4. **Run each section separately** (don't run all at once)
5. Verify no errors

### Sections to Run:
1. **Section 1:** Create Tables & Seed Data
2. **Section 2:** Enable RLS Policies
3. **Section 3:** Create Storage Bucket & Policies
4. **Section 4:** Create Triggers
5. **Section 5:** Seed Service Tiers Data

### Verify Migration Success:
```bash
npx tsx scripts/verify-deployment.ts
```

**Expected Output:**
```
✅ Service Tiers Table - All 4 service tiers found (4 rows)
✅ Service Subscriptions Table - Table exists
✅ Service Deliveries Table - Table exists
✅ Storage Bucket - Bucket exists and is private (secure)
✅ RLS Policies - RLS is enabled
✅ Database Indexes - Query performance test passed
```

---

## 🔗 Step 3: Configure Stripe Webhook

### In Stripe Dashboard:

1. Go to: Developers > Webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://leads.meetcursive.com/api/webhooks/stripe`
4. Description: "Service Subscriptions"
5. Events to send:
   - [x] `invoice.payment_failed`
   - [x] `invoice.payment_succeeded`
   - [x] `customer.subscription.created`
   - [x] `customer.subscription.updated`
   - [x] `customer.subscription.deleted`
6. Click "Add endpoint"
7. Copy webhook signing secret (starts with `whsec_`)
8. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### Verify Stripe Products:
According to earlier conversation, you already configured:
- Cursive Data: `prod_Tuj1hv34tiOZv5` / `price_1SwtZGEmhKaqBpAE86k4dzrc` ($1,000/mo)
- Cursive Outbound: `prod_TujA4Je3snyEaz` / `price_1SwthrEmhKaqBpAERZJfx4MT` ($2,500/mo)
- Cursive Pipeline: `prod_TujEC1bvETTlHu` / `price_1SwtlhEmhKaqBpAE6KUXSKY9` ($5,000/mo)

Verify these exist in Stripe Dashboard > Products.

---

## 🚀 Step 4: Deploy Inngest Functions

### In Inngest Dashboard:

1. Go to: https://app.inngest.com
2. Create app or select existing
3. Connect to Vercel project
4. Sync functions (happens automatically on deploy)
5. Verify functions registered:
   - `send-onboarding-reminders` (cron: 0 10 * * *)
   - `send-renewal-reminders` (cron: 0 9 * * *)

### Manual Sync (if needed):
1. Deploy to Vercel first
2. In Inngest dashboard, click "Sync"
3. Enter: `https://leads.meetcursive.com/api/inngest`
4. Verify 2 functions appear in dashboard

---

## ✅ Step 5: Verify Deployment

### Run Automated Verification:
```bash
npx tsx scripts/verify-deployment.ts
```

All checks should pass. If any fail, review error messages and fix before proceeding.

---

## 🧪 Step 6: Manual Testing

### Test Service Subscriptions (30 minutes):
Follow: `scripts/TESTING_CHECKLIST.md`

**Critical tests:**
1. Complete checkout for Cursive Data ($1,000/mo)
2. Verify welcome email received
3. Complete onboarding form (4 steps)
4. Admin: Upload delivery file
5. Customer: Download delivery file
6. **SECURITY:** Verify cross-workspace access blocked
7. Test Stripe Customer Portal
8. Test subscription cancellation

### Test AI Studio (45 minutes):
Follow: `scripts/AI_STUDIO_TESTING.md`

**Critical tests:**
1. Extract brand DNA from website (e.g., stripe.com)
2. Verify images displayed on branding page
3. **CRITICAL:** Generate creative image with Fal.ai
4. Verify generated image displays and loads
5. Test multiple image formats and styles
6. Test with 3+ different websites

---

## 📊 Step 7: Monitor Production

### Check Logs:

**Vercel:**
- Functions > `/api/webhooks/stripe` - Should show 200s
- Functions > `/api/ai-studio/*` - Check for errors

**Supabase:**
- Logs > API - Check for RLS violations
- Logs > Postgres - Check for query errors

**Stripe:**
- Webhooks > Endpoint - All events should succeed

**Inngest:**
- Runs - Check cron job executions

**Resend:**
- Emails - Check delivery rate (should be 100%)

---

## 🚨 Common Issues & Fixes

### Issue: "Webhook signature verification failed"
**Fix:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Redeploy Vercel after adding secret

### Issue: "Images not generating in AI Studio"
**Fix:**
- Check `FAL_KEY` is configured in Vercel
- Verify Fal.ai account has credits
- Check Vercel logs for "FAL_KEY is not set" error

### Issue: "Brand extraction fails"
**Fix:**
- Verify `FIRECRAWL_API_KEY` configured
- Check Firecrawl account has credits
- Try with simpler website first (linear.app)

### Issue: "Emails not sending"
**Fix:**
- Verify `RESEND_API_KEY` configured
- Check Resend dashboard for errors
- Verify email domain is verified in Resend

### Issue: "Storage bucket not found"
**Fix:**
- Run `scripts/deploy-service-subscriptions.sql` Section 3
- Verify bucket exists in Supabase Storage

### Issue: "RLS policy violation"
**Fix:**
- Run `scripts/deploy-service-subscriptions.sql` Section 2
- Check user is authenticated
- Verify workspace_id is set correctly

---

## 📈 Success Metrics

After deployment, monitor:

### Service Subscriptions:
- [ ] Checkout completion rate > 80%
- [ ] Welcome emails delivered within 30 seconds
- [ ] Onboarding completion rate > 60%
- [ ] File downloads work 100% of time
- [ ] Zero cross-workspace access violations

### AI Studio:
- [ ] Brand extraction success rate > 90%
- [ ] Image generation success rate > 95%
- [ ] Average extraction time < 60 seconds
- [ ] Average image generation time < 30 seconds
- [ ] Zero broken/missing images

---

## 🎯 Go-Live Checklist

Before announcing to customers:

### Technical:
- [ ] All automated tests pass
- [ ] All manual tests completed
- [ ] Storage security verified
- [ ] Webhooks processing successfully
- [ ] Emails sending correctly
- [ ] No errors in production logs
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Business:
- [ ] Pricing confirmed in Stripe
- [ ] Email copy reviewed and approved
- [ ] Support process defined
- [ ] Cancellation policy clear
- [ ] Terms of service updated

### Documentation:
- [ ] Customer onboarding guide written
- [ ] Admin delivery process documented
- [ ] API keys backup saved securely
- [ ] Runbook for common issues

---

## 🆘 Support & Escalation

### If Critical Issue in Production:

1. **Check logs first:**
   - Vercel Functions logs
   - Supabase API logs
   - Stripe webhook events

2. **Common fixes:**
   - Restart Vercel function (redeploy)
   - Resync Inngest functions
   - Clear Vercel build cache

3. **Rollback if needed:**
   - Revert to previous Vercel deployment
   - Keep database changes (safe to keep)

4. **Get help:**
   - Supabase: support@supabase.com
   - Stripe: https://support.stripe.com
   - Resend: help@resend.com
   - Inngest: support@inngest.com

---

## 📝 Post-Deployment Tasks

After successful deployment:

1. [ ] Document any issues encountered
2. [ ] Update NEXT_PUBLIC_PRICING_URL with actual pricing page
3. [ ] Enable production monitoring (Sentry, LogRocket, etc.)
4. [ ] Set up automated backups for Supabase
5. [ ] Create customer success playbook
6. [ ] Schedule first customer onboarding call
7. [ ] Announce feature to existing customers
8. [ ] Update marketing website with service tiers

---

## 📊 Deployment Timeline

**Estimated Total Time: 3-4 hours**

- Step 1 (API Keys): 15 minutes
- Step 2 (Database): 30 minutes
- Step 3 (Stripe): 15 minutes
- Step 4 (Inngest): 15 minutes
- Step 5 (Verification): 10 minutes
- Step 6 (Testing): 75 minutes
- Step 7 (Monitoring): 15 minutes

**Recommended Schedule:**
- Day 1 Morning: Steps 1-5 (Setup & Verify)
- Day 1 Afternoon: Step 6 (Testing)
- Day 2: Monitor for 24 hours
- Day 3: Go live to customers

---

## ✅ Final Sign-Off

- [ ] All steps completed successfully
- [ ] All tests passed
- [ ] No critical issues found
- [ ] Monitoring confirmed working
- [ ] Team trained on new features
- [ ] Customer communication ready

**Deployment Approved By:**
- Technical: _______________
- Business: _______________
- Date: _______________

---

## 🎉 You're Ready for Production!

If all checklist items are complete, the platform is production-ready. Service subscriptions and AI Studio are fully functional and secure.

**Next Steps:**
1. Monitor first 10 customers closely
2. Gather feedback on onboarding experience
3. Iterate on delivery process based on admin workflow
4. Optimize AI Studio prompts based on results

**Good luck with launch! 🚀**
