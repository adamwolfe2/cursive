# Database Schema Documentation

## Overview

Cursive uses PostgreSQL (via Supabase) with Row Level Security (RLS) for multi-tenant data isolation. All tables are workspace-scoped, ensuring data never leaks between organizations.

---

## Core Tables

### `workspaces`

Organization-level entity. All other tables reference this for multi-tenancy.

**Columns:**
- `id` (UUID, PK) - Primary identifier
- `name` (TEXT) - Organization name
- `slug` (TEXT, UNIQUE) - URL-safe identifier
- `plan_tier` (TEXT) - Subscription plan: `free`, `starter`, `growth`, `pro`, `enterprise`
- `billing_cycle` (TEXT) - `monthly` or `annual`
- `created_at` (TIMESTAMPTZ) - Account creation date
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp (Phase 5)
- `deleted_by` (UUID) - User who deleted workspace (Phase 5)

**RLS Policies:**
- Users can only view their own workspace
- Excludes soft-deleted workspaces (Phase 5)

**Indexes:**
- `idx_workspaces_slug` - Fast lookup by slug
- `idx_workspaces_not_deleted` - Filter deleted workspaces (Phase 5)

---

### `users`

Platform users. Each user belongs to one workspace.

**Columns:**
- `id` (UUID, PK) - Internal user ID
- `auth_user_id` (UUID, UNIQUE) - Maps to `auth.users.id`
- `workspace_id` (UUID, FK → workspaces) - Organization
- `email` (TEXT) - User email
- `full_name` (TEXT) - Display name
- `role` (TEXT) - `owner`, `admin`, `member`, `partner`
- `partner_id` (UUID, FK → partners) - If user is a partner
- `created_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ) - Soft delete (Phase 5)

**RLS Policies:**
- Users can view workspace members
- Excludes deleted users (Phase 5)

**Indexes:**
- `idx_users_auth_user_id` - Auth lookup
- `idx_users_workspace_id` - Workspace filtering
- `idx_users_not_deleted` - Active users only (Phase 5)

---

### `leads`

Marketplace leads that can be purchased by workspaces.

**Columns:**
- `id` (UUID, PK)
- `workspace_id` (UUID, FK → workspaces) - Owner (if purchased)
- `email` (TEXT) - Lead contact
- `first_name`, `last_name`, `company_name`, `job_title` (TEXT)
- `phone`, `linkedin_url` (TEXT)
- `industry`, `company_size`, `state`, `country` (TEXT) - Segmentation
- `marketplace_price` (DECIMAL(10,4)) - Price in USD (Phase 1: must be positive)
- `is_marketplace_listed` (BOOLEAN) - Available for purchase
- `freshness_score` (INTEGER 0-100) - Data recency
- `verification_status` (TEXT) - `pending`, `approved`, `rejected`
- `deduplication_hash` (TEXT) - Prevents duplicates
- `created_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ) - Soft delete (Phase 5)
- `deleted_by` (UUID) - Deletion auditor (Phase 5)

**Constraints:**
- `positive_marketplace_price` - Prices must be > 0 (Phase 1)

**RLS Policies:**
- Workspaces can only see their own leads
- Marketplace listings visible to all authenticated users
- Excludes soft-deleted leads (Phase 5)

**Indexes:**
- `idx_leads_workspace_status_created` - Admin dashboard (Phase 4)
- `idx_leads_freshness_update` - Nightly freshness updates (Phase 4)
- `idx_leads_not_deleted` - Active leads only (Phase 5)
- `idx_leads_deleted_at` - Admin audit of deletions (Phase 5)

---

### `marketplace_purchases`

Purchase transactions when workspaces buy leads.

**Columns:**
- `id` (UUID, PK)
- `buyer_workspace_id` (UUID, FK → workspaces)
- `total_amount` (DECIMAL(10,4)) - Total USD paid
- `payment_method` (TEXT) - `credits`, `card`, `invoice`
- `stripe_payment_intent_id` (TEXT) - Stripe reference
- `status` (TEXT) - `pending`, `completed`, `failed`, `refunded`
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_mp_buyer_workspace_created` - Purchase history (Phase 4)

---

### `marketplace_purchase_items`

Line items for each purchased lead.

**Columns:**
- `id` (UUID, PK)
- `purchase_id` (UUID, FK → marketplace_purchases)
- `lead_id` (UUID, FK → leads)
- `partner_id` (UUID, FK → partners) - Attribution (RESTRICT on delete, Phase 1)
- `price_at_purchase` (DECIMAL(10,4)) - Historical price
- `commission_amount` (DECIMAL(10,4)) - Partner earnings (Phase 1: must be >= 0)
- `commission_status` (TEXT) - `pending_holdback`, `payable`, `paid`
- `commission_payable_at` (TIMESTAMPTZ) - After 14-day holdback

**Constraints:**
- `positive_commission` - Commission >= 0 (Phase 1)

**Foreign Keys:**
- `partner_id` uses `ON DELETE RESTRICT` to prevent orphaned commissions (Phase 1)

**Indexes:**
- `idx_mpi_commission_processing` - Monthly payouts (Phase 4)

---

## Partner Tables

### `partners`

Affiliate partners who upload leads.

**Columns:**
- `id` (UUID, PK)
- `workspace_id` (UUID, FK → workspaces)
- `company_name` (TEXT)
- `commission_rate` (DECIMAL(5,4)) - 0.0000 to 1.0000 (Phase 1: must be 0-100%)
- `pending_balance` (DECIMAL(10,2)) - Earnings in holdback (Phase 1: must be >= 0)
- `available_balance` (DECIMAL(10,2)) - Earnings ready to pay (Phase 1: must be >= 0)
- `partner_score` (INTEGER) - 0-100 quality score (Phase 1: must be 0-100)
- `created_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ) - Soft delete (Phase 5)

**Constraints:**
- `valid_commission_rate` - Must be 0-100% (Phase 1)
- `valid_partner_score` - Must be 0-100 (Phase 1)
- `non_negative_pending_balance` (Phase 1)
- `non_negative_available_balance` (Phase 1)

**Indexes:**
- `idx_partners_not_deleted` - Active partners (Phase 5)

---

### `partner_earnings`

Granular earnings records for each lead sold.

**Columns:**
- `id` (UUID, PK)
- `partner_id` (UUID, FK → partners) - RESTRICT on delete (Phase 1)
- `lead_id` (UUID, FK → leads) - RESTRICT on delete (Phase 1)
- `workspace_id` (UUID, FK → workspaces) - **Added Phase 1** - Tracks which workspace bought the lead
- `purchase_item_id` (UUID, FK → marketplace_purchase_items)
- `amount` (DECIMAL(10,2)) - Commission amount
- `status` (TEXT) - `pending`, `available`, `paid`
- `created_at` (TIMESTAMPTZ)

**Foreign Keys:**
- All FKs use `ON DELETE RESTRICT` to prevent orphaned financial records (Phase 1)

**Indexes:**
- `idx_partner_earnings_workspace_id` - Filter by buyer workspace (Phase 1)

**Materialized View:** (Phase 4)
- `partner_earnings_summary` - Aggregates by partner/month for instant dashboard loading
- Refreshed hourly via Inngest job

---

### `payout_requests`

Partner withdrawal requests.

**Columns:**
- `id` (UUID, PK)
- `partner_id` (UUID, FK → partners)
- `workspace_id` (UUID, FK → workspaces) - **Added Phase 1** - Tracks payout origin
- `amount` (DECIMAL(10,2))
- `status` (TEXT) - `pending`, `approved`, `completed`, `rejected`
- `payment_method` (TEXT) - `bank_transfer`, `paypal`, `stripe`
- `created_at` (TIMESTAMPTZ)

**Constraints:**
- `positive_payout_amount` - Must be > 0 (Phase 1)

**Indexes:**
- `idx_payout_requests_workspace_id` - Admin filtering (Phase 1)

**SQL Functions:** (Phase 4)
- `get_payout_totals()` - Aggregates pending/approved/completed amounts for admin dashboard

---

## Audit & Compliance Tables

### `audit_logs`

System-wide activity tracking for compliance and debugging.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `workspace_id` (UUID, FK → workspaces)
- `action` (TEXT) - Event name (e.g., `lead.deleted`)
- `resource_type` (TEXT) - `lead`, `partner`, `campaign`
- `resource_id` (UUID) - Affected record
- `metadata` (JSONB) - Additional context
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Platform admins can view all logs (Phase 1: fixed auth pattern)
- Workspaces can view their own logs

**Indexes:**
- `idx_audit_logs_resource` - Query by resource (Phase 4)

---

### `webhook_events`

**Added Phase 3** - Stripe webhook event tracking for idempotency.

**Columns:**
- `id` (UUID, PK)
- `stripe_event_id` (TEXT, UNIQUE) - Prevents duplicate processing
- `event_type` (TEXT) - Stripe event type
- `resource_id` (TEXT) - Related resource ID
- `processed_at` (TIMESTAMPTZ)
- `processing_duration_ms` (INTEGER)
- `error_message` (TEXT) - If processing failed
- `retry_count` (INTEGER)
- `payload` (JSONB) - Full Stripe event

**Purpose:**
- Prevents duplicate webhook processing
- Enables manual retry via Admin API
- Tracks processing failures

---

### `saved_filters`

**Added Phase 5** - User filter presets for marketplace, leads, campaigns.

**Columns:**
- `id` (UUID, PK)
- `workspace_id` (UUID, FK → workspaces)
- `user_id` (UUID, FK → users)
- `name` (TEXT) - User-defined name
- `filter_type` (TEXT) - `marketplace`, `leads`, `campaigns`, `partners`, `audit_logs`, `earnings`
- `filters` (JSONB) - Filter configuration
- `is_default` (BOOLEAN) - Auto-apply on page load
- `is_shared` (BOOLEAN) - Share with workspace teammates
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Constraints:**
- `valid_filter_type` - Enum validation
- `non_empty_name` - Must be 1-100 chars
- Only one default per user per type (UNIQUE INDEX)

**Indexes:**
- `idx_saved_filters_user_type` - User's filters by type
- `idx_saved_filters_workspace_shared` - Shared filters
- `idx_saved_filters_default` - Default filter lookup

**SQL Functions:**
- `get_default_filter()` - Fetch user's default for a type
- `set_default_filter()` - Atomically unset previous default and set new

---

## Platform Admin Tables

### `platform_admins`

Super-admins who can access all workspaces.

**Columns:**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `created_at` (TIMESTAMPTZ)

**RLS Policies (Phase 1 fix):**
- Previously checked `auth.email()` directly (fragile)
- Now joins through `auth.users` table to match `auth.uid()` to email
- More secure and handles email changes

---

### `platform_metrics`

Aggregate platform statistics for admin dashboard.

**Columns:**
- `id` (UUID, PK)
- `metric_date` (DATE)
- `total_workspaces` (INTEGER)
- `active_users` (INTEGER)
- `total_revenue` (DECIMAL(10,2))
- `leads_listed` (INTEGER)
- `leads_sold` (INTEGER)

**RLS Policies:**
- Platform admins only (Phase 1: fixed auth pattern)

---

## Key Design Patterns

### Multi-Tenancy

Every table includes `workspace_id` and uses RLS policies to enforce isolation:

```sql
CREATE POLICY "Workspace isolation" ON leads
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );
```

### Soft Deletes (Phase 5)

Critical tables (`leads`, `partners`, `workspaces`, `users`) support soft deletion:

```sql
ALTER TABLE leads
  ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN deleted_by UUID REFERENCES users(id);
```

**Benefits:**
- GDPR-compliant 30-day grace period
- Prevents foreign key cascade deletions
- Maintains audit trail

**Helper Functions:**
- `soft_delete_lead()` - Mark lead as deleted
- `restore_lead()` - Undo deletion (admin only)
- `permanent_delete_old_soft_deletes()` - Hard delete after 30 days (cron job)

### Financial Integrity (Phase 1)

**Foreign Key Protection:**
- All financial tables use `ON DELETE RESTRICT` instead of `SET NULL`
- Prevents orphaned commission records

**Amount Validation:**
```sql
ALTER TABLE leads
  ADD CONSTRAINT positive_marketplace_price
  CHECK (marketplace_price IS NULL OR marketplace_price > 0);

ALTER TABLE partners
  ADD CONSTRAINT valid_commission_rate
  CHECK (commission_rate >= 0 AND commission_rate <= 1);
```

**Balance Audit:**
- `audit_partner_balances()` function verifies denormalized balances match sum of earnings
- Runs nightly via Inngest job
- Alerts on discrepancies

### Performance Optimizations (Phase 4)

**Composite Indexes:**
- `idx_leads_workspace_status_created` - Admin dashboard filtering
- `idx_mpi_commission_processing` - Monthly commission batches
- `idx_campaign_leads_campaign_lead` - Duplicate detection

**Materialized Views:**
- `partner_earnings_summary` - Pre-aggregated monthly earnings
- Refreshed hourly, reduces query time from 5s to 50ms

**SQL Aggregation Functions:**
- `get_payout_totals()` - Replaces in-app iteration (100x faster)

---

## Migrations

All migrations follow naming convention: `YYYYMMDD_description.sql`

**Rollback Files (Phase 6):**
Each migration has a `.down.sql` counterpart for safe rollback:
- `20260213_critical_security_fixes.down.sql`
- `20260213_webhook_idempotency.down.sql`
- etc.

**Running Migrations:**
```bash
# Apply all pending migrations
supabase db push

# Rollback last migration (manual)
psql -f supabase/migrations/20260213_xxx.down.sql
```

---

## Data Relationships

```
workspaces
  ├── users
  ├── leads
  │   ├── marketplace_purchase_items
  │   ├── campaign_leads
  │   └── partner_earnings
  ├── partners
  │   ├── partner_earnings
  │   └── payout_requests
  ├── marketplace_purchases
  │   └── marketplace_purchase_items
  └── saved_filters

marketplace_purchase_items
  ├── FK → marketplace_purchases
  ├── FK → leads (RESTRICT)
  └── FK → partners (RESTRICT)

partner_earnings
  ├── FK → partners (RESTRICT)
  ├── FK → leads (RESTRICT)
  ├── FK → workspaces (tracks buyer)
  └── FK → marketplace_purchase_items
```

---

## Security Checklist

Before exposing any table:
- ✅ RLS policies enabled
- ✅ Workspace isolation enforced
- ✅ Soft delete filters (if applicable)
- ✅ Foreign key constraints appropriate
- ✅ CHECK constraints on financial amounts
- ✅ Indexes on foreign keys
- ✅ Audit logs for sensitive operations

---

## Performance Monitoring

**Slow Query Alerts:**
Monitor `pg_stat_statements` for queries > 100ms:
```sql
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Index Usage:**
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pg_toast%'
ORDER BY tablename;
```

---

## Backup & Recovery

**Automated Backups:**
- Supabase provides daily backups (retained 7 days on Pro plan)
- Point-in-time recovery available

**Manual Backup:**
```bash
pg_dump -h db.xxx.supabase.co -U postgres cursive > backup.sql
```

**Restore:**
```bash
psql -h db.xxx.supabase.co -U postgres cursive < backup.sql
```

---

## Additional Resources

- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Soft Delete Pattern](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-soft-delete/)

**Last Updated:** 2026-02-13 (Phase 6)
