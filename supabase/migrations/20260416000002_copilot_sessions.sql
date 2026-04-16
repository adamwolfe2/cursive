-- Persisted chat history for the admin copilot.
-- Each user owns their sessions; messages are ordered by created_at within a session.

CREATE TABLE IF NOT EXISTS copilot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surface TEXT NOT NULL DEFAULT 'admin',
  title TEXT NOT NULL DEFAULT 'New chat',
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_sessions_user_recent
  ON copilot_sessions(user_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES copilot_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  segments JSONB,
  tool_calls JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_messages_session
  ON copilot_messages(session_id, created_at);

-- RLS: users see only their own sessions + messages.
ALTER TABLE copilot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own copilot sessions" ON copilot_sessions;
CREATE POLICY "users read own copilot sessions" ON copilot_sessions
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "users delete own copilot sessions" ON copilot_sessions;
CREATE POLICY "users delete own copilot sessions" ON copilot_sessions
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "users read own copilot messages" ON copilot_messages;
CREATE POLICY "users read own copilot messages" ON copilot_messages
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM copilot_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service role copilot sessions" ON copilot_sessions;
CREATE POLICY "service role copilot sessions" ON copilot_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role copilot messages" ON copilot_messages;
CREATE POLICY "service role copilot messages" ON copilot_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE copilot_sessions IS 'Admin Audience Copilot chat sessions. One row per conversation.';
COMMENT ON TABLE copilot_messages IS 'Messages within a copilot session. Segments + tool_calls stored as JSONB for replay.';
