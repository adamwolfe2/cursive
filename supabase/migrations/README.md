# Database Migrations

This directory contains all Supabase database migrations for the Cursive platform.

## Migration Files

### Core Schema
1. `20260101000001_init_core_tables.sql` - Core tables (workspaces, users)
2. `20260101000002_global_topics.sql` - Topics and trends tables
3. `20260101000003_query_system.sql` - Query management tables
4. `20260101000004_lead_system.sql` - Lead tracking tables
5. `20260101000005_people_search.sql` - People search tables
6. `20260101000006_integrations_billing.sql` - Integrations and billing tables

### Feature Migrations
7. `20260205000001_fix_payment_race_conditions.sql` - Payment race condition protections (FOR UPDATE locks, idempotency)
8. `20260210_audiencelab_schema.sql` - AudienceLab integration tables
9. `20260211_add_performance_indexes.sql` - Initial performance indexes

### Hardening Audit (2026-02-12)
10. `20260212_hardening_audit.sql` - Comprehensive database hardening

## Hardening Audit Summary (2026-02-12)

### What was done

| Category | Changes | Count |
|----------|---------|-------|
| **Security: RLS** | Enabled RLS on unprotected tables | 3 tables |
| **Security: Functions** | Revoked `PUBLIC` EXECUTE on all custom RPCs (closes anon inheritance) | ~130 functions |
| **Security: Functions** | Restricted internal functions to `service_role` | 28 functions |
| **Security: Functions** | Set `search_path = public` on all custom functions | ~130 functions |
| **Security: Policies** | Wrapped `auth.uid()` with `(SELECT auth.uid())` for plan stability | ~170 policies |
| **Security: Views** | Set `SECURITY INVOKER` on all views | 7 views |
| **Security: Policies** | Dropped dead `waitlist_signups` INSERT policy | 1 policy |
| **Integrity: NOT NULL** | `workspace_id` on user-facing tables | 3 columns |
| **Integrity: NOT NULL** | `created_at` columns with defaults | 64 columns |
| **Integrity: NOT NULL** | Status columns with defaults | 36 columns |
| **Integrity: CHECK** | Non-system email templates require `workspace_id` | 1 constraint |
| **Integrity: Table** | Created `api_idempotency_keys` (was in code but missing) | 1 table |
| **Idempotency** | Partial unique indexes on Stripe IDs | 10 indexes |
| **Performance: FK indexes** | Indexes on unindexed foreign keys | 6 indexes |
| **Performance: User-ID indexes** | Indexes for RLS predicate support | 4 indexes |
| **Performance: Time indexes** | `created_at DESC` for dashboard queries | 6 indexes |
| **Performance: Composite** | Multi-column indexes for My Leads hot paths | 3 indexes |
| **Performance: Cleanup** | Dropped duplicate indexes | 4 indexes |
| **Realtime** | Added `leads` + `user_lead_assignments` to publication | 2 tables |
| **Realtime** | Set `REPLICA IDENTITY FULL` for filtered subscriptions | 2 tables |

### Payments Concurrency Audit Result
- All critical payment paths use `SELECT FOR UPDATE` row locks
- `add_workspace_credits`: Atomic `INSERT ON CONFLICT DO UPDATE`
- `deduct_workspace_credits`: `FOR UPDATE` lock before balance check
- `complete_stripe_lead_purchase`: `FOR UPDATE` + idempotent status check
- `validate_and_lock_leads_for_purchase`: `FOR UPDATE NOWAIT` for concurrent safety
- `api_idempotency_keys`: Table created for marketplace purchase dedup
- `processed_webhook_events`: Unique constraint on `event_id` for Stripe webhook dedup

### Known Acceptable Warnings (from Supabase Advisors)
- **unused_index (390)**: Young app with low query volume — indexes exist for anticipated query patterns
- **auth_rls_initplan**: RESOLVED — all policies now use `(SELECT auth.uid())` InitPlan pattern
- **multiple_permissive_policies (123)**: Multiple PERMISSIVE policies OR'd together (Postgres default behavior)
- **support_messages INSERT true**: Intentional — public support form submission
- **pg_trgm in public schema**: Extension installed by default, cannot easily move
- **Leaked password protection**: Disabled — enable in Supabase Auth dashboard settings

### Important: Default Privileges
Supabase auto-grants `EXECUTE` to `PUBLIC` on new functions via `ALTER DEFAULT PRIVILEGES`.
This cannot be changed via SQL (permission denied). After any `CREATE OR REPLACE FUNCTION`,
you must re-run: `REVOKE EXECUTE ON FUNCTION public.func_name(...) FROM PUBLIC;`

### Manual Action Required
1. **Enable Leaked Password Protection**: Supabase Dashboard → Auth → Settings → Password Security
2. **Monitor**: Run `get_advisors` periodically to catch new issues
3. **After migrations**: Re-run anon revoke if any functions are created/replaced

## Running Migrations

### Local Development
```bash
pnpm supabase db reset
```

### Production
```bash
pnpm supabase db push
```

## RLS Policies

Every table MUST have Row Level Security (RLS) enabled with appropriate policies for multi-tenant isolation.

## Naming Convention

Migration files follow the pattern:
```
YYYYMMDDHHMMSS_description.sql
```
