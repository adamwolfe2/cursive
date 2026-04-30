-- Reply Classification Log
-- Tracks every sentiment classification for accuracy baselining and debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS reply_classification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source identifiers
  reply_id UUID,                        -- email_replies.id (internal)
  emailbison_reply_id TEXT,             -- EmailBison reply ID (external, for idempotency)

  -- Classification metadata
  method TEXT NOT NULL CHECK (method IN ('keyword', 'claude')),
  confidence DECIMAL(4,3) NOT NULL,     -- 0.000 – 1.000
  classification TEXT NOT NULL,         -- The sentiment result

  -- Context (optional, stored for debugging)
  keywords_matched TEXT[] DEFAULT '{}',
  reply_snippet TEXT,                   -- First 280 chars of reply body

  -- Timestamps
  classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint so we skip re-classifying the same reply
CREATE UNIQUE INDEX IF NOT EXISTS idx_reply_classification_logs_reply_id
  ON reply_classification_logs(reply_id)
  WHERE reply_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reply_classification_logs_eb_reply_id
  ON reply_classification_logs(emailbison_reply_id)
  WHERE emailbison_reply_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reply_classification_logs_classified_at
  ON reply_classification_logs(classified_at DESC);

CREATE INDEX IF NOT EXISTS idx_reply_classification_logs_method
  ON reply_classification_logs(method, classified_at DESC);

-- No RLS — admin-only table, accessed via service role only
COMMENT ON TABLE reply_classification_logs IS
  'Audit log of every reply sentiment classification. Used for accuracy baselining, admin review, and idempotency checks.';
