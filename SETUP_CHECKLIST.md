# Cursive Platform - Setup Checklist

## Current Status: Partially Configured

Based on analysis of your Vercel environment variables and codebase, here's what you need to do to get everything working.

---

## ✅ Already Configured in Vercel

You have these environment variables set:
- `STRIPE_WEBHOOK_SECRET` ✅
- `INNGEST_SIGNING_KEY` ✅
- `INNGEST_EVENT_KEY` ✅
- `GEMINI_API_KEY` ✅
- `TAVILY_API_KEY` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `CLAY_API_KEY` ✅
- `STRIPE_PUBLISHABLE_KEY` ✅
- `STRIPE_SECRET_KEY` ✅
- `STRIPE_PRO_MONTHLY_PRICE_ID` ✅
- `RESEND_API_KEY` ✅

---

## 🚨 MISSING - Critical for Campaign Builder

### 1. ANTHROPIC_API_KEY (REQUIRED)

**What it's for:** AI email sequence generation in the Campaign Builder feature you just implemented

**Where to get it:** https://console.anthropic.com/

**How to add:**
```bash
# In Vercel Dashboard → Your Project → Settings → Environment Variables
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Why it's critical:** Without this key, the Campaign Builder's `/api/campaign-builder/[id]/generate` endpoint will fail. This is the core AI feature that generates email sequences.

---

## ⚠️ LIKELY MISSING - Check Your Vercel Config

These are referenced in `.env.example` but not in your list. Check if you have them:

### Application URLs
```bash
NEXT_PUBLIC_APP_URL=https://leads.meetcursive.com
NEXT_PUBLIC_PRODUCTION_URL=https://app.meetcursive.com
NEXT_PUBLIC_APP_NAME=Cursive
```

### Email Configuration
```bash
EMAIL_FROM=Cursive <notifications@meetcursive.com>
SUPPORT_EMAIL=support@meetcursive.com
```

### Stripe Product IDs (for multi-tier pricing)
```bash
STRIPE_FREE_PRODUCT_ID=prod_xxxxxx
STRIPE_PRO_PRODUCT_ID=prod_xxxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxxx
```

---

## 📋 Database Setup Tasks

### 1. Run Migrations ✅ (Assuming done via Supabase)

All migrations should be applied to your Supabase database:
```bash
# Check in Supabase Dashboard → Database → Migrations
# Ensure all migrations from supabase/migrations/ are applied
```

**Key migrations:**
- `20260101000001_init_core_tables.sql` - Core workspaces/users
- `20260128200000_campaign_builder.sql` - Campaign Builder feature (NEW)
- `20260129000001_waitlist_signups.sql` - Waitlist system
- `20260126000015_super_admin_architecture.sql` - Admin system

### 2. Run Seed Data (OPTIONAL - Development Only)

If you want demo data:
```bash
# In Supabase SQL Editor, run:
supabase/seed.sql
```

This creates:
- Demo workspaces
- Global topics
- Sample trends

**⚠️ NOTE:** Do NOT run this in production with real customers.

---

## 👤 Create Your Admin User (MANUAL STEP REQUIRED)

You need to manually add yourself as a platform admin. Here's how:

### Step 1: Sign Up Normally
1. Go to https://leads.meetcursive.com (with admin bypass) → /login
2. Sign up with your email (e.g., adam@meetcursive.com)
3. Complete the onboarding flow to create your workspace

### Step 2: Make Yourself a Platform Admin

Go to Supabase Dashboard → SQL Editor → New Query and run:

```sql
-- Insert yourself as a platform admin
INSERT INTO platform_admins (email, full_name, is_active)
VALUES (
  'adam@meetcursive.com',  -- ⚠️ CHANGE THIS TO YOUR EMAIL
  'Adam Wolfe',            -- ⚠️ CHANGE THIS TO YOUR NAME
  true
)
ON CONFLICT (email) DO NOTHING;
```

### Step 3: Verify Admin Access

```sql
-- Check if you're a platform admin
SELECT * FROM platform_admins WHERE email = 'adam@meetcursive.com';
```

---

## 🧪 Testing Checklist

Once you've added the missing environment variables and created your admin account:

### Campaign Builder (NEW Feature)
- [ ] Navigate to `/campaign-builder` (needs UI implementation)
- [ ] Create a new campaign draft
- [ ] Fill in wizard steps (6 steps)
- [ ] Click "Generate Campaign" - should call Claude API
- [ ] Review generated emails
- [ ] Export to CSV/JSON
- [ ] Test with ANTHROPIC_API_KEY missing (should show error)

### Core Platform Features
- [ ] Sign up flow works
- [ ] Onboarding creates workspace
- [ ] Dashboard loads after onboarding
- [ ] Lead routing based on industry/location
- [ ] Email notifications send (partner approval, purchases, payouts)
- [ ] Stripe payments work (if testing billing)

### Admin Features
- [ ] Admin bypass waitlist works with password `cursiveadmin1!`
- [ ] Access platform after login
- [ ] Can view admin dashboard (if implemented)
- [ ] Can impersonate workspaces (if implemented)

---

## 🚫 What This Platform Does NOT Do

**IMPORTANT:** Based on your Campaign Builder documentation:
- ❌ Does NOT send emails (that's EmailBison)
- ❌ Does NOT have SMTP configuration
- ❌ Does NOT track opens/clicks
- ❌ Does NOT handle bounces
- ❌ Does NOT do email warmup

The Campaign Builder CREATES email content that you export to EmailBison for sending.

---

## 🔐 Security Checklist

- [ ] All API keys in Vercel are marked as "Sensitive" (encrypted)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT exposed to client
- [ ] RLS policies are enabled on all tables
- [ ] Admin bypass password (`cursiveadmin1!`) is only in server-side code
- [ ] Stripe webhook secret is configured correctly
- [ ] Inngest signing key is set for webhook verification

---

## 📊 Next Steps - UI Development

The Campaign Builder backend is COMPLETE. Next, you need to build:

1. **Campaign Builder Dashboard** (`/campaign-builder`)
   - List all campaign drafts
   - Status indicators
   - Quick actions (edit, delete, export)

2. **Campaign Wizard** (`/campaign-builder/new`)
   - 6-step form
   - Auto-save
   - Field validation

3. **Campaign Review** (`/campaign-builder/[id]/review`)
   - Email preview
   - Edit/regenerate individual emails
   - Approve button

4. **Campaign Export** (`/campaign-builder/[id]/export`)
   - Format selection (CSV, JSON, manual)
   - Download buttons
   - EmailBison instructions

---

## 🆘 If You're Still Getting Redirected to Login

This happens when:
1. **You don't have a workspace** - Complete the onboarding flow
2. **Session expired** - Log out and log back in
3. **Database user record missing** - Check `users` table for your auth_user_id

**Debug steps:**
```sql
-- Check if your user exists
SELECT u.*, w.*
FROM users u
LEFT JOIN workspaces w ON w.id = u.workspace_id
WHERE u.email = 'your-email@example.com';

-- If missing workspace_id, you need to complete onboarding
-- Or manually assign a workspace:
UPDATE users
SET workspace_id = 'your-workspace-id'
WHERE email = 'your-email@example.com';
```

---

## Summary of Required Actions

### Immediate (Critical):
1. ✅ Add `ANTHROPIC_API_KEY` to Vercel
2. ✅ Sign up and create your account
3. ✅ Add yourself to `platform_admins` table
4. ✅ Test admin bypass with password `cursiveadmin1!`

### Soon (Important):
1. ⏳ Verify application URL environment variables
2. ⏳ Verify email configuration variables
3. ⏳ Build Campaign Builder UI pages

### Optional (Nice to have):
1. ⏸️ Run seed data (development only)
2. ⏸️ Set up additional monitoring/logging
3. ⏸️ Configure feature flags

---

**Last Updated:** January 28, 2026
**Campaign Builder Backend:** ✅ COMPLETE
**Campaign Builder UI:** ⏳ PENDING
