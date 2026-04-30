-- ============================================================================
-- GMAIL OAUTH COLUMNS — Phase 1 of per-workspace email send
-- ----------------------------------------------------------------------------
-- Adds OAuth-token columns to the existing `email_accounts` table so each
-- workspace can connect its own Gmail (and later Outlook) inbox via OAuth.
--
-- All columns are nullable + backwards-compatible. Existing SMTP rows are
-- untouched. Refresh tokens are stored AES-GCM encrypted; the ciphertext +
-- IV + tag are persisted as a single base64 blob in `oauth_refresh_token_ct`.
--
-- Used by:
--   - src/lib/services/gmail/oauth.service.ts
--   - src/lib/services/gmail/email-account.service.ts
--   - src/app/api/integrations/gmail/{authorize,callback,disconnect}/route.ts
-- ============================================================================

ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS oauth_refresh_token_ct TEXT,
  ADD COLUMN IF NOT EXISTS oauth_access_token TEXT,
  ADD COLUMN IF NOT EXISTS oauth_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS oauth_scope TEXT,
  ADD COLUMN IF NOT EXISTS oauth_provider_user_id TEXT,
  ADD COLUMN IF NOT EXISTS last_token_refresh_at TIMESTAMPTZ;

COMMENT ON COLUMN email_accounts.oauth_refresh_token_ct IS
  'AES-GCM encrypted Google refresh token. Format: base64(IV(12) || ciphertext || authTag(16)). Encrypted with OAUTH_TOKEN_ENCRYPTION_KEY.';
COMMENT ON COLUMN email_accounts.oauth_access_token IS
  'Short-lived Google access token (1h TTL). Refreshed automatically by getValidAccessToken().';
COMMENT ON COLUMN email_accounts.oauth_expires_at IS
  'When the current access token expires. Refresh ~60s before this.';
COMMENT ON COLUMN email_accounts.oauth_provider_user_id IS
  'Google sub claim — stable per-user ID. Used to dedupe re-connects.';

CREATE INDEX IF NOT EXISTS idx_email_accounts_oauth_provider_user
  ON email_accounts(oauth_provider_user_id) WHERE oauth_provider_user_id IS NOT NULL;
