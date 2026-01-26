-- Performance Indexes Migration
-- Adds indexes for frequently queried columns

-- =============================================
-- Campaign Leads Indexes
-- =============================================

-- For sequence processing: find leads ready for next email
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_status
  ON campaign_leads (campaign_id, status);

-- For finding leads that need follow-up
CREATE INDEX IF NOT EXISTS idx_campaign_leads_next_email
  ON campaign_leads (campaign_id, next_email_scheduled_at)
  WHERE status IN ('ready', 'in_sequence');

-- For timezone-aware scheduling
CREATE INDEX IF NOT EXISTS idx_campaign_leads_timezone
  ON campaign_leads (campaign_id, status)
  WHERE status = 'ready';

-- =============================================
-- Email Sends Indexes
-- =============================================

-- For batch operations and reporting
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_status
  ON email_sends (campaign_id, status);

-- For finding emails to send
CREATE INDEX IF NOT EXISTS idx_email_sends_pending
  ON email_sends (status, created_at)
  WHERE status = 'approved';

-- For conversation threading
CREATE INDEX IF NOT EXISTS idx_email_sends_conversation
  ON email_sends (conversation_id)
  WHERE conversation_id IS NOT NULL;

-- For analytics
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at
  ON email_sends (campaign_id, sent_at)
  WHERE sent_at IS NOT NULL;

-- =============================================
-- Notifications Indexes
-- =============================================

-- For unread count and notification list
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, read_at)
  WHERE read_at IS NULL;

-- For notification ordering
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- =============================================
-- Leads Indexes
-- =============================================

-- For lead listing with pagination
CREATE INDEX IF NOT EXISTS idx_leads_workspace_created
  ON leads (workspace_id, created_at DESC);

-- For email lookups (deduplication)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_email
  ON leads (workspace_id, email)
  WHERE email IS NOT NULL;

-- =============================================
-- Email Templates Indexes
-- =============================================

-- For template selection
CREATE INDEX IF NOT EXISTS idx_templates_workspace_active
  ON email_templates (workspace_id, is_active)
  WHERE is_active = true;

-- =============================================
-- Conversations Indexes
-- =============================================

-- For conversation listing
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_updated
  ON email_conversations (workspace_id, updated_at DESC);

-- For unread conversations
CREATE INDEX IF NOT EXISTS idx_conversations_unread
  ON email_conversations (workspace_id, status)
  WHERE status = 'open';

-- =============================================
-- Audit Logs Indexes
-- =============================================

-- For audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_created
  ON audit_logs (workspace_id, created_at DESC);

-- For resource-specific queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs (resource_type, resource_id);

-- =============================================
-- Suppression List Indexes
-- =============================================

-- For fast suppression checks
CREATE INDEX IF NOT EXISTS idx_suppressed_emails_workspace_email
  ON suppressed_emails (workspace_id, email);

-- =============================================
-- A/B Testing Indexes
-- =============================================

-- For active experiments
CREATE INDEX IF NOT EXISTS idx_ab_experiments_active
  ON ab_experiments (campaign_id, status)
  WHERE status = 'running';

-- For variant assignment lookups
CREATE INDEX IF NOT EXISTS idx_variant_assignments_lookup
  ON ab_variant_assignments (experiment_id, campaign_lead_id);

-- =============================================
-- Failed Jobs Indexes
-- =============================================

-- For retry queue processing
CREATE INDEX IF NOT EXISTS idx_failed_jobs_retry
  ON failed_jobs (status, next_retry_at)
  WHERE status IN ('pending', 'retrying');

-- =============================================
-- Comments
-- =============================================
-- These indexes optimize:
-- 1. Campaign sequence processing (hourly cron)
-- 2. Email batch operations
-- 3. Notification queries
-- 4. Lead listing and deduplication
-- 5. Audit log queries
-- 6. Suppression checks (every send)
-- 7. A/B experiment operations
-- 8. Failed job retry queue
