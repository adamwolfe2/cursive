-- Fix: workspaces.onboarding_status default violated its own CHECK constraint.
--
-- History of the bug:
--   * 20260126000010_workspace_settings.sql added the column with
--       DEFAULT 'not_started'.
--   * 20260126000015_super_admin_architecture.sql later added
--       CONSTRAINT valid_onboarding_status
--       CHECK (onboarding_status IN ('pending','in_progress','completed','skipped'))
--     — which does NOT include 'not_started'. Its `ADD COLUMN IF NOT EXISTS` was a
--     no-op (column already existed), so the stale 'not_started' default remained.
--
-- Net effect: any INSERT into `workspaces` that relied on the column default
-- failed the check constraint. This blocked headless reseller child-workspace
-- creation (and any other default-reliant insert).
--
-- This was already corrected LIVE on the Cursive prod DB (default set to
-- 'pending'); this migration captures that change so fresh environments match.

ALTER TABLE workspaces
  ALTER COLUMN onboarding_status SET DEFAULT 'pending';

-- Backfill any legacy rows still holding the invalid value so the constraint is
-- satisfiable everywhere (idempotent; safe if none exist).
UPDATE workspaces
  SET onboarding_status = 'pending'
  WHERE onboarding_status = 'not_started';

-- Re-assert the constraint (no-op if already present) so environments created
-- from an older baseline converge on the same rule.
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS valid_onboarding_status;
ALTER TABLE workspaces ADD CONSTRAINT valid_onboarding_status
  CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'skipped'));
