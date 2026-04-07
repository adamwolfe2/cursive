-- ============================================================================
-- Add unique constraint on email_accounts(workspace_id, email_address)
-- ----------------------------------------------------------------------------
-- The original migration 20260125000001 declared:
--   CREATE UNIQUE INDEX IF NOT EXISTS idx_email_accounts_unique
--     ON email_accounts(workspace_id, email_address);
-- ...but the index never made it to production (likely dropped during a
-- schema cleanup at some point). connectGmailAccount() upserts with
-- onConflict 'workspace_id,email_address', which postgres rejects without
-- a matching unique constraint, surfacing as:
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"
--
-- Adding it now as a true CONSTRAINT (not just an index) so supabase-js's
-- onConflict path resolves it cleanly. ON CONFLICT works with either, but
-- a constraint is the more idiomatic choice.
-- ============================================================================

-- Defensive: in case the index exists under a different name, drop it first
DROP INDEX IF EXISTS public.idx_email_accounts_unique;

-- Add the proper unique constraint
ALTER TABLE public.email_accounts
  ADD CONSTRAINT email_accounts_workspace_email_unique
  UNIQUE (workspace_id, email_address);
