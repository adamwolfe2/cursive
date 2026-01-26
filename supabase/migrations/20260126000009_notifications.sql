-- Notification System
-- In-app notifications and alerts for users

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID, -- Specific user, or NULL for workspace-wide

  -- Notification details
  type VARCHAR(50) NOT NULL, -- reply_received, campaign_completed, limit_reached, etc.
  category VARCHAR(50) DEFAULT 'info' CHECK (category IN ('info', 'success', 'warning', 'error', 'action_required')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Related entities
  related_type VARCHAR(50), -- campaign, lead, conversation, email_send
  related_id UUID,

  -- Action link
  action_url VARCHAR(500),
  action_label VARCHAR(100),

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,

  -- Priority and expiry
  priority INTEGER DEFAULT 0, -- Higher = more important
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- In-app notifications
  in_app_enabled BOOLEAN DEFAULT true,

  -- Email notifications
  email_enabled BOOLEAN DEFAULT true,
  email_frequency VARCHAR(20) DEFAULT 'instant' CHECK (email_frequency IN ('instant', 'hourly', 'daily', 'weekly', 'never')),

  -- Per-type preferences (JSONB for flexibility)
  type_preferences JSONB DEFAULT '{
    "reply_received": {"in_app": true, "email": true},
    "campaign_completed": {"in_app": true, "email": true},
    "limit_reached": {"in_app": true, "email": true},
    "bounce_detected": {"in_app": true, "email": false},
    "experiment_winner": {"in_app": true, "email": true},
    "lead_imported": {"in_app": true, "email": false},
    "error_occurred": {"in_app": true, "email": true}
  }',

  -- Quiet hours (no notifications during these times)
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'America/New_York',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, workspace_id)
);

-- Notification digest queue (for batched email notifications)
CREATE TABLE IF NOT EXISTS notification_digest_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,

  -- Digest scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_digest_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
    AND (user_id IS NULL OR user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  );

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
    AND (user_id IS NULL OR user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  );

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage their preferences" ON notification_preferences
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can view their digest queue" ON notification_digest_queue
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_workspace_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_user_id UUID DEFAULT NULL,
  p_category VARCHAR(50) DEFAULT 'info',
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_action_url VARCHAR(500) DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_priority INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    workspace_id,
    user_id,
    type,
    category,
    title,
    message,
    related_type,
    related_id,
    action_url,
    action_label,
    priority,
    metadata
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_type,
    p_category,
    p_title,
    p_message,
    p_related_type,
    p_related_id,
    p_action_url,
    p_action_label,
    p_priority,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_notification_ids UUID[],
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = ANY(p_notification_ids)
    AND (user_id IS NULL OR user_id = p_user_id)
    AND is_read = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_workspace_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE workspace_id = p_workspace_id
    AND (user_id IS NULL OR user_id = p_user_id)
    AND is_read = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_workspace_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE workspace_id = p_workspace_id
    AND (user_id IS NULL OR user_id = p_user_id)
    AND is_read = false
    AND is_dismissed = false
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN v_count;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_user ON notifications(workspace_id, user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(workspace_id, user_id) WHERE is_read = false AND is_dismissed = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_digest_queue_scheduled ON notification_digest_queue(scheduled_for) WHERE sent = false;

-- Comments
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'User notification settings and preferences';
COMMENT ON TABLE notification_digest_queue IS 'Queue for batched email notification digests';
COMMENT ON FUNCTION create_notification IS 'Creates a new notification with optional targeting';
