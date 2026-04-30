-- ============================================================================
-- Gmail reply poller state — Phase 2.5
-- ----------------------------------------------------------------------------
-- Tracks the last time we polled each Gmail account for new replies, plus
-- the most recent Gmail historyId we successfully processed. The poller
-- uses this to do incremental fetches instead of reprocessing the inbox
-- on every run.
--
-- Used by:
--   - src/lib/services/gmail/reply-poller.service.ts
--   - src/inngest/functions/gmail-reply-poller.ts (cron */5 * * * *)
-- ============================================================================

ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS last_reply_poll_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_gmail_history_id TEXT;

COMMENT ON COLUMN email_accounts.last_reply_poll_at IS
  'Most recent successful Gmail poll. Used to query messages newer than this timestamp.';
COMMENT ON COLUMN email_accounts.last_gmail_history_id IS
  'Most recent Gmail historyId we processed. Future versions can use users.history.list for true incremental sync.';

-- Track Gmail reply ids we already processed, to dedupe across polls.
-- We could use a separate table but adding a column on email_replies is cheaper.
ALTER TABLE email_replies
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_replies_gmail_message_id
  ON email_replies(gmail_message_id) WHERE gmail_message_id IS NOT NULL;

COMMENT ON COLUMN email_replies.gmail_message_id IS
  'When the reply came in via the Gmail poller, this is the Gmail-internal message id used for dedupe (UNIQUE).';
