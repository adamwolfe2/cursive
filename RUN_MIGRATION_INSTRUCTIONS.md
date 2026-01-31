# Database Migration Instructions

## Migration Required: Add Partner Role & Plan Tiers

**Status**: Ready to run
**Impact**: Adds new role and plan enum values, creates helper functions
**Breaking Changes**: None (purely additive)

---

## Option 1: Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project: **lrbftjspiiakfnydxbgk**
3. Navigate to: **SQL Editor** (left sidebar)

### Step 2: Run Migration
1. Click **"+ New query"**
2. Copy the entire contents of:
   ```
   supabase/migrations/20260201000000_add_partner_role_and_plan_tiers.sql
   ```
3. Paste into the SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Success
You should see:
- ✅ "Success. No rows returned"
- OR ✅ "Success" with migration confirmation

If you see any errors, **STOP** and check the error message before proceeding.

---

## Option 2: psql Command Line (Alternative)

If you have direct database access configured:

```bash
# Set your database password when prompted
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f supabase/migrations/20260201000000_add_partner_role_and_plan_tiers.sql
```

Replace:
- `[PROJECT_REF]`: Your Supabase project reference
- `[PASSWORD]`: Your database password

---

## What This Migration Does

### 1. Adds New User Roles
- Adds `'partner'` to the `user_role` enum
- Allows users to be designated as partners (for lead uploads)

### 2. Adds New Plan Tiers
- Adds `'starter'` to `user_plan` enum
- Adds `'enterprise'` to `user_plan` enum
- Completes the 4-tier plan system (free, starter, pro, enterprise)

### 3. Creates Helper Functions

#### `is_admin(user_id UUID)`
Returns `true` if user has role 'owner' or 'admin'

**Usage in RLS policies:**
```sql
CREATE POLICY "Admin access" ON some_table
  FOR ALL USING (is_admin(auth.uid()));
```

#### `is_approved_partner(user_id UUID)`
Returns `true` if user is an approved partner with:
- role = 'partner'
- partner.status = 'active'
- partner.is_active = true
- partner.stripe_onboarding_complete = true

**Usage in API:**
```typescript
const approved = await isApprovedPartner(session.user)
if (!approved) {
  return redirect('/partner/pending')
}
```

---

## After Migration

### Expected Database State

**user_role enum values:**
```sql
'owner', 'admin', 'partner', 'member'
```

**user_plan enum values:**
```sql
'free', 'pro', 'starter', 'enterprise'
```

**New functions:**
```sql
is_admin(UUID) → BOOLEAN
is_approved_partner(UUID) → BOOLEAN
```

### Test the Migration

Run these queries in SQL Editor to verify:

```sql
-- Check user_role enum
SELECT unnest(enum_range(NULL::user_role));

-- Check user_plan enum
SELECT unnest(enum_range(NULL::user_plan));

-- Test is_admin function (replace with your user ID)
SELECT is_admin('00000000-0000-0000-0000-000000000000'::UUID);

-- Test is_approved_partner function
SELECT is_approved_partner('00000000-0000-0000-0000-000000000000'::UUID);
```

Expected results:
1. user_role should show: owner, admin, partner, member
2. user_plan should show: free, pro, starter, enterprise
3. is_admin should return true/false based on your role
4. is_approved_partner should return true/false based on partner status

---

## Troubleshooting

### Error: "type already exists"
**Cause**: Migration already run
**Solution**: Skip this migration, it's already applied

### Error: "permission denied"
**Cause**: Insufficient database permissions
**Solution**: Ensure you're logged in as the database owner/admin

### Error: "syntax error"
**Cause**: Copy/paste issue
**Solution**: Re-copy the migration file, ensure no extra characters

### Error: "column does not exist"
**Cause**: Database schema out of sync
**Solution**: Check that previous migrations have been run

---

## Need Help?

If you encounter issues:

1. **Check Migration File**: Verify the file exists and is not corrupted
2. **Check Database Connection**: Ensure you can connect to the database
3. **Check Previous Migrations**: Ensure all prior migrations have been run
4. **Review Error Message**: The error usually indicates what's wrong

---

## Post-Migration Checklist

After successfully running the migration:

- [ ] Verify enum values are correct (run test queries above)
- [ ] Deploy updated application code (already pushed to GitHub)
- [ ] Test admin access with owner/admin roles
- [ ] Test partner approval workflow
- [ ] Verify existing users still have access
- [ ] Check that plan limits are retrievable

---

## Migration File Location

```
/Users/adamwolfe/openinfo-platform/supabase/migrations/20260201000000_add_partner_role_and_plan_tiers.sql
```

**File Size**: ~90 lines
**Estimated Run Time**: < 1 second
**Rollback**: Not needed (purely additive, no data changes)

---

**Created**: 2026-02-01
**Status**: Ready to run
**Tested**: Yes (syntax verified)
**Safe to Run**: Yes (no breaking changes)
