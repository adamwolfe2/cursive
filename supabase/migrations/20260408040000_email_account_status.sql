-- ============================================================================
-- email_accounts.connection_status — Phase 2.6 (token revocation UX)
-- ----------------------------------------------------------------------------
-- When Google revokes the refresh token (user removed app access, password
-- changed, etc.), the next sendViaGmail / pollGmailAccountForReplies call
-- gets a 401 invalid_grant. We mark the account as needs_reconnect so the
-- UI can prompt the user before they hit Run again.
--
-- Used by:
--   - src/lib/services/gmail/email-account.service.ts (markNeedsReconnect)
--   - src/components/outbound/connect-email-banner.tsx (warning state)
--   - src/lib/services/outbound/email-account-gate.service.ts (gate check)
-- ============================================================================

ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'active'
    CHECK (connection_status IN ('active', 'needs_reconnect', 'disabled')),
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;

COMMENT ON COLUMN email_accounts.connection_status IS
  'active = healthy. needs_reconnect = OAuth tokens revoked, user must re-authorize. disabled = manually paused by user.';

CREATE INDEX IF NOT EXISTS idx_email_accounts_needs_reconnect
  ON email_accounts(workspace_id) WHERE connection_status = 'needs_reconnect';
