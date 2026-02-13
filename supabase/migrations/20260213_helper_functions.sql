/**
 * Database Helper Functions
 * Utility RPC functions for common operations
 */

-- ============================================================================
-- WORKSPACE STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_workspace_stats(p_workspace_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    -- Lead counts
    'total_leads', COUNT(l.id),
    'leads_by_source', json_build_object(
      'pixel', COUNT(l.id) FILTER (WHERE l.source = 'audiencelab_pixel'),
      'database', COUNT(l.id) FILTER (WHERE l.source = 'audiencelab_database'),
      'marketplace', COUNT(l.id) FILTER (WHERE l.source = 'marketplace'),
      'upload', COUNT(l.id) FILTER (WHERE l.source = 'upload')
    ),
    'leads_by_status', json_build_object(
      'pending', COUNT(l.id) FILTER (WHERE l.verification_status = 'pending'),
      'approved', COUNT(l.id) FILTER (WHERE l.verification_status = 'approved'),
      'rejected', COUNT(l.id) FILTER (WHERE l.verification_status = 'rejected')
    ),

    -- Quality metrics
    'avg_lead_score', ROUND(AVG(l.score) FILTER (WHERE l.score > 0), 2),
    'high_quality_leads', COUNT(l.id) FILTER (WHERE l.score >= 80),
    'medium_quality_leads', COUNT(l.id) FILTER (WHERE l.score >= 60 AND l.score < 80),
    'low_quality_leads', COUNT(l.id) FILTER (WHERE l.score < 60),

    -- Activity metrics
    'leads_this_week', COUNT(l.id) FILTER (WHERE l.created_at > NOW() - INTERVAL '7 days'),
    'leads_this_month', COUNT(l.id) FILTER (WHERE l.created_at > NOW() - INTERVAL '30 days'),
    'last_lead_at', MAX(l.created_at),

    -- Campaign metrics
    'active_campaigns', (
      SELECT COUNT(*) FROM campaigns
      WHERE workspace_id = p_workspace_id AND status = 'active'
    ),

    -- Credit metrics
    'credits_balance', w.credits_balance,
    'credits_spent_30d', COALESCE((
      SELECT SUM(credits_used)
      FROM credit_usage
      WHERE workspace_id = p_workspace_id
        AND created_at > NOW() - INTERVAL '30 days'
        AND credits_used > 0
    ), 0),

    -- Pixel metrics
    'active_pixels', (
      SELECT COUNT(DISTINCT pixel_id)
      FROM audiencelab_pixels
      WHERE workspace_id = p_workspace_id
    ),
    'pixel_events_7d', (
      SELECT COUNT(*)
      FROM audiencelab_events
      WHERE workspace_id = p_workspace_id
        AND created_at > NOW() - INTERVAL '7 days'
        AND processed = true
    )
  ) INTO v_stats
  FROM workspaces w
  LEFT JOIN leads l ON l.workspace_id = w.id AND l.deleted_at IS NULL
  WHERE w.id = p_workspace_id
  GROUP BY w.id, w.credits_balance;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- CREDIT USAGE SUMMARY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_credit_usage_summary(
  p_workspace_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
  v_summary JSON;
BEGIN
  SELECT json_build_object(
    'total_used', COALESCE(SUM(credits_used) FILTER (WHERE credits_used > 0), 0),
    'total_refunded', COALESCE(ABS(SUM(credits_used)) FILTER (WHERE credits_used < 0), 0),
    'by_action', json_build_object(
      'database_pull', COALESCE(SUM(credits_used) FILTER (WHERE action_type = 'al_database_pull'), 0),
      'segment_run', COALESCE(SUM(credits_used) FILTER (WHERE action_type = 'segment_run'), 0),
      'batch_enrichment', COALESCE(SUM(credits_used) FILTER (WHERE action_type = 'batch_enrichment'), 0),
      'marketplace_purchase', COALESCE(SUM(credits_used) FILTER (WHERE action_type = 'marketplace_purchase'), 0)
    ),
    'daily_usage', (
      SELECT json_agg(daily_data ORDER BY day DESC)
      FROM (
        SELECT
          DATE(created_at) as day,
          COALESCE(SUM(credits_used), 0) as credits
        FROM credit_usage
        WHERE workspace_id = p_workspace_id
          AND created_at > NOW() - INTERVAL '1 day' * p_days
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
        LIMIT p_days
      ) daily_data
    ),
    'avg_daily', ROUND(
      COALESCE(SUM(credits_used) FILTER (WHERE credits_used > 0), 0) / NULLIF(p_days, 0),
      2
    )
  ) INTO v_summary
  FROM credit_usage
  WHERE workspace_id = p_workspace_id
    AND created_at > NOW() - INTERVAL '1 day' * p_days;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- DUPLICATE EMAIL CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION check_duplicate_emails(
  p_workspace_id UUID,
  p_emails TEXT[]
) RETURNS TABLE(
  email TEXT,
  exists BOOLEAN,
  lead_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.email,
    (l.id IS NOT NULL) as exists,
    l.id as lead_id,
    l.created_at
  FROM UNNEST(p_emails) e(email)
  LEFT JOIN leads l ON
    LOWER(l.email) = LOWER(e.email)
    AND l.workspace_id = p_workspace_id
    AND l.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- LEAD QUALITY REPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lead_quality_report(p_workspace_id UUID)
RETURNS JSON AS $$
DECLARE
  v_report JSON;
BEGIN
  SELECT json_build_object(
    'total_leads', COUNT(*),
    'completeness', json_build_object(
      'has_email', COUNT(*) FILTER (WHERE email IS NOT NULL),
      'has_phone', COUNT(*) FILTER (WHERE phone IS NOT NULL),
      'has_company', COUNT(*) FILTER (WHERE company_name IS NOT NULL),
      'has_title', COUNT(*) FILTER (WHERE job_title IS NOT NULL),
      'has_linkedin', COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL),
      'fully_complete', COUNT(*) FILTER (WHERE
        email IS NOT NULL AND
        phone IS NOT NULL AND
        company_name IS NOT NULL AND
        job_title IS NOT NULL AND
        linkedin_url IS NOT NULL
      )
    ),
    'verification', json_build_object(
      'email_verified', COUNT(*) FILTER (WHERE email_verified = true),
      'phone_verified', COUNT(*) FILTER (WHERE phone_verified = true),
      'both_verified', COUNT(*) FILTER (WHERE email_verified = true AND phone_verified = true)
    ),
    'score_distribution', json_build_object(
      '90-100', COUNT(*) FILTER (WHERE score >= 90),
      '80-89', COUNT(*) FILTER (WHERE score >= 80 AND score < 90),
      '70-79', COUNT(*) FILTER (WHERE score >= 70 AND score < 80),
      '60-69', COUNT(*) FILTER (WHERE score >= 60 AND score < 70),
      '0-59', COUNT(*) FILTER (WHERE score < 60)
    ),
    'top_industries', (
      SELECT json_agg(industry_data ORDER BY count DESC)
      FROM (
        SELECT industry, COUNT(*) as count
        FROM leads
        WHERE workspace_id = p_workspace_id
          AND industry IS NOT NULL
          AND deleted_at IS NULL
        GROUP BY industry
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) industry_data
    )
  ) INTO v_report
  FROM leads
  WHERE workspace_id = p_workspace_id
    AND deleted_at IS NULL;

  RETURN v_report;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SEGMENT PERFORMANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_segment_performance(p_workspace_id UUID)
RETURNS TABLE(
  segment_id UUID,
  segment_name TEXT,
  total_runs INTEGER,
  last_run_at TIMESTAMPTZ,
  last_count INTEGER,
  avg_count DECIMAL,
  total_leads_pulled INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    COUNT(cu.id)::INTEGER as total_runs,
    MAX(s.last_run_at) as last_run_at,
    s.last_count,
    AVG((cu.metadata->>'new_leads')::INTEGER) as avg_count,
    SUM((cu.metadata->>'new_leads')::INTEGER)::INTEGER as total_leads_pulled
  FROM saved_segments s
  LEFT JOIN credit_usage cu ON
    cu.workspace_id = s.workspace_id
    AND cu.action_type = 'segment_run'
    AND (cu.metadata->>'segment_id')::UUID = s.id
  WHERE s.workspace_id = p_workspace_id
    AND s.status = 'active'
  GROUP BY s.id, s.name, s.last_count
  ORDER BY total_runs DESC, last_run_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PIXEL PERFORMANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pixel_performance(p_workspace_id UUID)
RETURNS TABLE(
  pixel_id TEXT,
  website_name TEXT,
  total_events INTEGER,
  events_7d INTEGER,
  events_30d INTEGER,
  unique_visitors INTEGER,
  identity_resolution_rate DECIMAL,
  avg_pages_per_visitor DECIMAL,
  last_event_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.pixel_id,
    p.website_name,
    COUNT(e.id)::INTEGER as total_events,
    COUNT(e.id) FILTER (WHERE e.created_at > NOW() - INTERVAL '7 days')::INTEGER as events_7d,
    COUNT(e.id) FILTER (WHERE e.created_at > NOW() - INTERVAL '30 days')::INTEGER as events_30d,
    COUNT(DISTINCT e.visitor_id)::INTEGER as unique_visitors,
    ROUND(
      COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.email IS NOT NULL)::DECIMAL /
      NULLIF(COUNT(DISTINCT e.visitor_id), 0) * 100,
      2
    ) as identity_resolution_rate,
    ROUND(
      COUNT(e.id)::DECIMAL / NULLIF(COUNT(DISTINCT e.visitor_id), 0),
      2
    ) as avg_pages_per_visitor,
    MAX(e.created_at) as last_event_at
  FROM audiencelab_pixels p
  LEFT JOIN audiencelab_events e ON
    e.pixel_id = p.pixel_id
    AND e.processed = true
  WHERE p.workspace_id = p_workspace_id
  GROUP BY p.pixel_id, p.website_name
  ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_workspace_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_credit_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_emails TO authenticated;
GRANT EXECUTE ON FUNCTION get_lead_quality_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_segment_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_pixel_performance TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_workspace_stats IS 'Comprehensive workspace statistics for dashboard';
COMMENT ON FUNCTION get_credit_usage_summary IS 'Credit spending analysis over time';
COMMENT ON FUNCTION check_duplicate_emails IS 'Batch check if emails already exist in workspace';
COMMENT ON FUNCTION get_lead_quality_report IS 'Detailed lead quality and completeness report';
COMMENT ON FUNCTION get_segment_performance IS 'Performance metrics for saved segments';
COMMENT ON FUNCTION get_pixel_performance IS 'Pixel tracking analytics and identity resolution rates';
