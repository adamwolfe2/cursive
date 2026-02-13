/**
 * Database Performance Optimization
 * Add composite indexes for common query patterns
 * Create materialized views for dashboard performance
 */

-- ============================================================================
-- LEADS TABLE INDEXES
-- ============================================================================

-- Lead listing with score sorting (dashboard default view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_score_created
  ON leads(workspace_id, score DESC, created_at DESC)
  WHERE deleted_at IS NULL;

-- Lead filtering by source and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_source_status
  ON leads(workspace_id, source, verification_status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Marketplace lead discovery
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_marketplace_active
  ON leads(is_marketplace_listed, marketplace_price, score DESC)
  WHERE is_marketplace_listed = true AND deleted_at IS NULL;

-- Marketplace filtering by industry
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_marketplace_industry
  ON leads(industry, marketplace_price)
  WHERE is_marketplace_listed = true AND deleted_at IS NULL;

-- Lead search by email (for duplicate checking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_workspace_email
  ON leads(workspace_id, LOWER(email))
  WHERE deleted_at IS NULL AND email IS NOT NULL;

-- ============================================================================
-- AUDIENCELAB EVENTS INDEXES
-- ============================================================================

-- Pixel event processing queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_al_events_unprocessed
  ON audiencelab_events(created_at)
  WHERE processed = false;

-- Pixel event history by workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_al_events_workspace_created
  ON audiencelab_events(workspace_id, created_at DESC)
  WHERE processed = true;

-- Event type analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_al_events_workspace_type
  ON audiencelab_events(workspace_id, event_type, created_at DESC);

-- ============================================================================
-- CAMPAIGNS & ASSIGNMENTS INDEXES
-- ============================================================================

-- User lead assignments by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ula_workspace_status_created
  ON user_lead_assignments(workspace_id, status, created_at DESC);

-- Campaign lead lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_leads_campaign
  ON campaign_leads(campaign_id, lead_id);

-- Campaign performance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_workspace_status
  ON campaigns(workspace_id, status, created_at DESC);

-- ============================================================================
-- MARKETPLACE & PARTNERS INDEXES
-- ============================================================================

-- Purchase history by workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_workspace_created
  ON marketplace_purchases(buyer_workspace_id, created_at DESC);

-- Purchase items by purchase
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_items_purchase
  ON marketplace_purchase_items(purchase_id, partner_id);

-- Commission processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mpi_commission_processing
  ON marketplace_purchase_items(commission_status, commission_payable_at)
  WHERE commission_status IN ('pending_holdback', 'payable');

-- Partner earnings by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partner_earnings_partner_status
  ON partner_earnings(partner_id, status, created_at DESC);

-- ============================================================================
-- CREDIT USAGE INDEXES
-- ============================================================================

-- Credit usage history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_usage_workspace_date
  ON credit_usage(workspace_id, created_at DESC);

-- Credit usage by action type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_usage_action_date
  ON credit_usage(action_type, created_at DESC);

-- ============================================================================
-- MATERIALIZED VIEW: Workspace Stats
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS workspace_stats AS
SELECT
  w.id as workspace_id,
  w.name as workspace_name,
  w.credits_balance,

  -- Lead counts by source
  COUNT(l.id) FILTER (WHERE l.source = 'audiencelab_pixel') as pixel_leads,
  COUNT(l.id) FILTER (WHERE l.source = 'audiencelab_database') as database_leads,
  COUNT(l.id) FILTER (WHERE l.source = 'marketplace') as marketplace_leads,
  COUNT(l.id) as total_leads,

  -- Lead quality metrics
  AVG(l.score) FILTER (WHERE l.score > 0) as avg_lead_score,
  COUNT(l.id) FILTER (WHERE l.score >= 80) as high_quality_leads,

  -- Activity metrics
  MAX(l.created_at) as last_lead_at,
  COUNT(DISTINCT DATE(l.created_at)) FILTER (WHERE l.created_at > NOW() - INTERVAL '30 days') as active_days_30d,

  -- Credit usage (last 30 days)
  COALESCE(SUM(cu.credits_used) FILTER (WHERE cu.created_at > NOW() - INTERVAL '30 days'), 0) as credits_spent_30d,

  -- Pixel activity
  COUNT(DISTINCT ae.pixel_id) as active_pixels,
  COUNT(ae.id) FILTER (WHERE ae.created_at > NOW() - INTERVAL '7 days') as pixel_events_7d,

  -- Timestamps
  NOW() as refreshed_at
FROM workspaces w
LEFT JOIN leads l ON l.workspace_id = w.id AND l.deleted_at IS NULL
LEFT JOIN credit_usage cu ON cu.workspace_id = w.id
LEFT JOIN audiencelab_events ae ON ae.workspace_id = w.id AND ae.processed = true
GROUP BY w.id, w.name, w.credits_balance;

-- Unique index on workspace_id for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_stats_workspace
  ON workspace_stats(workspace_id);

-- ============================================================================
-- MATERIALIZED VIEW: Partner Performance
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS partner_performance AS
SELECT
  p.id as partner_id,
  p.company_name,

  -- Lead supply metrics
  COUNT(l.id) as total_leads_supplied,
  COUNT(l.id) FILTER (WHERE l.created_at > NOW() - INTERVAL '30 days') as leads_supplied_30d,
  AVG(l.marketplace_price) as avg_price_per_lead,

  -- Sales metrics
  COUNT(DISTINCT mpi.id) as total_sales,
  COUNT(DISTINCT mpi.id) FILTER (WHERE mpi.created_at > NOW() - INTERVAL '30 days') as sales_30d,
  SUM(mpi.price_at_purchase) as total_revenue,

  -- Commission metrics
  SUM(mpi.commission_amount) as total_commissions,
  SUM(mpi.commission_amount) FILTER (WHERE pe.status = 'paid') as paid_commissions,
  SUM(mpi.commission_amount) FILTER (WHERE pe.status = 'available') as available_commissions,

  -- Quality metrics
  AVG(l.score) as avg_lead_quality,

  -- Timestamps
  MAX(l.created_at) as last_upload_at,
  NOW() as refreshed_at
FROM partners p
LEFT JOIN leads l ON l.partner_id = p.id AND l.deleted_at IS NULL
LEFT JOIN marketplace_purchase_items mpi ON mpi.partner_id = p.id
LEFT JOIN partner_earnings pe ON pe.partner_id = p.id
GROUP BY p.id, p.company_name;

-- Unique index on partner_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_performance_partner
  ON partner_performance(partner_id);

-- ============================================================================
-- REFRESH FUNCTIONS
-- ============================================================================

-- Function to refresh workspace stats
CREATE OR REPLACE FUNCTION refresh_workspace_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY workspace_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh partner performance
CREATE OR REPLACE FUNCTION refresh_partner_performance()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY partner_performance;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON workspace_stats TO authenticated;
GRANT SELECT ON partner_performance TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_workspace_stats TO service_role;
GRANT EXECUTE ON FUNCTION refresh_partner_performance TO service_role;

-- Comments
COMMENT ON MATERIALIZED VIEW workspace_stats IS 'Aggregated workspace metrics refreshed hourly';
COMMENT ON MATERIALIZED VIEW partner_performance IS 'Partner performance metrics refreshed daily';
