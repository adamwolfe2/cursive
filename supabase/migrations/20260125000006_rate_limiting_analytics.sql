-- Phases 55-60: Predictive Analytics, Notifications, Rate Limiting

-- ============================================================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- Device info
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Unique constraint
  CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

-- Indexes
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- NOTIFICATION HISTORY
-- ============================================================================
CREATE TYPE notification_channel AS ENUM ('push', 'email', 'in_app', 'slack', 'sms');

CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Notification details
  channel notification_channel NOT NULL,
  notification_type TEXT NOT NULL, -- 'new_lead', 'lead_reply', 'status_change', etc.
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,

  -- Targeting
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Status
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_workspace_id ON notification_history(workspace_id);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);
CREATE INDEX idx_notification_history_unread ON notification_history(user_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- API RATE LIMITS TABLE
-- ============================================================================
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Rate limit configuration
  endpoint_pattern TEXT NOT NULL, -- e.g., '/api/leads/*', '/api/people-search'
  requests_per_minute INTEGER NOT NULL DEFAULT 60,
  requests_per_hour INTEGER NOT NULL DEFAULT 1000,
  requests_per_day INTEGER NOT NULL DEFAULT 10000,

  -- Current usage (reset periodically)
  minute_count INTEGER DEFAULT 0,
  hour_count INTEGER DEFAULT 0,
  day_count INTEGER DEFAULT 0,

  -- Reset times
  minute_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 minute',
  hour_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  day_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_rate_limits_workspace_id ON api_rate_limits(workspace_id);
CREATE UNIQUE INDEX idx_api_rate_limits_workspace_endpoint ON api_rate_limits(workspace_id, endpoint_pattern);

-- ============================================================================
-- API USAGE LOG
-- ============================================================================
CREATE TABLE api_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,

  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_usage_log_workspace_id ON api_usage_log(workspace_id);
CREATE INDEX idx_api_usage_log_created_at ON api_usage_log(created_at DESC);
CREATE INDEX idx_api_usage_log_endpoint ON api_usage_log(endpoint);

-- Partition by time for performance (optional, for high-volume)
-- CREATE INDEX idx_api_usage_log_time_partition ON api_usage_log(created_at) WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- ANALYTICS REPORTS TABLE
-- ============================================================================
CREATE TYPE report_type AS ENUM ('lead_performance', 'email_analytics', 'conversion_funnel', 'team_activity', 'revenue', 'custom');
CREATE TYPE report_frequency AS ENUM ('once', 'daily', 'weekly', 'monthly');

CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Report configuration
  name TEXT NOT NULL,
  description TEXT,
  report_type report_type NOT NULL,

  -- Parameters
  date_range_type TEXT DEFAULT 'last_30_days', -- 'last_7_days', 'last_30_days', 'custom'
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  filters JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '[]'::jsonb,
  grouping TEXT[], -- e.g., ['status', 'source']

  -- Scheduling
  frequency report_frequency DEFAULT 'once',
  schedule_time TIME,
  schedule_day INTEGER, -- 0-6 for weekly, 1-31 for monthly
  recipients TEXT[],

  -- Last run
  last_run_at TIMESTAMPTZ,
  last_run_result JSONB,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_reports_workspace_id ON analytics_reports(workspace_id);
CREATE INDEX idx_analytics_reports_created_by ON analytics_reports(created_by);
CREATE INDEX idx_analytics_reports_scheduled ON analytics_reports(frequency, is_active)
  WHERE frequency != 'once' AND is_active = TRUE;

-- Updated_at trigger
CREATE TRIGGER analytics_reports_updated_at
  BEFORE UPDATE ON analytics_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PREDICTIVE MODELS CACHE
-- ============================================================================
CREATE TABLE prediction_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- Prediction type
  prediction_type TEXT NOT NULL, -- 'conversion', 'churn', 'best_time_contact', 'deal_value'

  -- Prediction result
  prediction_value DECIMAL(10,4),
  confidence DECIMAL(5,4),
  features_used JSONB,
  model_version TEXT,

  -- Validity
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prediction_cache_lead_id ON prediction_cache(lead_id);
CREATE INDEX idx_prediction_cache_type ON prediction_cache(prediction_type);
CREATE INDEX idx_prediction_cache_expires ON prediction_cache(expires_at) WHERE expires_at > NOW();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_cache ENABLE ROW LEVEL SECURITY;

-- Push Subscriptions: User's own subscriptions
CREATE POLICY "User owns push_subscriptions" ON push_subscriptions
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Notification History: Workspace isolation
CREATE POLICY "Workspace isolation for notification_history" ON notification_history
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- API Rate Limits: Workspace isolation (admin only)
CREATE POLICY "Workspace isolation for api_rate_limits" ON api_rate_limits
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')));

-- API Usage Log: Workspace isolation
CREATE POLICY "Workspace isolation for api_usage_log" ON api_usage_log
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- Analytics Reports: Workspace isolation
CREATE POLICY "Workspace isolation for analytics_reports" ON analytics_reports
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- Prediction Cache: Workspace isolation
CREATE POLICY "Workspace isolation for prediction_cache" ON prediction_cache
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_workspace_id UUID,
  p_endpoint TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit api_rate_limits;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_limit
  FROM api_rate_limits
  WHERE workspace_id = p_workspace_id
  AND p_endpoint LIKE endpoint_pattern;

  IF NOT FOUND THEN
    -- No specific limit, use defaults
    RETURN TRUE;
  END IF;

  -- Reset counters if needed
  IF v_limit.minute_reset_at < NOW() THEN
    UPDATE api_rate_limits
    SET minute_count = 0, minute_reset_at = NOW() + INTERVAL '1 minute'
    WHERE id = v_limit.id;
    v_limit.minute_count := 0;
  END IF;

  IF v_limit.hour_reset_at < NOW() THEN
    UPDATE api_rate_limits
    SET hour_count = 0, hour_reset_at = NOW() + INTERVAL '1 hour'
    WHERE id = v_limit.id;
    v_limit.hour_count := 0;
  END IF;

  IF v_limit.day_reset_at < NOW() THEN
    UPDATE api_rate_limits
    SET day_count = 0, day_reset_at = NOW() + INTERVAL '1 day'
    WHERE id = v_limit.id;
    v_limit.day_count := 0;
  END IF;

  -- Check limits
  IF v_limit.minute_count >= v_limit.requests_per_minute THEN
    RETURN FALSE;
  END IF;

  IF v_limit.hour_count >= v_limit.requests_per_hour THEN
    RETURN FALSE;
  END IF;

  IF v_limit.day_count >= v_limit.requests_per_day THEN
    RETURN FALSE;
  END IF;

  -- Increment counters
  UPDATE api_rate_limits
  SET minute_count = minute_count + 1,
      hour_count = hour_count + 1,
      day_count = day_count + 1
  WHERE id = v_limit.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
  -- Delete old API usage logs (keep 30 days)
  DELETE FROM api_usage_log
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete old notification history (keep 90 days)
  DELETE FROM notification_history
  WHERE sent_at < NOW() - INTERVAL '90 days';

  -- Delete expired prediction cache
  DELETE FROM prediction_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions';
COMMENT ON TABLE notification_history IS 'History of all notifications sent';
COMMENT ON TABLE api_rate_limits IS 'Rate limiting configuration per workspace';
COMMENT ON TABLE api_usage_log IS 'API usage tracking for analytics';
COMMENT ON TABLE analytics_reports IS 'Custom analytics report definitions';
COMMENT ON TABLE prediction_cache IS 'Cached ML predictions for leads';
