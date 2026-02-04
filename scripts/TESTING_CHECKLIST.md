# Production Testing Checklist

Complete manual testing checklist before going live. Test in order.

## Prerequisites

- [ ] All database migrations applied (`scripts/deploy-service-subscriptions.sql`)
- [ ] All API keys configured (run `npx tsx scripts/test-api-keys.ts`)
- [ ] Stripe webhook configured: `https://leads.meetcursive.com/api/webhooks/stripe`
- [ ] Inngest deployed and synced

---

## Test 1: Service Subscription Flow (Cursive Data)

### 1.1 Checkout Process
- [ ] Go to `/services/checkout?tier=cursive-data`
- [ ] If not logged in, redirects to `/login` then back to checkout
- [ ] Login or create account
- [ ] Redirects to Stripe Checkout
- [ ] Stripe shows:
  - Product: Cursive Data
  - Price: $1,000/month
  - Payment details form

### 1.2 Complete Payment
- [ ] Use test card: `4242 4242 4242 4242`, any future date, any CVC
- [ ] Click "Subscribe"
- [ ] Redirects to `/services/success`
- [ ] Success page shows confirmation message

### 1.3 Welcome Email
- [ ] Within 30 seconds, check email inbox
- [ ] Email received from "Adam <send@meetcursive.com>"
- [ ] Subject: "Welcome to Cursive Data"
- [ ] Body says: "You're in. Here's what happens next."
- [ ] Email is plain text/HTML (no emojis)
- [ ] Link to `/services/manage` works

### 1.4 Onboarding Flow
- [ ] Go to `/services/onboarding`
- [ ] See 4-step onboarding form
- [ ] **Step 1: Company Profile**
  - Select industries (multi-select)
  - Select company size (dropdown)
  - Select revenue range (dropdown)
  - "Next" button disabled until all filled
- [ ] **Step 2: Target Audience**
  - Enter target titles (text area)
  - Select seniority levels (multi-select)
  - "Next" button disabled until filled
- [ ] **Step 3: Geographic & Tech**
  - Select geographic focus (multi-select)
  - Enter tech stack (optional text area)
  - Can proceed with tech stack empty
- [ ] **Step 4: Goals & Profile**
  - Enter use case (text area)
  - Enter ideal lead profile (text area)
  - Enter exclusions (optional)
  - "Complete Onboarding" button enabled
- [ ] Click "Complete Onboarding"
- [ ] Redirects to `/dashboard?onboarding=complete`
- [ ] Dashboard shows success message

### 1.5 Verify Database
Run these SQL queries in Supabase:

```sql
-- Check subscription was created
SELECT
  id,
  status,
  monthly_price,
  stripe_subscription_id,
  onboarding_completed,
  jsonb_pretty(onboarding_data) as onboarding_data
FROM service_subscriptions
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- status: 'active' or 'onboarding'
-- monthly_price: 1000.00
-- stripe_subscription_id: starts with 'sub_'
-- onboarding_completed: true
-- onboarding_data: JSON with all form responses
```

---

## Test 2: Admin Delivery Upload

### 2.1 Access Admin Interface
- [ ] Login as admin user
- [ ] Go to `/admin/services/deliveries/create`
- [ ] See "Create Delivery" form

### 2.2 View Customer ICP
- [ ] Select subscription from dropdown
- [ ] See customer onboarding data displayed:
  - Industries selected
  - Company size & revenue
  - Target titles & seniority
  - Geographic focus
  - Tech stack
  - Use case & ideal profile
  - Exclusions

### 2.3 Upload File
- [ ] Create test CSV file: `test-leads.csv`
  ```csv
  company,contact_name,email,title
  Acme Corp,John Doe,john@acme.com,CEO
  TechCo,Jane Smith,jane@techco.com,VP Sales
  ```
- [ ] Click "Choose File" and select `test-leads.csv`
- [ ] Select delivery type: "Lead List"
- [ ] Set period: Start date = today, End date = 30 days from now
- [ ] Check "Send notification email"
- [ ] Click "Create Delivery"
- [ ] See success message

### 2.4 Verify Email Sent
- [ ] Check customer email inbox
- [ ] Email from "Adam <send@meetcursive.com>"
- [ ] Subject contains "delivery"
- [ ] Body has download link (signed URL)
- [ ] Link expires in 7 days

### 2.5 Verify Database
```sql
-- Check delivery was created
SELECT
  id,
  status,
  delivery_type,
  file_name,
  file_size,
  delivered_at
FROM service_deliveries
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- status: 'delivered'
-- file_name: 'test-leads.csv'
-- file_size: > 0
-- delivered_at: current timestamp
```

---

## Test 3: Customer File Download

### 3.1 Access Customer Portal
- [ ] Login as customer (non-admin)
- [ ] Go to `/services/manage`
- [ ] See subscription details:
  - Tier name: "Cursive Data"
  - Price: "$1,000/month"
  - Status: "Active"
  - Next billing date shown
  - "Manage Billing" button present

### 3.2 Download Delivery File
- [ ] Scroll to "Your Deliveries" section
- [ ] See delivery listed:
  - Period: Dates shown
  - Type: "Lead List"
  - File name: "test-leads.csv"
  - Status badge: "Delivered"
- [ ] Click "Download" button
- [ ] File downloads successfully
- [ ] Open CSV and verify contents match upload

### 3.3 Test Stripe Customer Portal
- [ ] Click "Manage Billing" button
- [ ] Redirects to Stripe Customer Portal
- [ ] Portal shows:
  - Subscription: Cursive Data - $1,000/month
  - Payment method
  - Billing history
  - "Update payment method" option
  - "Cancel subscription" option
- [ ] **Do NOT cancel** - just verify it's accessible
- [ ] Click "< Back" to return to platform

---

## Test 4: Storage Security (Critical!)

### 4.1 Create Second Test Account
- [ ] Open incognito window
- [ ] Sign up with different email
- [ ] Login as new user (User B)

### 4.2 Attempt Cross-Workspace Access
- [ ] As User B, go to `/services/manage`
- [ ] Copy download URL from browser network tab when clicking download
- [ ] In main window (User A), paste User B's download URL
- [ ] **Expected:** 403 Forbidden or file doesn't download
- [ ] **If file downloads:** CRITICAL SECURITY BUG - RLS policy failed

### 4.3 Verify Storage Policy
Run in Supabase SQL Editor:

```sql
-- Check storage policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- Should see policies for:
-- - Admins can upload delivery files
-- - Users can download their delivery files
```

---

## Test 5: Subscription Cancellation

### 5.1 Cancel via Customer Portal
- [ ] Login as customer
- [ ] Go to `/services/manage`
- [ ] Click "Manage Billing"
- [ ] In Stripe portal, click "Cancel subscription"
- [ ] Confirm cancellation
- [ ] Portal shows: "Your subscription will end on [date]"
- [ ] Return to platform

### 5.2 Verify Cancellation Email
- [ ] Check email inbox
- [ ] Email from "Adam <send@meetcursive.com>"
- [ ] Subject: "You're cancelled. Door's always open."
- [ ] Body mentions access until end of period

### 5.3 Verify Database Status
```sql
-- Check subscription status
SELECT
  status,
  cancel_at_period_end,
  current_period_end
FROM service_subscriptions
WHERE stripe_subscription_id = 'sub_xxx';

-- Expected:
-- status: 'active' (until period ends)
-- cancel_at_period_end: true
-- current_period_end: future date
```

### 5.4 Verify Access Continues
- [ ] Go to `/services/manage`
- [ ] Still shows subscription as "Active"
- [ ] Shows banner: "Subscription ends on [date]"
- [ ] Can still download existing deliveries
- [ ] **After period end**, subscription should become 'cancelled'

---

## Test 6: Payment Failed Webhook

### 6.1 Trigger Payment Failure
- [ ] In Stripe Dashboard, go to subscription
- [ ] Click "Update payment method"
- [ ] Change to test card: `4000 0000 0000 0341` (requires authentication)
- [ ] Wait for next billing attempt or trigger manually

### 6.2 Verify Failure Email
- [ ] Check email inbox
- [ ] Email from "Adam <send@meetcursive.com>"
- [ ] Subject: "Quick heads up: payment didn't go through"
- [ ] Body mentions $1,000 charge declined
- [ ] Has link to update payment method

### 6.3 Verify Database Status
```sql
SELECT status FROM service_subscriptions
WHERE stripe_subscription_id = 'sub_xxx';

-- Expected: status = 'pending_payment'
```

---

## Test 7: Inngest Background Jobs

### 7.1 Test Onboarding Reminder (3 days)
- [ ] Create a new subscription
- [ ] **Do NOT complete onboarding**
- [ ] Wait 3 days OR manually trigger Inngest function
- [ ] Check email inbox
- [ ] Email from "Adam <send@meetcursive.com>"
- [ ] Subject: reminder about onboarding
- [ ] Body has link to `/services/onboarding`

### 7.2 Test Renewal Reminder (7 days before)
- [ ] Find active subscription with billing date 7 days away
- [ ] OR manually trigger Inngest function
- [ ] Check email inbox
- [ ] Email from "Adam <send@meetcursive.com>"
- [ ] Subject: renewal reminder
- [ ] Body mentions upcoming $1,000 charge

### 7.3 Verify Inngest Dashboard
- [ ] Go to Inngest dashboard
- [ ] Check "Functions" tab
- [ ] Verify functions registered:
  - `send-onboarding-reminders` (cron: 0 10 * * *)
  - `send-renewal-reminders` (cron: 0 9 * * *)
- [ ] Check "Runs" tab for successful executions

---

## Test 8: Error Handling

### 8.1 Test Invalid Tier Slug
- [ ] Go to `/services/checkout?tier=invalid-tier`
- [ ] **Expected:** Redirects to home or shows error

### 8.2 Test Duplicate Subscription
- [ ] Already have active Cursive Data subscription
- [ ] Try to checkout for Cursive Data again
- [ ] **Expected:** Redirects to `/services/manage` with message

### 8.3 Test Unauthorized Admin Access
- [ ] Login as non-admin user
- [ ] Try to access `/admin/services/deliveries/create`
- [ ] **Expected:** 403 error or redirect

### 8.4 Test Missing Onboarding Data
- [ ] Admin tries to create delivery for subscription without onboarding
- [ ] **Expected:** Warning shown (onboarding data missing)

---

## Test 9: Multiple Service Tiers

### 9.1 Test Cursive Outbound ($2,500/mo)
- [ ] Go to `/services/checkout?tier=cursive-outbound`
- [ ] Complete checkout with test card
- [ ] Verify price is $2,500/month
- [ ] Complete onboarding
- [ ] Verify subscription created

### 9.2 Test Cursive Pipeline ($5,000/mo)
- [ ] Go to `/services/checkout?tier=cursive-pipeline`
- [ ] Complete checkout
- [ ] Verify price is $5,000/month

### 9.3 Test Venture Studio (Calendar Redirect)
- [ ] Go to `/services/checkout?tier=cursive-venture-studio`
- [ ] **Expected:** Redirects to Cal.com booking page
- [ ] **NOT** to Stripe checkout

---

## Test 10: Production Monitoring

### 10.1 Check Vercel Logs
- [ ] Go to Vercel dashboard
- [ ] Check "Functions" logs
- [ ] Filter for `/api/webhooks/stripe`
- [ ] Verify webhooks are processing successfully
- [ ] No 500 errors

### 10.2 Check Supabase Logs
- [ ] Go to Supabase dashboard
- [ ] Logs > API logs
- [ ] Filter for service_subscriptions table
- [ ] Verify inserts/updates successful
- [ ] No RLS policy violations

### 10.3 Check Stripe Dashboard
- [ ] Go to Stripe dashboard
- [ ] Webhooks > Endpoint details
- [ ] Check "Recent events"
- [ ] All events should show "✓ Succeeded"
- [ ] No failed webhooks

### 10.4 Check Resend Dashboard
- [ ] Go to Resend dashboard
- [ ] Check "Emails" sent count
- [ ] Verify welcome/delivery emails sent
- [ ] Check delivery rate (should be 100%)

---

## Sign-Off Checklist

Before marking production-ready, ensure:

- [ ] All 10 test sections completed successfully
- [ ] No critical security issues found
- [ ] All emails sending correctly
- [ ] Storage security verified (cross-workspace access blocked)
- [ ] Database has correct data
- [ ] Stripe webhooks processing
- [ ] Inngest jobs registered and running
- [ ] No errors in production logs
- [ ] Customer can complete full journey: checkout → onboarding → download
- [ ] Admin can upload deliveries and customer receives them

**Sign-off:**
- [ ] Tested by: _______________
- [ ] Date: _______________
- [ ] Production-ready: YES / NO
