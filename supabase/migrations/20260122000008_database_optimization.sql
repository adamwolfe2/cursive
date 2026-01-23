-- Database Optimization: Indexes and Performance
-- Adds comprehensive indexes for query performance

-- ============================================
-- WORKSPACES TABLE
-- ============================================

-- Index for subdomain lookups (multi-tenant routing)
CREATE INDEX IF NOT EXISTS idx_workspaces_subdomain
ON workspaces(subdomain) WHERE subdomain IS NOT NULL;

-- Index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_custom_domain
ON workspaces(custom_domain) WHERE custom_domain IS NOT NULL;

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_slug
ON workspaces(slug);

-- ============================================
-- USERS TABLE
-- ============================================

-- Index for auth user lookups (authentication)
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id
ON users(auth_user_id);

-- Index for workspace + plan queries (credit checks)
CREATE INDEX IF NOT EXISTS idx_users_workspace_plan
ON users(workspace_id, plan);

-- Index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code
ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Index for daily credit tracking
CREATE INDEX IF NOT EXISTS idx_users_credits_reset
ON users(workspace_id, daily_credits_reset_at)
WHERE daily_credits_used > 0;

-- ============================================
-- QUERIES TABLE
-- ============================================

-- Composite index for workspace queries (list view)
CREATE INDEX IF NOT EXISTS idx_queries_workspace_status
ON queries(workspace_id, status, created_at DESC);

-- Index for topic lookups
CREATE INDEX IF NOT EXISTS idx_queries_topic
ON queries(topic_id);

-- Index for active queries (lead generation)
CREATE INDEX IF NOT EXISTS idx_queries_active
ON queries(workspace_id, status)
WHERE status = 'active';

-- Index for query search (name)
CREATE INDEX IF NOT EXISTS idx_queries_name_search
ON queries(workspace_id, name);

-- ============================================
-- LEADS TABLE
-- ============================================

-- Composite index for workspace leads (primary query)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_query
ON leads(workspace_id, query_id, created_at DESC);

-- Index for delivery status filtering
CREATE INDEX IF NOT EXISTS idx_leads_workspace_delivery
ON leads(workspace_id, delivery_status, created_at DESC);

-- Index for enrichment status filtering
CREATE INDEX IF NOT EXISTS idx_leads_workspace_enrichment
ON leads(workspace_id, enrichment_status, created_at DESC);

-- Index for intent score filtering
CREATE INDEX IF NOT EXISTS idx_leads_intent_score
ON leads(workspace_id, ((intent_data->>'score')::text))
WHERE intent_data IS NOT NULL;

-- Index for company name search
CREATE INDEX IF NOT EXISTS idx_leads_company_name
ON leads USING gin(to_tsvector('english', company_name));

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_leads_workspace_dates
ON leads(workspace_id, created_at, delivered_at);

-- Index for undelivered leads (delivery job)
CREATE INDEX IF NOT EXISTS idx_leads_pending_delivery
ON leads(workspace_id, query_id)
WHERE delivery_status = 'pending';

-- Index for lead marketplace (anonymized leads for buyers)
CREATE INDEX IF NOT EXISTS idx_leads_marketplace
ON leads(created_at DESC)
WHERE is_anonymous = true AND delivery_status = 'delivered';

-- ============================================
-- GLOBAL_TOPICS TABLE
-- ============================================

-- Full-text search index for topic search
CREATE INDEX IF NOT EXISTS idx_global_topics_search
ON global_topics USING gin(to_tsvector('english', topic));

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_global_topics_category
ON global_topics(category);

-- Index for trending topics
CREATE INDEX IF NOT EXISTS idx_global_topics_trending
ON global_topics(trend_direction, current_volume DESC)
WHERE trend_direction IN ('up', 'stable');

-- ============================================
-- TRENDS TABLE
-- ============================================

-- Composite index for topic trends
CREATE INDEX IF NOT EXISTS idx_trends_topic_week
ON trends(topic_id, week_start DESC);

-- Index for volume changes
CREATE INDEX IF NOT EXISTS idx_trends_volume_change
ON trends(week_start DESC, change_percent DESC);

-- ============================================
-- SAVED_SEARCHES TABLE
-- ============================================

-- Index for workspace saved searches
CREATE INDEX IF NOT EXISTS idx_saved_searches_workspace
ON saved_searches(workspace_id, created_at DESC);

-- Index for search name lookups
CREATE INDEX IF NOT EXISTS idx_saved_searches_name
ON saved_searches(workspace_id, name);

-- ============================================
-- PEOPLE_SEARCH_RESULTS TABLE
-- ============================================

-- Composite index for workspace results
CREATE INDEX IF NOT EXISTS idx_people_search_workspace
ON people_search_results(workspace_id, created_at DESC);

-- Index for email revealed status
CREATE INDEX IF NOT EXISTS idx_people_search_revealed
ON people_search_results(workspace_id, email_revealed);

-- Index for person name search
CREATE INDEX IF NOT EXISTS idx_people_search_name
ON people_search_results USING gin(
  to_tsvector('english', (person_data->>'full_name')::text)
);

-- ============================================
-- INTEGRATIONS TABLE
-- ============================================

-- Index for workspace integrations
CREATE INDEX IF NOT EXISTS idx_integrations_workspace_type
ON integrations(workspace_id, type, status);

-- Index for active integrations only
CREATE INDEX IF NOT EXISTS idx_integrations_active
ON integrations(workspace_id, type)
WHERE status = 'active';

-- ============================================
-- BILLING_EVENTS TABLE
-- ============================================

-- Index for workspace billing history
CREATE INDEX IF NOT EXISTS idx_billing_events_workspace
ON billing_events(workspace_id, created_at DESC);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_billing_events_type
ON billing_events(workspace_id, event_type, created_at DESC);

-- ============================================
-- EXPORT_JOBS TABLE
-- ============================================

-- Index for workspace exports
CREATE INDEX IF NOT EXISTS idx_export_jobs_workspace
ON export_jobs(workspace_id, created_at DESC);

-- Index for pending exports (processing)
CREATE INDEX IF NOT EXISTS idx_export_jobs_pending
ON export_jobs(workspace_id, status)
WHERE status = 'pending';

-- ============================================
-- LEAD_PURCHASES TABLE (Marketplace)
-- ============================================

-- Index for buyer purchases
CREATE INDEX IF NOT EXISTS idx_lead_purchases_buyer
ON lead_purchases(buyer_email, created_at DESC);

-- Index for lead purchase status
CREATE INDEX IF NOT EXISTS idx_lead_purchases_lead
ON lead_purchases(lead_id, payment_status);

-- Index for successful purchases
CREATE INDEX IF NOT EXISTS idx_lead_purchases_successful
ON lead_purchases(buyer_email, created_at DESC)
WHERE payment_status = 'completed';

-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Analyze tables to update statistics
ANALYZE workspaces;
ANALYZE users;
ANALYZE queries;
ANALYZE leads;
ANALYZE global_topics;
ANALYZE trends;
ANALYZE saved_searches;
ANALYZE people_search_results;
ANALYZE integrations;
ANALYZE billing_events;
ANALYZE export_jobs;
ANALYZE credit_usage;

-- Enable auto-vacuum for large tables
ALTER TABLE leads SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE credit_usage SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE people_search_results SET (autovacuum_vacuum_scale_factor = 0.1);

-- ============================================
-- QUERY PERFORMANCE VIEWS
-- ============================================

-- View for workspace analytics (pre-aggregated)
CREATE OR REPLACE VIEW workspace_analytics AS
SELECT
  w.id as workspace_id,
  w.name as workspace_name,
  COUNT(DISTINCT q.id) as total_queries,
  COUNT(DISTINCT CASE WHEN q.status = 'active' THEN q.id END) as active_queries,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.delivery_status = 'delivered' THEN l.id END) as delivered_leads,
  COUNT(DISTINCT CASE WHEN l.created_at > NOW() - INTERVAL '7 days' THEN l.id END) as leads_last_7_days,
  COUNT(DISTINCT CASE WHEN l.created_at > NOW() - INTERVAL '30 days' THEN l.id END) as leads_last_30_days,
  MAX(l.created_at) as last_lead_generated,
  COUNT(DISTINCT u.id) as user_count
FROM workspaces w
LEFT JOIN queries q ON q.workspace_id = w.id
LEFT JOIN leads l ON l.workspace_id = w.id
LEFT JOIN users u ON u.workspace_id = w.id
GROUP BY w.id, w.name;

-- Grant access to authenticated users
GRANT SELECT ON workspace_analytics TO authenticated;

-- ============================================
-- MAINTENANCE FUNCTIONS
-- ============================================

-- Function to archive old leads (older than 90 days)
CREATE OR REPLACE FUNCTION archive_old_leads()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move old leads to archive table (if exists)
  -- Or add archived flag
  UPDATE leads
  SET archived = true
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND archived = false;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old credit usage records
CREATE OR REPLACE FUNCTION cleanup_old_credit_usage()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM credit_usage
  WHERE timestamp < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY credit_usage_stats;
  -- Add more materialized views here as needed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_workspaces_subdomain IS 'Fast lookups for multi-tenant routing';
COMMENT ON INDEX idx_users_auth_user_id IS 'Critical for authentication performance';
COMMENT ON INDEX idx_queries_workspace_status IS 'Primary index for query list views';
COMMENT ON INDEX idx_leads_workspace_query IS 'Primary index for lead list views';
COMMENT ON INDEX idx_leads_company_name IS 'Full-text search for company names';
COMMENT ON INDEX idx_global_topics_search IS 'Full-text search for topic autocomplete';

COMMENT ON VIEW workspace_analytics IS 'Pre-aggregated workspace statistics for dashboards';

COMMENT ON FUNCTION archive_old_leads IS 'Archives leads older than 90 days to improve query performance';
COMMENT ON FUNCTION cleanup_old_credit_usage IS 'Deletes credit usage records older than 90 days';
COMMENT ON FUNCTION refresh_all_materialized_views IS 'Refreshes all materialized views concurrently';
