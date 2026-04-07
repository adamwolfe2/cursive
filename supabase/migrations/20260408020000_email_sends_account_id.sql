-- ============================================================================
-- email_sends.email_account_id — Phase 2 of per-workspace email send
-- ----------------------------------------------------------------------------
-- Pins each draft to a specific connected sending account so the
-- sendApprovedEmail Inngest function knows which inbox to use.
--
-- Set by:
--   - src/inngest/functions/campaign-compose.ts (outbound-agent campaigns)
-- Consumed by:
--   - src/inngest/functions/campaign-send.ts (sendApprovedEmail) — branches
--     on the row's provider to call gmail-send.service vs the legacy
--     EmailBison fallback.
--
-- Nullable + ON DELETE SET NULL: existing rows are unaffected and the
-- legacy non-outbound EmailBison path keeps working.
-- ============================================================================

ALTER TABLE email_sends
  ADD COLUMN IF NOT EXISTS email_account_id UUID
    REFERENCES email_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_sends_email_account
  ON email_sends(email_account_id) WHERE email_account_id IS NOT NULL;

COMMENT ON COLUMN email_sends.email_account_id IS
  'Workspace-owned sending account this draft is pinned to. NULL = use platform default (legacy EmailBison). Set at compose time for Outbound Agent drafts.';
