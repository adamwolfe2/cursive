-- ============================================================================
-- FIXED MISSING TABLES - Safe Version
-- Run this in Supabase SQL Editor
-- Created: 2026-01-26
--
-- This version:
-- 1. Uses correct column names (to_email instead of recipient_email)
-- 2. Creates tables before functions that reference them
-- 3. Handles column additions safely
-- ============================================================================

-- ============================================================================
-- PART 1: ALTER EXISTING TABLES (Add missing columns first)
-- ============================================================================

-- Add columns to campaign_leads
ALTER TABLE campaign_leads
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reply_sentiment TEXT,
ADD COLUMN IF NOT EXISTS reply_intent_score INTEGER,
ADD COLUMN IF NOT EXISTS last_reply_id UUID,
ADD COLUMN IF NOT EXISTS bounce_reason TEXT,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add columns to email_sends
ALTER TABLE email_sends
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_links JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS variant_id UUID,
ADD COLUMN IF NOT EXISTS experiment_id UUID,
ADD COLUMN IF NOT EXISTS conversation_id UUID,
ADD COLUMN IF NOT EXISTS message_id_header VARCHAR(255),
ADD COLUMN IF NOT EXISTS in_reply_to_header VARCHAR(255);

-- Add columns to email_campaigns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS emails_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_clicked INTEGER DEFAULT 0;

-- Add columns to workspaces
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add is_active to email_templates if missing
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- PART 2: CREATE NEW TABLES
-- ============================================================================

-- 1. Email Replies
CREATE TABLE IF NOT EXISTS email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email_send_id UUID REFERENCES email_sends(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emailbison_reply_id TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'question', 'not_interested', 'out_of_office', 'unsubscribe')),
  intent_score INTEGER CHECK (intent_score >= 0 AND intent_score <= 10),
  classification_confidence DECIMAL(3,2) CHECK (classification_confidence >= 0 AND classification_confidence <= 1),
  classification_metadata JSONB DEFAULT '{}',
  classified_at TIMESTAMPTZ,
  suggested_response TEXT,
  suggested_response_metadata JSONB DEFAULT '{}',
  response_generated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded', 'ignored', 'archived')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  response_sent_at TIMESTAMPTZ,
  response_email_send_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Reply Response Templates
CREATE TABLE IF NOT EXISTS reply_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  for_sentiment TEXT[] DEFAULT ARRAY['positive', 'neutral', 'question'],
  for_intent_score_min INTEGER DEFAULT 0,
  for_intent_score_max INTEGER DEFAULT 10,
  subject_template TEXT,
  body_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  auto_suggest BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Suppressed Emails
CREATE TABLE IF NOT EXISTS suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'hard_bounce', 'complaint', 'manual')),
  source_campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  source_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

-- 4. Email Template Variants
CREATE TABLE IF NOT EXISTS email_template_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  variant_key VARCHAR(50) NOT NULL,
  is_control BOOLEAN DEFAULT false,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, variant_key)
);

-- 5. A/B Experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,
  test_type VARCHAR(50) DEFAULT 'subject' CHECK (test_type IN ('subject', 'body', 'full_template', 'send_time')),
  success_metric VARCHAR(50) DEFAULT 'open_rate' CHECK (success_metric IN ('open_rate', 'click_rate', 'reply_rate', 'conversion_rate')),
  minimum_sample_size INTEGER DEFAULT 100,
  confidence_level DECIMAL(5,2) DEFAULT 95.00,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  winner_variant_id UUID,
  statistical_significance DECIMAL(5,2),
  result_summary JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  auto_end_on_significance BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Variant Assignments
CREATE TABLE IF NOT EXISTS ab_variant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_lead_id UUID NOT NULL REFERENCES campaign_leads(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES email_template_variants(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_method VARCHAR(50) DEFAULT 'random',
  UNIQUE(campaign_lead_id)
);

-- 7. Variant Stats
CREATE TABLE IF NOT EXISTS variant_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES email_template_variants(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,
  emails_unsubscribed INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  reply_rate DECIMAL(5,2) DEFAULT 0,
  click_to_open_rate DECIMAL(5,2) DEFAULT 0,
  sample_size INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  first_send_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, experiment_id)
);

-- 8. Email Conversations
CREATE TABLE IF NOT EXISTS email_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_lead_id UUID REFERENCES campaign_leads(id) ON DELETE SET NULL,
  thread_id VARCHAR(255),
  subject_normalized VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'waiting_reply', 'replied', 'closed', 'archived')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_direction VARCHAR(10) CHECK (last_message_direction IN ('outbound', 'inbound')),
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  sentiment VARCHAR(50),
  intent VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Conversation Messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES email_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  email_send_id UUID REFERENCES email_sends(id) ON DELETE SET NULL,
  reply_id UUID,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  subject VARCHAR(500),
  body_text TEXT,
  body_html TEXT,
  snippet VARCHAR(500),
  message_id VARCHAR(255),
  in_reply_to VARCHAR(255),
  references_header TEXT,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  classification JSONB DEFAULT '{}',
  is_auto_reply BOOLEAN DEFAULT false,
  is_out_of_office BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) DEFAULT 'info' CHECK (category IN ('info', 'success', 'warning', 'error', 'action_required')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_type VARCHAR(50),
  related_id UUID,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  email_frequency VARCHAR(20) DEFAULT 'instant' CHECK (email_frequency IN ('instant', 'hourly', 'daily', 'weekly', 'never')),
  type_preferences JSONB DEFAULT '{}',
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- 12. Notification Digest Queue
CREATE TABLE IF NOT EXISTS notification_digest_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Workspace Integrations
CREATE TABLE IF NOT EXISTS workspace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  is_connected BOOLEAN DEFAULT false,
  credentials JSONB DEFAULT '{}',
  oauth_data JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  mapping JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, provider)
);

-- 14. Onboarding Steps
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  step_key VARCHAR(50) NOT NULL,
  step_order INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  skipped_at TIMESTAMPTZ,
  step_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id, step_key)
);

-- 15. Workspace API Keys
CREATE TABLE IF NOT EXISTS workspace_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key_hash)
);

-- 16. Failed Jobs
CREATE TABLE IF NOT EXISTS failed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL,
  job_id VARCHAR(255),
  job_name VARCHAR(255),
  related_type VARCHAR(50),
  related_id UUID,
  error_type VARCHAR(100),
  error_code VARCHAR(50),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  payload JSONB DEFAULT '{}',
  attempts INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 5,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  next_retry_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'failed' CHECK (status IN ('failed', 'pending_retry', 'retrying', 'resolved', 'abandoned')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. System Health Metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(20, 6) NOT NULL,
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  api_endpoint VARCHAR(255),
  http_method VARCHAR(10),
  metadata JSONB DEFAULT '{}',
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  tags TEXT[] DEFAULT '{}',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Security Events
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: ENABLE RLS ON ALL NEW TABLES
-- ============================================================================

ALTER TABLE email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppressed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_variant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_digest_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: RLS POLICIES
-- ============================================================================

-- email_replies
DROP POLICY IF EXISTS "Workspace isolation for email_replies" ON email_replies;
CREATE POLICY "Workspace isolation for email_replies" ON email_replies
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- reply_response_templates
DROP POLICY IF EXISTS "Workspace isolation for reply_response_templates" ON reply_response_templates;
CREATE POLICY "Workspace isolation for reply_response_templates" ON reply_response_templates
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- suppressed_emails
DROP POLICY IF EXISTS "Workspace isolation for suppressed_emails" ON suppressed_emails;
CREATE POLICY "Workspace isolation for suppressed_emails" ON suppressed_emails
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- email_template_variants
DROP POLICY IF EXISTS "Workspace isolation for email_template_variants" ON email_template_variants;
CREATE POLICY "Workspace isolation for email_template_variants" ON email_template_variants
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ab_experiments
DROP POLICY IF EXISTS "Workspace isolation for ab_experiments" ON ab_experiments;
CREATE POLICY "Workspace isolation for ab_experiments" ON ab_experiments
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ab_variant_assignments
DROP POLICY IF EXISTS "Workspace isolation for ab_variant_assignments" ON ab_variant_assignments;
CREATE POLICY "Workspace isolation for ab_variant_assignments" ON ab_variant_assignments
  FOR ALL USING (
    variant_id IN (
      SELECT id FROM email_template_variants
      WHERE workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- variant_stats
DROP POLICY IF EXISTS "Workspace isolation for variant_stats" ON variant_stats;
CREATE POLICY "Workspace isolation for variant_stats" ON variant_stats
  FOR ALL USING (
    variant_id IN (
      SELECT id FROM email_template_variants
      WHERE workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- email_conversations
DROP POLICY IF EXISTS "Workspace isolation for email_conversations" ON email_conversations;
CREATE POLICY "Workspace isolation for email_conversations" ON email_conversations
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- conversation_messages
DROP POLICY IF EXISTS "Workspace isolation for conversation_messages" ON conversation_messages;
CREATE POLICY "Workspace isolation for conversation_messages" ON conversation_messages
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- notifications
DROP POLICY IF EXISTS "Workspace isolation for notifications" ON notifications;
CREATE POLICY "Workspace isolation for notifications" ON notifications
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- notification_preferences
DROP POLICY IF EXISTS "Workspace isolation for notification_preferences" ON notification_preferences;
CREATE POLICY "Workspace isolation for notification_preferences" ON notification_preferences
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- notification_digest_queue
DROP POLICY IF EXISTS "Workspace isolation for notification_digest_queue" ON notification_digest_queue;
CREATE POLICY "Workspace isolation for notification_digest_queue" ON notification_digest_queue
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- workspace_integrations
DROP POLICY IF EXISTS "Workspace isolation for workspace_integrations" ON workspace_integrations;
CREATE POLICY "Workspace isolation for workspace_integrations" ON workspace_integrations
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- onboarding_steps
DROP POLICY IF EXISTS "Workspace isolation for onboarding_steps" ON onboarding_steps;
CREATE POLICY "Workspace isolation for onboarding_steps" ON onboarding_steps
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- workspace_api_keys
DROP POLICY IF EXISTS "Workspace isolation for workspace_api_keys" ON workspace_api_keys;
CREATE POLICY "Workspace isolation for workspace_api_keys" ON workspace_api_keys
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- failed_jobs
DROP POLICY IF EXISTS "Workspace isolation for failed_jobs" ON failed_jobs;
CREATE POLICY "Workspace isolation for failed_jobs" ON failed_jobs
  FOR ALL USING (
    workspace_id IS NULL OR
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- system_health_metrics (read-only for authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view metrics" ON system_health_metrics;
CREATE POLICY "Authenticated users can view metrics" ON system_health_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- audit_logs (admins only)
DROP POLICY IF EXISTS "Workspace admins can view audit_logs" ON audit_logs;
CREATE POLICY "Workspace admins can view audit_logs" ON audit_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- security_events (admins only)
DROP POLICY IF EXISTS "Workspace admins can view security_events" ON security_events;
CREATE POLICY "Workspace admins can view security_events" ON security_events
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- PART 5: INDEXES
-- ============================================================================

-- email_replies indexes
CREATE INDEX IF NOT EXISTS idx_email_replies_workspace ON email_replies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_campaign ON email_replies(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_lead ON email_replies(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_status ON email_replies(status);
CREATE INDEX IF NOT EXISTS idx_email_replies_sentiment ON email_replies(sentiment);
CREATE INDEX IF NOT EXISTS idx_email_replies_received_at ON email_replies(received_at DESC);

-- reply_response_templates indexes
CREATE INDEX IF NOT EXISTS idx_reply_templates_workspace ON reply_response_templates(workspace_id);

-- suppressed_emails indexes
CREATE INDEX IF NOT EXISTS idx_suppressed_emails_workspace ON suppressed_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON suppressed_emails(email);

-- email_template_variants indexes
CREATE INDEX IF NOT EXISTS idx_variants_campaign ON email_template_variants(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_variants_workspace ON email_template_variants(workspace_id);

-- ab_experiments indexes
CREATE INDEX IF NOT EXISTS idx_experiments_campaign ON ab_experiments(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_experiments_workspace ON ab_experiments(workspace_id);

-- ab_variant_assignments indexes
CREATE INDEX IF NOT EXISTS idx_variant_assignments_variant ON ab_variant_assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_assignments_experiment ON ab_variant_assignments(experiment_id);

-- variant_stats indexes
CREATE INDEX IF NOT EXISTS idx_variant_stats_variant ON variant_stats(variant_id);

-- email_sends indexes for new columns
CREATE INDEX IF NOT EXISTS idx_email_sends_variant ON email_sends(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_sends_conversation ON email_sends(conversation_id) WHERE conversation_id IS NOT NULL;

-- email_conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON email_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON email_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_campaign_lead ON email_conversations(campaign_lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON email_conversations(workspace_id, last_message_at DESC);

-- conversation_messages indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_workspace ON conversation_messages(workspace_id);

-- notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_user ON notifications(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(workspace_id) WHERE is_read = false;

-- notification_preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id, workspace_id);

-- notification_digest_queue indexes
CREATE INDEX IF NOT EXISTS idx_digest_queue_scheduled ON notification_digest_queue(scheduled_for) WHERE sent = false;

-- workspace_integrations indexes
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON workspace_integrations(workspace_id);

-- onboarding_steps indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_workspace ON onboarding_steps(workspace_id, user_id);

-- workspace_api_keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON workspace_api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON workspace_api_keys(key_hash) WHERE is_active = true;

-- failed_jobs indexes
CREATE INDEX IF NOT EXISTS idx_failed_jobs_workspace ON failed_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_status ON failed_jobs(status, next_retry_at) WHERE status = 'pending_retry';
CREATE INDEX IF NOT EXISTS idx_failed_jobs_type ON failed_jobs(job_type);

-- system_health_metrics indexes
CREATE INDEX IF NOT EXISTS idx_health_metrics_name ON system_health_metrics(metric_name, recorded_at DESC);

-- audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- security_events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_workspace ON security_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_suspicious ON security_events(is_suspicious) WHERE is_suspicious = true;

-- campaign_leads indexes for new columns
CREATE INDEX IF NOT EXISTS idx_campaign_leads_replied_at ON campaign_leads(replied_at) WHERE replied_at IS NOT NULL;

-- ============================================================================
-- PART 6: FOREIGN KEY CONSTRAINTS (add after tables exist)
-- ============================================================================

-- Add FK for email_replies.reviewed_by
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_replies_reviewed_by_fkey') THEN
    ALTER TABLE email_replies ADD CONSTRAINT email_replies_reviewed_by_fkey
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for email_replies.response_email_send_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_replies_response_email_send_id_fkey') THEN
    ALTER TABLE email_replies ADD CONSTRAINT email_replies_response_email_send_id_fkey
      FOREIGN KEY (response_email_send_id) REFERENCES email_sends(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for campaign_leads.last_reply_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_leads_last_reply_id_fkey') THEN
    ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_last_reply_id_fkey
      FOREIGN KEY (last_reply_id) REFERENCES email_replies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for ab_experiments.winner_variant_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ab_experiments_winner_variant_id_fkey') THEN
    ALTER TABLE ab_experiments ADD CONSTRAINT ab_experiments_winner_variant_id_fkey
      FOREIGN KEY (winner_variant_id) REFERENCES email_template_variants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for email_sends.variant_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_sends_variant_id_fkey') THEN
    ALTER TABLE email_sends ADD CONSTRAINT email_sends_variant_id_fkey
      FOREIGN KEY (variant_id) REFERENCES email_template_variants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for email_sends.experiment_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_sends_experiment_id_fkey') THEN
    ALTER TABLE email_sends ADD CONSTRAINT email_sends_experiment_id_fkey
      FOREIGN KEY (experiment_id) REFERENCES ab_experiments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for email_sends.conversation_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_sends_conversation_id_fkey') THEN
    ALTER TABLE email_sends ADD CONSTRAINT email_sends_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES email_conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for notification_preferences.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_preferences_user_id_fkey') THEN
    ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK for notification_digest_queue.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_digest_queue_user_id_fkey') THEN
    ALTER TABLE notification_digest_queue ADD CONSTRAINT notification_digest_queue_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK for onboarding_steps.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_steps_user_id_fkey') THEN
    ALTER TABLE onboarding_steps ADD CONSTRAINT onboarding_steps_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK for workspace_api_keys.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_api_keys_user_id_fkey') THEN
    ALTER TABLE workspace_api_keys ADD CONSTRAINT workspace_api_keys_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for failed_jobs.resolved_by
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'failed_jobs_resolved_by_fkey') THEN
    ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_resolved_by_fkey
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for audit_logs.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey') THEN
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for security_events.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_events_user_id_fkey') THEN
    ALTER TABLE security_events ADD CONSTRAINT security_events_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- DONE!
-- ============================================================================

-- Summary: Created 19 new tables:
-- 1. email_replies
-- 2. reply_response_templates
-- 3. suppressed_emails
-- 4. email_template_variants
-- 5. ab_experiments
-- 6. ab_variant_assignments
-- 7. variant_stats
-- 8. email_conversations
-- 9. conversation_messages
-- 10. notifications
-- 11. notification_preferences
-- 12. notification_digest_queue
-- 13. workspace_integrations
-- 14. onboarding_steps
-- 15. workspace_api_keys
-- 16. failed_jobs
-- 17. system_health_metrics
-- 18. audit_logs
-- 19. security_events
--
-- Plus: Added columns to existing tables, RLS policies, indexes, and FKs
