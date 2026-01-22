# Database Migrations

This directory contains all Supabase database migrations for the OpenInfo platform.

## Migration Files (Phase 1)

The following migrations will be created in Phase 1:

1. `20260101000001_init_core_tables.sql` - Core tables (workspaces, users)
2. `20260101000002_global_topics.sql` - Topics and trends tables
3. `20260101000003_query_system.sql` - Query management tables
4. `20260101000004_lead_system.sql` - Lead tracking tables
5. `20260101000005_people_search.sql` - People search tables
6. `20260101000006_integrations_billing.sql` - Integrations and billing tables

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

Example:
```
20260122120000_add_user_roles.sql
```
