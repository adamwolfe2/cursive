-- Audit Logging System
-- Comprehensive activity tracking for compliance and debugging

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID, -- User who performed the action

  -- Action details
  action VARCHAR(100) NOT NULL, -- create, update, delete, view, export, login, etc.
  resource_type VARCHAR(100) NOT NULL, -- campaign, lead, email, settings, etc.
  resource_id UUID, -- ID of the affected resource

  -- Change tracking
  old_values JSONB, -- Previous state (for updates)
  new_values JSONB, -- New state (for creates/updates)
  changes JSONB, -- Specific fields that changed

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100), -- For correlating logs
  api_endpoint VARCHAR(255),
  http_method VARCHAR(10),

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  tags TEXT[] DEFAULT '{}',

  -- Timing
  duration_ms INTEGER, -- How long the action took
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security events table (separate for sensitive events)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID,

  -- Event details
  event_type VARCHAR(100) NOT NULL, -- login_success, login_failed, password_change, etc.
  event_category VARCHAR(50) NOT NULL, -- authentication, authorization, data_access

  -- Context
  ip_address INET,
  user_agent TEXT,
  location_data JSONB, -- GeoIP data if available

  -- Risk assessment
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admins only for audit logs)
CREATE POLICY "Workspace admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Workspace admins can view security events" ON security_events
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Function to create an audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_workspace_id UUID,
  p_user_id UUID,
  p_action VARCHAR(100),
  p_resource_type VARCHAR(100),
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_id VARCHAR(100) DEFAULT NULL,
  p_api_endpoint VARCHAR(255) DEFAULT NULL,
  p_http_method VARCHAR(10) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_severity VARCHAR(20) DEFAULT 'info',
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_changes JSONB := '{}';
BEGIN
  -- Calculate changes if both old and new values provided
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT jsonb_object_agg(key, jsonb_build_object(
      'old', p_old_values->key,
      'new', p_new_values->key
    ))
    INTO v_changes
    FROM jsonb_each(p_new_values)
    WHERE p_old_values->key IS DISTINCT FROM p_new_values->key;
  END IF;

  INSERT INTO audit_logs (
    workspace_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    changes,
    ip_address,
    user_agent,
    request_id,
    api_endpoint,
    http_method,
    metadata,
    severity,
    duration_ms
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    v_changes,
    p_ip_address,
    p_user_agent,
    p_request_id,
    p_api_endpoint,
    p_http_method,
    p_metadata,
    p_severity,
    p_duration_ms
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type VARCHAR(100),
  p_event_category VARCHAR(50),
  p_workspace_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_risk_level VARCHAR(20) DEFAULT 'low',
  p_is_suspicious BOOLEAN DEFAULT false,
  p_suspicious_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO security_events (
    workspace_id,
    user_id,
    event_type,
    event_category,
    ip_address,
    user_agent,
    risk_level,
    is_suspicious,
    suspicious_reason,
    metadata
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_event_type,
    p_event_category,
    p_ip_address,
    p_user_agent,
    p_risk_level,
    p_is_suspicious,
    p_suspicious_reason,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Function to get activity summary for a resource
CREATE OR REPLACE FUNCTION get_resource_activity(
  p_resource_type VARCHAR(100),
  p_resource_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  action VARCHAR(100),
  user_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.user_id,
    al.changes,
    al.created_at
  FROM audit_logs al
  WHERE al.resource_type = p_resource_type
    AND al.resource_id = p_resource_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity, created_at DESC) WHERE severity IN ('warning', 'error', 'critical');
CREATE INDEX IF NOT EXISTS idx_security_events_workspace ON security_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_suspicious ON security_events(is_suspicious, created_at DESC) WHERE is_suspicious = true;

-- Partitioning strategy comment (for future scaling)
-- Consider partitioning audit_logs by created_at for better performance at scale
-- CREATE TABLE audit_logs_y2026m01 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Cleanup old audit logs (keep 90 days by default)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(p_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL
    AND severity NOT IN ('error', 'critical'); -- Keep errors/critical longer

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Comments
COMMENT ON TABLE audit_logs IS 'Comprehensive activity tracking for all user and system actions';
COMMENT ON TABLE security_events IS 'Security-related events for monitoring and compliance';
COMMENT ON FUNCTION create_audit_log IS 'Creates an audit log entry with automatic change calculation';
COMMENT ON FUNCTION log_security_event IS 'Logs a security-related event';
