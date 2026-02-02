# Supabase Custom Domain Setup

## Option 1: Custom Domain (Requires Pro Plan - $25/mo)

If you're on Supabase Pro plan, you can use a custom domain like `auth.meetcursive.com`:

### Steps:
1. Go to Supabase Dashboard → Settings → Custom Domains
2. Add custom domain: `auth.meetcursive.com`
3. Create CNAME record in your DNS:
   ```
   auth.meetcursive.com → lrbftjspiiakfnydxbgk.supabase.co
   ```
4. Wait for SSL provisioning (~10 minutes)
5. Update your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://auth.meetcursive.com
   ```

### Benefits:
- OAuth shows: `auth.meetcursive.com` ✅
- More professional
- No code changes needed

### Drawbacks:
- Requires Pro plan ($25/mo)
- DNS propagation time

---

## Option 2: Improve Callback UX (Free - Implementing Now)

If you're on Free plan, we can't use custom domain, but we can:
1. Make callback page beautiful (loading animation)
2. Minimize exposure time (faster redirects)
3. Add branded loading screen

This makes the flash pleasant instead of jarring.

---

## Recommendation

**For now**: Implement Option 2 (free)
**Before launch**: Upgrade to Pro and add custom domain

You'll need Pro plan eventually for:
- More database storage
- Daily backups
- No pause on inactivity
- Custom domain
