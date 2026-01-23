-- OpenInfo Platform - Core Tables Migration
-- Creates workspaces and users tables with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- WORKSPACES TABLE
-- ============================================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry_vertical TEXT,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,

  -- Branding
  branding JSONB DEFAULT '{
    "logo_url": null,
    "primary_color": "#3b82f6",
    "secondary_color": "#1e40af"
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$')
);

-- Indexes for workspaces
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_subdomain ON workspaces(subdomain);
CREATE INDEX idx_workspaces_custom_domain ON workspaces(custom_domain);

-- Updated_at trigger for workspaces
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TYPE user_plan AS ENUM ('free', 'pro');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Profile
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Role & Plan
  role user_role NOT NULL DEFAULT 'member',
  plan user_plan NOT NULL DEFAULT 'free',

  -- Credits & Limits
  daily_credits_used INTEGER NOT NULL DEFAULT 0,
  daily_credit_limit INTEGER NOT NULL DEFAULT 3, -- Free: 3, Pro: 1000

  -- Referral
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for users
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_workspace_id ON users(workspace_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- Updated_at trigger for users
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Workspaces: Users can only see their own workspace
CREATE POLICY "Users can view their own workspace" ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Workspaces: Only owners can update
CREATE POLICY "Owners can update workspace" ON workspaces
  FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid() AND role = 'owner'
    )
  );

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users: Can view users in same workspace
CREATE POLICY "Users can view workspace members" ON users
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Users: Can update own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Users: Admins can update workspace members
CREATE POLICY "Admins can update members" ON users
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's workspace_id
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = required_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to reset daily credits (to be called by cron)
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE users SET daily_credits_used = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE workspaces IS 'Multi-tenant workspaces with branding and configuration';
COMMENT ON TABLE users IS 'User profiles linked to auth.users with workspace association';
COMMENT ON COLUMN users.daily_credit_limit IS 'Free: 3, Pro: 1000 credits per day';
COMMENT ON FUNCTION reset_daily_credits() IS 'Cron job to reset daily_credits_used at midnight';
-- OpenInfo Platform - Global Topics & Trends Migration
-- Creates global topics and weekly trends tracking

-- ============================================================================
-- GLOBAL TOPICS TABLE
-- ============================================================================
CREATE TYPE topic_category AS ENUM (
  'technology',
  'marketing',
  'sales',
  'finance',
  'operations',
  'hr',
  'legal',
  'product',
  'other'
);

CREATE TYPE trend_direction AS ENUM ('up', 'down', 'stable');

CREATE TABLE global_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  category topic_category NOT NULL DEFAULT 'other',

  -- Search optimization
  topic_tsv TSVECTOR,

  -- Current metrics
  current_volume INTEGER NOT NULL DEFAULT 0,
  trend_direction trend_direction NOT NULL DEFAULT 'stable',
  change_percent NUMERIC(5,2) DEFAULT 0.00,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_topic UNIQUE(topic),
  CONSTRAINT topic_not_empty CHECK (length(trim(topic)) > 0)
);

-- Create GIN index for full-text search
CREATE INDEX idx_global_topics_topic_tsv ON global_topics USING GIN(topic_tsv);
CREATE INDEX idx_global_topics_category ON global_topics(category);
CREATE INDEX idx_global_topics_trend ON global_topics(trend_direction);
CREATE INDEX idx_global_topics_volume ON global_topics(current_volume DESC);

-- Trigger to maintain tsvector
CREATE OR REPLACE FUNCTION global_topics_tsvector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.topic_tsv := to_tsvector('english', NEW.topic);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER global_topics_tsvector_trigger
  BEFORE INSERT OR UPDATE OF topic ON global_topics
  FOR EACH ROW
  EXECUTE FUNCTION global_topics_tsvector_update();

-- Updated_at trigger
CREATE TRIGGER global_topics_updated_at
  BEFORE UPDATE ON global_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRENDS TABLE (Weekly snapshots)
-- ============================================================================
CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES global_topics(id) ON DELETE CASCADE,

  -- Time period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Metrics
  volume INTEGER NOT NULL DEFAULT 0,
  change_percent NUMERIC(5,2) DEFAULT 0.00,

  -- Rankings
  rank_overall INTEGER,
  rank_category INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_topic_week UNIQUE(topic_id, week_start),
  CONSTRAINT valid_week CHECK (week_end > week_start),
  CONSTRAINT positive_volume CHECK (volume >= 0)
);

-- Indexes for trends
CREATE INDEX idx_trends_topic_id ON trends(topic_id);
CREATE INDEX idx_trends_week_start ON trends(week_start DESC);
CREATE INDEX idx_trends_volume ON trends(volume DESC);
CREATE INDEX idx_trends_change ON trends(change_percent DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Global topics are publicly readable
ALTER TABLE global_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global topics are viewable by authenticated users" ON global_topics
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only system can insert/update global topics
CREATE POLICY "Only service role can modify global topics" ON global_topics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trends are publicly readable
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trends are viewable by authenticated users" ON trends
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only system can insert/update trends
CREATE POLICY "Only service role can modify trends" ON trends
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to search topics by text
CREATE OR REPLACE FUNCTION search_topics(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  category topic_category,
  current_volume INTEGER,
  trend_direction trend_direction,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gt.id,
    gt.topic,
    gt.category,
    gt.current_volume,
    gt.trend_direction,
    ts_rank(gt.topic_tsv, websearch_to_tsquery('english', search_query)) AS relevance
  FROM global_topics gt
  WHERE gt.topic_tsv @@ websearch_to_tsquery('english', search_query)
  ORDER BY relevance DESC, gt.current_volume DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get trending topics (gainers)
CREATE OR REPLACE FUNCTION get_trending_gainers(result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  category topic_category,
  current_volume INTEGER,
  change_percent NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gt.id,
    gt.topic,
    gt.category,
    gt.current_volume,
    gt.change_percent
  FROM global_topics gt
  WHERE gt.trend_direction = 'up'
  ORDER BY gt.change_percent DESC, gt.current_volume DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get trending topics (losers)
CREATE OR REPLACE FUNCTION get_trending_losers(result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  category topic_category,
  current_volume INTEGER,
  change_percent NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gt.id,
    gt.topic,
    gt.category,
    gt.current_volume,
    gt.change_percent
  FROM global_topics gt
  WHERE gt.trend_direction = 'down'
  ORDER BY gt.change_percent ASC, gt.current_volume DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update topic trends (to be called weekly by Inngest)
CREATE OR REPLACE FUNCTION update_topic_trends()
RETURNS void AS $$
DECLARE
  rec RECORD;
  prev_volume INTEGER;
  change NUMERIC(5,2);
BEGIN
  FOR rec IN SELECT id, current_volume FROM global_topics LOOP
    -- Get previous week's volume
    SELECT volume INTO prev_volume
    FROM trends
    WHERE topic_id = rec.id
    ORDER BY week_start DESC
    LIMIT 1;

    IF prev_volume IS NOT NULL AND prev_volume > 0 THEN
      -- Calculate change percentage
      change := ((rec.current_volume - prev_volume)::NUMERIC / prev_volume) * 100;

      -- Update topic
      UPDATE global_topics
      SET
        change_percent = change,
        trend_direction = CASE
          WHEN change > 10 THEN 'up'::trend_direction
          WHEN change < -10 THEN 'down'::trend_direction
          ELSE 'stable'::trend_direction
        END
      WHERE id = rec.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE global_topics IS 'Global list of trackable topics with search and trend data';
COMMENT ON TABLE trends IS 'Weekly snapshots of topic volumes for trend analysis';
COMMENT ON COLUMN global_topics.topic_tsv IS 'Full-text search vector for topic search';
COMMENT ON FUNCTION search_topics IS 'Full-text search for topics with relevance ranking';
COMMENT ON FUNCTION update_topic_trends IS 'Weekly cron job to calculate trend changes';
-- OpenInfo Platform - Query System Migration
-- Creates queries and saved searches tables

-- ============================================================================
-- QUERIES TABLE
-- ============================================================================
CREATE TYPE query_status AS ENUM ('active', 'paused', 'completed');

CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES global_topics(id) ON DELETE RESTRICT,

  -- Query configuration
  name TEXT,
  filters JSONB NOT NULL DEFAULT '{
    "location": null,
    "company_size": null,
    "industry": null,
    "revenue_range": null,
    "employee_range": null,
    "technologies": null,
    "exclude_companies": []
  }'::jsonb,

  -- Status
  status query_status NOT NULL DEFAULT 'active',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  -- Stats
  total_leads_generated INTEGER NOT NULL DEFAULT 0,
  leads_this_week INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT query_name_not_empty CHECK (name IS NULL OR length(trim(name)) > 0)
);

-- Indexes for queries
CREATE INDEX idx_queries_workspace_id ON queries(workspace_id);
CREATE INDEX idx_queries_topic_id ON queries(topic_id);
CREATE INDEX idx_queries_status ON queries(status);
CREATE INDEX idx_queries_next_run_at ON queries(next_run_at) WHERE status = 'active';
CREATE INDEX idx_queries_created_at ON queries(created_at DESC);

-- GIN index for filter queries
CREATE INDEX idx_queries_filters ON queries USING GIN(filters);

-- Updated_at trigger
CREATE TRIGGER queries_updated_at
  BEFORE UPDATE ON queries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAVED SEARCHES TABLE
-- ============================================================================
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Search details
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Usage stats
  last_used_at TIMESTAMPTZ,
  use_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT saved_search_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes for saved searches
CREATE INDEX idx_saved_searches_workspace_id ON saved_searches(workspace_id);
CREATE INDEX idx_saved_searches_created_by ON saved_searches(created_by);
CREATE INDEX idx_saved_searches_use_count ON saved_searches(use_count DESC);

-- GIN index for filter queries
CREATE INDEX idx_saved_searches_filters ON saved_searches USING GIN(filters);

-- Updated_at trigger
CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on queries
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Queries: Workspace isolation
CREATE POLICY "Workspace isolation for queries" ON queries
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Enable RLS on saved_searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Saved searches: Workspace isolation
CREATE POLICY "Workspace isolation for saved searches" ON saved_searches
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check query limit based on plan
CREATE OR REPLACE FUNCTION check_query_limit(user_workspace_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan user_plan;
  query_count INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan INTO user_plan
  FROM users
  WHERE auth_user_id = auth.uid()
  AND workspace_id = user_workspace_id
  LIMIT 1;

  -- Count active queries
  SELECT COUNT(*) INTO query_count
  FROM queries
  WHERE workspace_id = user_workspace_id
  AND status = 'active';

  -- Check limits: Free = 1 query, Pro = 5 queries
  IF user_plan = 'free' THEN
    RETURN query_count < 1;
  ELSIF user_plan = 'pro' THEN
    RETURN query_count < 5;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active queries for cron processing
CREATE OR REPLACE FUNCTION get_active_queries_for_processing()
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  topic_id UUID,
  filters JSONB,
  topic TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.workspace_id,
    q.topic_id,
    q.filters,
    gt.topic
  FROM queries q
  INNER JOIN global_topics gt ON gt.id = q.topic_id
  WHERE q.status = 'active'
  AND (q.next_run_at IS NULL OR q.next_run_at <= NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update query run times
CREATE OR REPLACE FUNCTION update_query_run_time(query_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE queries
  SET
    last_run_at = NOW(),
    next_run_at = NOW() + INTERVAL '1 day'
  WHERE id = query_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment query stats
CREATE OR REPLACE FUNCTION increment_query_leads(query_id UUID, lead_count INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE queries
  SET
    total_leads_generated = total_leads_generated + lead_count,
    leads_this_week = leads_this_week + lead_count
  WHERE id = query_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reset weekly lead counts (to be called weekly)
CREATE OR REPLACE FUNCTION reset_weekly_lead_counts()
RETURNS void AS $$
  UPDATE queries SET leads_this_week = 0;
$$ LANGUAGE plpgsql;

-- Function to auto-name query based on filters
CREATE OR REPLACE FUNCTION generate_query_name(
  topic_name TEXT,
  query_filters JSONB
)
RETURNS TEXT AS $$
DECLARE
  name_parts TEXT[];
  location TEXT;
  industry TEXT[];
BEGIN
  name_parts := ARRAY[topic_name];

  -- Add location if present
  IF query_filters ? 'location' AND query_filters->'location' IS NOT NULL THEN
    location := query_filters->'location'->>'country';
    IF location IS NOT NULL THEN
      name_parts := array_append(name_parts, 'in ' || location);
    END IF;
  END IF;

  -- Add industry if present
  IF query_filters ? 'industry' AND query_filters->'industry' IS NOT NULL THEN
    industry := ARRAY(SELECT jsonb_array_elements_text(query_filters->'industry'));
    IF array_length(industry, 1) > 0 THEN
      name_parts := array_append(name_parts, '(' || industry[1] || ')');
    END IF;
  END IF;

  RETURN array_to_string(name_parts, ' ');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-generate query name if not provided
CREATE OR REPLACE FUNCTION set_query_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NULL THEN
    NEW.name := generate_query_name(
      (SELECT topic FROM global_topics WHERE id = NEW.topic_id),
      NEW.filters
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queries_set_name
  BEFORE INSERT ON queries
  FOR EACH ROW
  EXECUTE FUNCTION set_query_name();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE queries IS 'User-created queries to track companies researching specific topics';
COMMENT ON TABLE saved_searches IS 'Reusable search filter configurations';
COMMENT ON COLUMN queries.filters IS 'JSONB object containing location, company_size, industry filters';
COMMENT ON FUNCTION check_query_limit IS 'Enforces plan limits: Free=1 query, Pro=5 queries';
COMMENT ON FUNCTION get_active_queries_for_processing IS 'Gets queries ready for daily lead generation';
-- OpenInfo Platform - Lead System Migration
-- Creates leads, credit usage, and export jobs tables

-- ============================================================================
-- LEADS TABLE
-- ============================================================================
CREATE TYPE enrichment_status AS ENUM ('pending', 'enriching', 'enriched', 'failed');
CREATE TYPE delivery_status AS ENUM ('pending', 'delivered', 'failed');

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,

  -- Company data (from DataShopper)
  company_data JSONB NOT NULL DEFAULT '{
    "name": null,
    "domain": null,
    "industry": null,
    "size": null,
    "location": null,
    "description": null,
    "technologies": [],
    "intent_score": null,
    "intent_signals": []
  }'::jsonb,

  -- Contact data (from Clay enrichment)
  contact_data JSONB DEFAULT '{
    "contacts": [],
    "total_contacts": 0,
    "enrichment_date": null
  }'::jsonb,

  -- Status
  enrichment_status enrichment_status NOT NULL DEFAULT 'pending',
  delivery_status delivery_status NOT NULL DEFAULT 'pending',

  -- Tracking
  enrichment_attempts INTEGER NOT NULL DEFAULT 0,
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enriched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT company_name_required CHECK (company_data->>'name' IS NOT NULL),
  CONSTRAINT positive_enrichment_attempts CHECK (enrichment_attempts >= 0),
  CONSTRAINT positive_delivery_attempts CHECK (delivery_attempts >= 0)
);

-- Indexes for leads
CREATE INDEX idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX idx_leads_query_id ON leads(query_id);
CREATE INDEX idx_leads_enrichment_status ON leads(enrichment_status);
CREATE INDEX idx_leads_delivery_status ON leads(delivery_status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- GIN indexes for JSONB queries
CREATE INDEX idx_leads_company_data ON leads USING GIN(company_data);
CREATE INDEX idx_leads_contact_data ON leads USING GIN(contact_data);

-- Index for company domain (unique per workspace)
CREATE UNIQUE INDEX idx_leads_workspace_domain ON leads(workspace_id, (company_data->>'domain'))
  WHERE company_data->>'domain' IS NOT NULL;

-- ============================================================================
-- CREDIT USAGE TABLE
-- ============================================================================
CREATE TYPE credit_action AS ENUM (
  'email_reveal',
  'lead_export',
  'people_search',
  'contact_enrichment'
);

CREATE TABLE credit_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action details
  action_type credit_action NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,

  -- Reference
  reference_id UUID, -- ID of lead, search, etc.
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_credits CHECK (credits_used > 0)
);

-- Indexes for credit_usage
CREATE INDEX idx_credit_usage_workspace_id ON credit_usage(workspace_id);
CREATE INDEX idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX idx_credit_usage_action_type ON credit_usage(action_type);
CREATE INDEX idx_credit_usage_created_at ON credit_usage(created_at DESC);
CREATE INDEX idx_credit_usage_reference_id ON credit_usage(reference_id);

-- ============================================================================
-- EXPORT JOBS TABLE
-- ============================================================================
CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE export_format AS ENUM ('csv', 'json');

CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Export configuration
  export_format export_format NOT NULL DEFAULT 'csv',
  filters JSONB DEFAULT '{}'::jsonb,

  -- Status
  status export_status NOT NULL DEFAULT 'pending',
  file_url TEXT,
  file_size_bytes BIGINT,
  row_count INTEGER,

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- File expiry (7 days from completion)

  -- Constraints
  CONSTRAINT positive_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  CONSTRAINT positive_row_count CHECK (row_count IS NULL OR row_count >= 0)
);

-- Indexes for export_jobs
CREATE INDEX idx_export_jobs_workspace_id ON export_jobs(workspace_id);
CREATE INDEX idx_export_jobs_user_id ON export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_created_at ON export_jobs(created_at DESC);
CREATE INDEX idx_export_jobs_expires_at ON export_jobs(expires_at)
  WHERE status = 'completed';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Leads: Workspace isolation
CREATE POLICY "Workspace isolation for leads" ON leads
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Enable RLS on credit_usage
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

-- Credit usage: Workspace isolation (read-only for users)
CREATE POLICY "Workspace isolation for credit usage" ON credit_usage
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Enable RLS on export_jobs
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Export jobs: Workspace isolation
CREATE POLICY "Workspace isolation for export jobs" ON export_jobs
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get leads pending enrichment
CREATE OR REPLACE FUNCTION get_leads_pending_enrichment(batch_size INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  query_id UUID,
  company_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.workspace_id, l.query_id, l.company_data
  FROM leads l
  WHERE l.enrichment_status = 'pending'
  AND l.enrichment_attempts < 3
  ORDER BY l.created_at
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leads pending delivery
CREATE OR REPLACE FUNCTION get_leads_pending_delivery(batch_size INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  query_id UUID,
  company_data JSONB,
  contact_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.workspace_id, l.query_id, l.company_data, l.contact_data
  FROM leads l
  WHERE l.enrichment_status = 'enriched'
  AND l.delivery_status = 'pending'
  AND l.delivery_attempts < 3
  ORDER BY l.enriched_at
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record credit usage
CREATE OR REPLACE FUNCTION record_credit_usage(
  p_workspace_id UUID,
  p_user_id UUID,
  p_action_type credit_action,
  p_credits_used INTEGER DEFAULT 1,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  -- Insert credit usage record
  INSERT INTO credit_usage (
    workspace_id,
    user_id,
    action_type,
    credits_used,
    reference_id,
    metadata
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_action_type,
    p_credits_used,
    p_reference_id,
    p_metadata
  ) RETURNING id INTO usage_id;

  -- Update user's daily credits used
  UPDATE users
  SET daily_credits_used = daily_credits_used + p_credits_used
  WHERE id = p_user_id;

  RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has available credits
CREATE OR REPLACE FUNCTION check_credits_available(
  p_user_id UUID,
  p_credits_needed INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  user_rec RECORD;
BEGIN
  SELECT daily_credits_used, daily_credit_limit
  INTO user_rec
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN (user_rec.daily_credits_used + p_credits_needed) <= user_rec.daily_credit_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update lead enrichment status
CREATE OR REPLACE FUNCTION update_lead_enrichment(
  p_lead_id UUID,
  p_status enrichment_status,
  p_contact_data JSONB DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET
    enrichment_status = p_status,
    contact_data = COALESCE(p_contact_data, contact_data),
    enriched_at = CASE WHEN p_status = 'enriched' THEN NOW() ELSE enriched_at END,
    enrichment_attempts = enrichment_attempts + 1,
    last_error = p_error
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update lead delivery status
CREATE OR REPLACE FUNCTION update_lead_delivery(
  p_lead_id UUID,
  p_status delivery_status,
  p_error TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET
    delivery_status = p_status,
    delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
    delivery_attempts = delivery_attempts + 1,
    last_error = p_error
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired exports (to be called daily)
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
  DELETE FROM export_jobs
  WHERE status = 'completed'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE leads IS 'Lead records with company and contact data';
COMMENT ON TABLE credit_usage IS 'Tracks all credit consumption actions';
COMMENT ON TABLE export_jobs IS 'Background CSV/JSON export job queue';
COMMENT ON COLUMN leads.company_data IS 'Company information from DataShopper API';
COMMENT ON COLUMN leads.contact_data IS 'Enriched contact information from Clay API';
COMMENT ON FUNCTION record_credit_usage IS 'Records credit usage and updates user daily count';
COMMENT ON FUNCTION check_credits_available IS 'Validates user has sufficient credits';
-- OpenInfo Platform - People Search Migration
-- Creates people search and results tables

-- ============================================================================
-- PEOPLE SEARCH RESULTS TABLE
-- ============================================================================
CREATE TABLE people_search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Person data
  person_data JSONB NOT NULL DEFAULT '{
    "full_name": null,
    "title": null,
    "company": null,
    "location": null,
    "linkedin_url": null,
    "email": null,
    "email_revealed": false,
    "phone": null,
    "seniority_level": null,
    "department": null,
    "technologies": []
  }'::jsonb,

  -- Search context
  search_filters JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Email reveal tracking
  email_revealed_at TIMESTAMPTZ,
  email_revealed_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT person_name_required CHECK (person_data->>'full_name' IS NOT NULL)
);

-- Indexes for people_search_results
CREATE INDEX idx_people_search_workspace_id ON people_search_results(workspace_id);
CREATE INDEX idx_people_search_user_id ON people_search_results(user_id);
CREATE INDEX idx_people_search_created_at ON people_search_results(created_at DESC);
CREATE INDEX idx_people_search_email_revealed ON people_search_results(email_revealed_at)
  WHERE email_revealed_at IS NOT NULL;

-- GIN indexes for JSONB queries
CREATE INDEX idx_people_search_person_data ON people_search_results USING GIN(person_data);
CREATE INDEX idx_people_search_filters ON people_search_results USING GIN(search_filters);

-- Composite index for deduplication (workspace + name + company)
CREATE INDEX idx_people_search_dedup ON people_search_results(
  workspace_id,
  (person_data->>'full_name'),
  (person_data->>'company')
);

-- ============================================================================
-- SAVED PEOPLE SEARCHES TABLE
-- ============================================================================
CREATE TABLE saved_people_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Search details
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{
    "title": null,
    "company": null,
    "location": null,
    "seniority_level": null,
    "department": null,
    "industry": null
  }'::jsonb,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT saved_people_search_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes for saved_people_searches
CREATE INDEX idx_saved_people_searches_workspace_id ON saved_people_searches(workspace_id);
CREATE INDEX idx_saved_people_searches_user_id ON saved_people_searches(user_id);
CREATE INDEX idx_saved_people_searches_created_at ON saved_people_searches(created_at DESC);

-- GIN index for filters
CREATE INDEX idx_saved_people_searches_filters ON saved_people_searches USING GIN(filters);

-- Updated_at trigger
CREATE TRIGGER saved_people_searches_updated_at
  BEFORE UPDATE ON saved_people_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on people_search_results
ALTER TABLE people_search_results ENABLE ROW LEVEL SECURITY;

-- People search results: Workspace isolation
CREATE POLICY "Workspace isolation for people search" ON people_search_results
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Enable RLS on saved_people_searches
ALTER TABLE saved_people_searches ENABLE ROW LEVEL SECURITY;

-- Saved people searches: Workspace isolation
CREATE POLICY "Workspace isolation for saved people searches" ON saved_people_searches
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to search people with filters
CREATE OR REPLACE FUNCTION search_people(
  p_workspace_id UUID,
  p_filters JSONB,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  person_data JSONB,
  email_revealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  title_filter TEXT;
  company_filter TEXT;
  location_filter TEXT;
  seniority_filter TEXT;
  department_filter TEXT;
BEGIN
  -- Extract filters
  title_filter := p_filters->>'title';
  company_filter := p_filters->>'company';
  location_filter := p_filters->>'location';
  seniority_filter := p_filters->>'seniority_level';
  department_filter := p_filters->>'department';

  RETURN QUERY
  SELECT
    psr.id,
    psr.person_data,
    psr.email_revealed_at,
    psr.created_at
  FROM people_search_results psr
  WHERE psr.workspace_id = p_workspace_id
  AND (title_filter IS NULL OR psr.person_data->>'title' ILIKE '%' || title_filter || '%')
  AND (company_filter IS NULL OR psr.person_data->>'company' ILIKE '%' || company_filter || '%')
  AND (location_filter IS NULL OR psr.person_data->>'location' ILIKE '%' || location_filter || '%')
  AND (seniority_filter IS NULL OR psr.person_data->>'seniority_level' = seniority_filter)
  AND (department_filter IS NULL OR psr.person_data->>'department' = department_filter)
  ORDER BY psr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to reveal email (costs credits)
CREATE OR REPLACE FUNCTION reveal_person_email(
  p_result_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  workspace_id_var UUID;
  person_email TEXT;
  credits_available BOOLEAN;
BEGIN
  -- Get workspace and check if email already revealed
  SELECT
    workspace_id,
    person_data->>'email',
    (person_data->>'email_revealed')::BOOLEAN
  INTO
    workspace_id_var,
    person_email,
    credits_available
  FROM people_search_results
  WHERE id = p_result_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Person not found';
  END IF;

  -- If already revealed, return email without charging
  IF credits_available THEN
    RETURN jsonb_build_object(
      'email', person_email,
      'already_revealed', true
    );
  END IF;

  -- Check if user has credits
  IF NOT check_credits_available(p_user_id, 1) THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Record credit usage
  PERFORM record_credit_usage(
    workspace_id_var,
    p_user_id,
    'email_reveal'::credit_action,
    1,
    p_result_id,
    jsonb_build_object('result_id', p_result_id)
  );

  -- Update result to mark email as revealed
  UPDATE people_search_results
  SET
    person_data = jsonb_set(person_data, '{email_revealed}', 'true'::jsonb),
    email_revealed_at = NOW(),
    email_revealed_by = p_user_id
  WHERE id = p_result_id;

  RETURN jsonb_build_object(
    'email', person_email,
    'already_revealed', false,
    'credits_used', 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get people search stats
CREATE OR REPLACE FUNCTION get_people_search_stats(p_workspace_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_searches', COUNT(*),
    'emails_revealed', COUNT(*) FILTER (WHERE email_revealed_at IS NOT NULL),
    'unique_companies', COUNT(DISTINCT person_data->>'company'),
    'this_month', COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))
  )
  INTO stats
  FROM people_search_results
  WHERE workspace_id = p_workspace_id;

  RETURN stats;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to deduplicate person (check if already exists)
CREATE OR REPLACE FUNCTION person_exists(
  p_workspace_id UUID,
  p_full_name TEXT,
  p_company TEXT
)
RETURNS UUID AS $$
DECLARE
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id
  FROM people_search_results
  WHERE workspace_id = p_workspace_id
  AND person_data->>'full_name' = p_full_name
  AND person_data->>'company' = p_company
  LIMIT 1;

  RETURN existing_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update saved search usage
CREATE OR REPLACE FUNCTION update_saved_search_usage(p_search_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE saved_people_searches
  SET
    last_used_at = NOW(),
    use_count = use_count + 1
  WHERE id = p_search_id;
END;
$$ LANGUAGE plpgsql;

-- Function to export people search results to CSV format
CREATE OR REPLACE FUNCTION export_people_to_csv(
  p_workspace_id UUID,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  full_name TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  email TEXT,
  linkedin_url TEXT,
  seniority_level TEXT,
  department TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    psr.person_data->>'full_name',
    psr.person_data->>'title',
    psr.person_data->>'company',
    psr.person_data->>'location',
    CASE
      WHEN (psr.person_data->>'email_revealed')::BOOLEAN THEN psr.person_data->>'email'
      ELSE '[HIDDEN]'
    END,
    psr.person_data->>'linkedin_url',
    psr.person_data->>'seniority_level',
    psr.person_data->>'department'
  FROM people_search_results psr
  WHERE psr.workspace_id = p_workspace_id
  ORDER BY psr.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE people_search_results IS 'Individual people found through search with optional email reveal';
COMMENT ON TABLE saved_people_searches IS 'Reusable people search filter configurations';
COMMENT ON COLUMN people_search_results.person_data IS 'JSONB containing all person details including email';
COMMENT ON FUNCTION reveal_person_email IS 'Reveals email for a person result, costs 1 credit';
COMMENT ON FUNCTION person_exists IS 'Checks if person already exists to prevent duplicates';
COMMENT ON FUNCTION search_people IS 'Full-text search across people with filters';
-- OpenInfo Platform - Integrations & Billing Migration
-- Creates integrations, billing events, and notification preferences tables

-- ============================================================================
-- INTEGRATIONS TABLE
-- ============================================================================
CREATE TYPE integration_type AS ENUM ('slack', 'zapier', 'webhook', 'email');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error');

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Integration details
  type integration_type NOT NULL,
  name TEXT NOT NULL,
  status integration_status NOT NULL DEFAULT 'active',

  -- Configuration (encrypted sensitive data)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  total_events_sent INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT integration_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT positive_events CHECK (total_events_sent >= 0),
  CONSTRAINT positive_errors CHECK (error_count >= 0)
);

-- Indexes for integrations
CREATE INDEX idx_integrations_workspace_id ON integrations(workspace_id);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_created_at ON integrations(created_at DESC);

-- Unique constraint per workspace and type (one Slack, one Zapier, etc.)
CREATE UNIQUE INDEX idx_integrations_workspace_type ON integrations(workspace_id, type)
  WHERE status = 'active';

-- Updated_at trigger
CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BILLING EVENTS TABLE
-- ============================================================================
CREATE TYPE billing_event_type AS ENUM (
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'payment_succeeded',
  'payment_failed',
  'plan_upgraded',
  'plan_downgraded'
);

CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Event details
  event_type billing_event_type NOT NULL,
  stripe_event_id TEXT UNIQUE,

  -- Financial data
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',

  -- Plan information
  old_plan user_plan,
  new_plan user_plan,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount_cents IS NULL OR amount_cents >= 0)
);

-- Indexes for billing_events
CREATE INDEX idx_billing_events_workspace_id ON billing_events(workspace_id);
CREATE INDEX idx_billing_events_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_created_at ON billing_events(created_at DESC);
CREATE INDEX idx_billing_events_stripe_id ON billing_events(stripe_event_id);

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Email notifications
  email_new_leads BOOLEAN NOT NULL DEFAULT true,
  email_daily_digest BOOLEAN NOT NULL DEFAULT true,
  email_weekly_report BOOLEAN NOT NULL DEFAULT true,
  email_query_completed BOOLEAN NOT NULL DEFAULT false,
  email_credit_low BOOLEAN NOT NULL DEFAULT true,
  email_billing_updates BOOLEAN NOT NULL DEFAULT true,

  -- In-app notifications
  inapp_new_leads BOOLEAN NOT NULL DEFAULT true,
  inapp_mentions BOOLEAN NOT NULL DEFAULT true,
  inapp_system_updates BOOLEAN NOT NULL DEFAULT true,

  -- Slack notifications (if integrated)
  slack_new_leads BOOLEAN NOT NULL DEFAULT false,
  slack_daily_digest BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for notification_preferences
CREATE INDEX idx_notification_prefs_user_id ON notification_preferences(user_id);

-- Updated_at trigger
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_create_notification_prefs
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- ============================================================================
-- STRIPE CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Stripe IDs
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,

  -- Current subscription
  subscription_status TEXT, -- active, canceled, past_due, etc.
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Payment method
  default_payment_method TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT stripe_customer_id_not_empty CHECK (length(trim(stripe_customer_id)) > 0)
);

-- Indexes for stripe_customers
CREATE INDEX idx_stripe_customers_workspace_id ON stripe_customers(workspace_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_stripe_customers_subscription_id ON stripe_customers(stripe_subscription_id);
CREATE INDEX idx_stripe_customers_status ON stripe_customers(subscription_status);

-- Updated_at trigger
CREATE TRIGGER stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Integrations: Workspace isolation
CREATE POLICY "Workspace isolation for integrations" ON integrations
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Enable RLS on billing_events
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Billing events: Workspace isolation (read-only)
CREATE POLICY "Workspace isolation for billing events" ON billing_events
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notification preferences: Users can only manage their own
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Enable RLS on stripe_customers
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Stripe customers: Workspace isolation (read-only for users)
CREATE POLICY "Workspace isolation for stripe customers" ON stripe_customers
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to send integration event
CREATE OR REPLACE FUNCTION send_integration_event(
  p_workspace_id UUID,
  p_integration_type integration_type,
  p_event_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  integration_config JSONB;
  integration_id UUID;
BEGIN
  -- Get active integration
  SELECT id, config INTO integration_id, integration_config
  FROM integrations
  WHERE workspace_id = p_workspace_id
  AND type = p_integration_type
  AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update usage stats
  UPDATE integrations
  SET
    total_events_sent = total_events_sent + 1,
    last_used_at = NOW()
  WHERE id = integration_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to record integration error
CREATE OR REPLACE FUNCTION record_integration_error(
  p_integration_id UUID,
  p_error_message TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE integrations
  SET
    last_error = p_error_message,
    error_count = error_count + 1,
    status = CASE
      WHEN error_count + 1 >= 5 THEN 'error'::integration_status
      ELSE status
    END
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get integration config (redacted for non-owners)
CREATE OR REPLACE FUNCTION get_integration_config(p_integration_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_role_var user_role;
  config_data JSONB;
BEGIN
  -- Get user's role
  SELECT role INTO user_role_var
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  -- Get config
  SELECT config INTO config_data
  FROM integrations
  WHERE id = p_integration_id;

  -- Redact sensitive fields for non-owners
  IF user_role_var NOT IN ('owner', 'admin') THEN
    config_data := jsonb_set(config_data, '{webhook_url}', '"[REDACTED]"'::jsonb);
    config_data := jsonb_set(config_data, '{api_key}', '"[REDACTED]"'::jsonb);
    config_data := jsonb_set(config_data, '{access_token}', '"[REDACTED]"'::jsonb);
  END IF;

  RETURN config_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if workspace has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sub_status TEXT;
BEGIN
  SELECT subscription_status INTO sub_status
  FROM stripe_customers
  WHERE workspace_id = p_workspace_id;

  RETURN sub_status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update workspace plan from Stripe
CREATE OR REPLACE FUNCTION update_workspace_plan(
  p_workspace_id UUID,
  p_new_plan user_plan,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update all users in workspace
  UPDATE users
  SET
    plan = p_new_plan,
    daily_credit_limit = CASE
      WHEN p_new_plan = 'free' THEN 3
      WHEN p_new_plan = 'pro' THEN 1000
      ELSE daily_credit_limit
    END
  WHERE workspace_id = p_workspace_id;

  -- Update Stripe customer record if subscription ID provided
  IF p_stripe_subscription_id IS NOT NULL THEN
    UPDATE stripe_customers
    SET
      stripe_subscription_id = p_stripe_subscription_id,
      subscription_status = 'active'
    WHERE workspace_id = p_workspace_id;
  END IF;

  -- Record billing event
  INSERT INTO billing_events (
    workspace_id,
    event_type,
    new_plan
  ) VALUES (
    p_workspace_id,
    'plan_upgraded'::billing_event_type,
    p_new_plan
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get workspace billing summary
CREATE OR REPLACE FUNCTION get_billing_summary(p_workspace_id UUID)
RETURNS JSONB AS $$
DECLARE
  summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'current_plan', (SELECT plan FROM users WHERE workspace_id = p_workspace_id LIMIT 1),
    'subscription_status', (SELECT subscription_status FROM stripe_customers WHERE workspace_id = p_workspace_id),
    'current_period_end', (SELECT current_period_end FROM stripe_customers WHERE workspace_id = p_workspace_id),
    'total_events', (SELECT COUNT(*) FROM billing_events WHERE workspace_id = p_workspace_id),
    'last_payment', (
      SELECT created_at FROM billing_events
      WHERE workspace_id = p_workspace_id
      AND event_type = 'payment_succeeded'
      ORDER BY created_at DESC
      LIMIT 1
    )
  ) INTO summary;

  RETURN summary;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE integrations IS 'Third-party integrations (Slack, Zapier, webhooks)';
COMMENT ON TABLE billing_events IS 'Audit log of all billing-related events from Stripe';
COMMENT ON TABLE notification_preferences IS 'Per-user notification settings';
COMMENT ON TABLE stripe_customers IS 'Stripe customer and subscription mapping';
COMMENT ON FUNCTION send_integration_event IS 'Queues event to be sent to integration';
COMMENT ON FUNCTION update_workspace_plan IS 'Updates all workspace users to new plan and records event';
COMMENT ON FUNCTION get_billing_summary IS 'Returns workspace billing overview';
-- Add Intent Data and Platform Upload Fields to Leads Table
-- Supports warm/medium/hot scoring and platform uploads

BEGIN;

-- Add intent_data column to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS intent_data JSONB DEFAULT NULL;

COMMENT ON COLUMN leads.intent_data IS 'Intent signals and scoring data from DataShopper';

-- Add platform upload tracking columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS platform_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS platform_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS platform_name TEXT DEFAULT NULL;

COMMENT ON COLUMN leads.platform_uploaded IS 'Whether lead has been uploaded to industry platform';
COMMENT ON COLUMN leads.platform_uploaded_at IS 'When lead was uploaded to platform';
COMMENT ON COLUMN leads.platform_name IS 'Name of the platform (tech-platform, finance-platform, etc.)';

-- Create index on intent_data for fast filtering by score
CREATE INDEX IF NOT EXISTS idx_leads_intent_score
ON leads ((intent_data->>'score'));

COMMENT ON INDEX idx_leads_intent_score IS 'Fast filtering by intent score (hot, warm, cold)';

-- Create index on platform_uploaded for tracking
CREATE INDEX IF NOT EXISTS idx_leads_platform_uploaded
ON leads (platform_uploaded, platform_uploaded_at)
WHERE platform_uploaded = TRUE;

COMMENT ON INDEX idx_leads_platform_uploaded IS 'Fast filtering of platform-uploaded leads';

-- Function: Get leads by intent score
CREATE OR REPLACE FUNCTION get_leads_by_intent_score(
  p_workspace_id UUID,
  p_score TEXT
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  domain TEXT,
  intent_score TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    (l.company_data->>'name')::TEXT as company_name,
    (l.company_data->>'domain')::TEXT as domain,
    (l.intent_data->>'score')::TEXT as intent_score,
    l.created_at
  FROM leads l
  WHERE l.workspace_id = p_workspace_id
    AND l.intent_data->>'score' = p_score
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_leads_by_intent_score IS 'Get leads filtered by intent score (hot, warm, cold)';

-- Function: Get platform upload stats
CREATE OR REPLACE FUNCTION get_platform_upload_stats(
  p_workspace_id UUID
)
RETURNS TABLE (
  platform_name TEXT,
  hot_leads INTEGER,
  warm_leads INTEGER,
  total_leads INTEGER,
  last_upload TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.platform_name,
    COUNT(*) FILTER (WHERE l.intent_data->>'score' = 'hot')::INTEGER as hot_leads,
    COUNT(*) FILTER (WHERE l.intent_data->>'score' = 'warm')::INTEGER as warm_leads,
    COUNT(*)::INTEGER as total_leads,
    MAX(l.platform_uploaded_at) as last_upload
  FROM leads l
  WHERE l.workspace_id = p_workspace_id
    AND l.platform_uploaded = TRUE
  GROUP BY l.platform_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_platform_upload_stats IS 'Get statistics on platform uploads by workspace';

-- Function: Get leads ready for platform upload
CREATE OR REPLACE FUNCTION get_leads_ready_for_upload(
  p_workspace_id UUID,
  p_min_score TEXT DEFAULT 'warm'
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  domain TEXT,
  industry TEXT,
  intent_score TEXT,
  enriched_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    (l.company_data->>'name')::TEXT as company_name,
    (l.company_data->>'domain')::TEXT as domain,
    (l.company_data->>'industry')::TEXT as industry,
    (l.intent_data->>'score')::TEXT as intent_score,
    l.enriched_at
  FROM leads l
  WHERE l.workspace_id = p_workspace_id
    AND l.enrichment_status = 'completed'
    AND l.platform_uploaded = FALSE
    AND (
      (p_min_score = 'warm' AND l.intent_data->>'score' IN ('warm', 'hot'))
      OR (p_min_score = 'hot' AND l.intent_data->>'score' = 'hot')
    )
  ORDER BY
    CASE l.intent_data->>'score'
      WHEN 'hot' THEN 1
      WHEN 'warm' THEN 2
      ELSE 3
    END,
    l.enriched_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_leads_ready_for_upload IS 'Get enriched leads ready for platform upload';

-- Create view for intent score breakdown
CREATE OR REPLACE VIEW lead_intent_breakdown AS
SELECT
  l.workspace_id,
  COUNT(*) FILTER (WHERE l.intent_data->>'score' = 'hot')::INTEGER as hot_count,
  COUNT(*) FILTER (WHERE l.intent_data->>'score' = 'warm')::INTEGER as warm_count,
  COUNT(*) FILTER (WHERE l.intent_data->>'score' = 'cold')::INTEGER as cold_count,
  COUNT(*)::INTEGER as total_count,
  ROUND(
    COUNT(*) FILTER (WHERE l.intent_data->>'score' = 'hot')::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    1
  ) as hot_percentage,
  ROUND(
    COUNT(*) FILTER (WHERE l.intent_data->>'score' = 'warm')::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    1
  ) as warm_percentage
FROM leads l
WHERE l.intent_data IS NOT NULL
GROUP BY l.workspace_id;

COMMENT ON VIEW lead_intent_breakdown IS 'Breakdown of leads by intent score per workspace';

COMMIT;
-- Migration: Add Billing Fields
-- Description: Add Stripe subscription fields to users table and create billing_events table

-- Add Stripe subscription fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- Update billing_events table with more fields
ALTER TABLE billing_events
ADD COLUMN IF NOT EXISTS stripe_event_id TEXT,
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for billing event lookups
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event_id ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_workspace_created ON billing_events(workspace_id, created_at DESC);

-- Add unique constraint to prevent duplicate webhook processing
ALTER TABLE billing_events
ADD CONSTRAINT unique_stripe_event_id UNIQUE (stripe_event_id);

-- Function: Get user's current plan limits
CREATE OR REPLACE FUNCTION get_user_plan_limits(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_limits JSONB;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan
  FROM users
  WHERE id = p_user_id;

  -- Return plan limits
  IF v_plan = 'pro' THEN
    v_limits := jsonb_build_object(
      'daily_credits', 1000,
      'max_queries', 5,
      'max_saved_searches', 50,
      'export_limit', 10000
    );
  ELSE
    v_limits := jsonb_build_object(
      'daily_credits', 3,
      'max_queries', 1,
      'max_saved_searches', 5,
      'export_limit', 100
    );
  END IF;

  RETURN v_limits;
END;
$$;

-- Function: Check if user can create query (respects plan limits)
CREATE OR REPLACE FUNCTION can_create_query(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id UUID;
  v_plan TEXT;
  v_query_count INTEGER;
  v_max_queries INTEGER;
BEGIN
  -- Get user's workspace and plan
  SELECT workspace_id, plan INTO v_workspace_id, v_plan
  FROM users
  WHERE id = p_user_id;

  -- Count active queries for workspace
  SELECT COUNT(*) INTO v_query_count
  FROM queries
  WHERE workspace_id = v_workspace_id
    AND status = 'active';

  -- Get max queries for plan
  IF v_plan = 'pro' THEN
    v_max_queries := 5;
  ELSE
    v_max_queries := 1;
  END IF;

  -- Return true if under limit
  RETURN v_query_count < v_max_queries;
END;
$$;

-- Function: Check if user can create saved search (respects plan limits)
CREATE OR REPLACE FUNCTION can_create_saved_search(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id UUID;
  v_plan TEXT;
  v_search_count INTEGER;
  v_max_searches INTEGER;
BEGIN
  -- Get user's workspace and plan
  SELECT workspace_id, plan INTO v_workspace_id, v_plan
  FROM users
  WHERE id = p_user_id;

  -- Count saved searches for workspace
  SELECT COUNT(*) INTO v_search_count
  FROM saved_searches
  WHERE workspace_id = v_workspace_id;

  -- Get max saved searches for plan
  IF v_plan = 'pro' THEN
    v_max_searches := 50;
  ELSE
    v_max_searches := 5;
  END IF;

  -- Return true if under limit
  RETURN v_search_count < v_max_searches;
END;
$$;

-- Function: Get billing summary for workspace
CREATE OR REPLACE FUNCTION get_billing_summary(p_workspace_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_summary JSONB;
  v_total_spent INTEGER;
  v_event_count INTEGER;
  v_last_payment TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate total amount spent
  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO v_total_spent, v_event_count
  FROM billing_events
  WHERE workspace_id = p_workspace_id
    AND event_type IN ('payment_succeeded');

  -- Get last payment date
  SELECT MAX(created_at) INTO v_last_payment
  FROM billing_events
  WHERE workspace_id = p_workspace_id
    AND event_type = 'payment_succeeded';

  -- Build summary
  v_summary := jsonb_build_object(
    'total_spent', v_total_spent,
    'payment_count', v_event_count,
    'last_payment', v_last_payment
  );

  RETURN v_summary;
END;
$$;

-- View: Active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  u.id AS user_id,
  u.email,
  u.workspace_id,
  u.plan,
  u.stripe_customer_id,
  u.stripe_subscription_id,
  u.subscription_status,
  u.subscription_period_start,
  u.subscription_period_end,
  u.cancel_at_period_end,
  w.name AS workspace_name
FROM users u
JOIN workspaces w ON u.workspace_id = w.id
WHERE u.stripe_subscription_id IS NOT NULL
  AND u.subscription_status IN ('active', 'trialing');

-- View: Recent billing events
CREATE OR REPLACE VIEW recent_billing_events AS
SELECT
  be.id,
  be.workspace_id,
  be.event_type,
  be.stripe_event_id,
  be.amount,
  be.currency,
  be.metadata,
  be.created_at,
  w.name AS workspace_name
FROM billing_events be
JOIN workspaces w ON be.workspace_id = w.id
ORDER BY be.created_at DESC
LIMIT 100;

-- Grant permissions
GRANT SELECT ON active_subscriptions TO authenticated;
GRANT SELECT ON recent_billing_events TO authenticated;

-- Comments
COMMENT ON FUNCTION get_user_plan_limits IS 'Get plan limits for a user based on their subscription';
COMMENT ON FUNCTION can_create_query IS 'Check if user can create another query based on plan limits';
COMMENT ON FUNCTION can_create_saved_search IS 'Check if user can create another saved search based on plan limits';
COMMENT ON FUNCTION get_billing_summary IS 'Get billing summary for a workspace';
COMMENT ON VIEW active_subscriptions IS 'View of all active subscriptions';
COMMENT ON VIEW recent_billing_events IS 'View of recent billing events';
-- Migration: Add Lead Routing System
-- This migration adds industry and geographic routing capabilities for multi-tenant white-label platforms

-- Add routing configuration to workspaces
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS routing_config JSONB DEFAULT '{
  "enabled": true,
  "industry_filter": [],
  "geographic_filter": {
    "countries": [],
    "states": [],
    "regions": []
  },
  "lead_assignment_method": "round_robin"
}'::jsonb,
ADD COLUMN IF NOT EXISTS is_white_label BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS allowed_industries TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS allowed_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS webhook_endpoints JSONB DEFAULT '{
  "datashopper": null,
  "clay": null,
  "audience_labs": null
}'::jsonb;

-- Create lead routing rules table
CREATE TABLE IF NOT EXISTS lead_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{
    "industries": [],
    "company_sizes": [],
    "revenue_ranges": [],
    "countries": [],
    "us_states": [],
    "regions": []
  }'::jsonb,
  destination_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  actions JSONB NOT NULL DEFAULT '{
    "assign_to_workspace": true,
    "notify_via": ["email"],
    "tag_with": []
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bulk upload jobs table
CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL, -- 'csv', 'datashopper', 'audience_labs', 'clay'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  file_url TEXT,
  raw_data JSONB,
  error_log JSONB,
  routing_summary JSONB DEFAULT '{
    "routed_workspaces": {},
    "unrouted_count": 0
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add routing metadata to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'query', 'csv', 'datashopper', 'audience_labs', 'clay'
ADD COLUMN IF NOT EXISTS routing_rule_id UUID REFERENCES lead_routing_rules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS routing_metadata JSONB DEFAULT '{
  "matched_rules": [],
  "routing_timestamp": null,
  "original_workspace_id": null
}'::jsonb,
ADD COLUMN IF NOT EXISTS bulk_upload_job_id UUID REFERENCES bulk_upload_jobs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS external_ids JSONB DEFAULT '{
  "datashopper_id": null,
  "clay_id": null,
  "audience_labs_id": null
}'::jsonb;

-- Create indexes for efficient routing lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_industry_vertical ON workspaces(industry_vertical);
CREATE INDEX IF NOT EXISTS idx_workspaces_allowed_industries ON workspaces USING GIN(allowed_industries);
CREATE INDEX IF NOT EXISTS idx_workspaces_allowed_regions ON workspaces USING GIN(allowed_regions);
CREATE INDEX IF NOT EXISTS idx_workspaces_parent ON workspaces(parent_workspace_id) WHERE parent_workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routing_rules_workspace ON lead_routing_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON lead_routing_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON lead_routing_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_routing_rules_conditions ON lead_routing_rules USING GIN(conditions);

CREATE INDEX IF NOT EXISTS idx_bulk_upload_workspace ON bulk_upload_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_status ON bulk_upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_source ON bulk_upload_jobs(source);

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_routing_rule ON leads(routing_rule_id);
CREATE INDEX IF NOT EXISTS idx_leads_bulk_job ON leads(bulk_upload_job_id);
CREATE INDEX IF NOT EXISTS idx_leads_external_ids ON leads USING GIN(external_ids);
CREATE INDEX IF NOT EXISTS idx_leads_company_industry ON leads(company_industry);
CREATE INDEX IF NOT EXISTS idx_leads_company_location ON leads(company_location);

-- Enable RLS on new tables
ALTER TABLE lead_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_upload_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_routing_rules
CREATE POLICY "Workspace isolation" ON lead_routing_rules
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- RLS Policies for bulk_upload_jobs
CREATE POLICY "Workspace isolation" ON bulk_upload_jobs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Create function to match lead against routing rules
CREATE OR REPLACE FUNCTION match_routing_rule(
  p_industry TEXT,
  p_company_size TEXT,
  p_revenue_range TEXT,
  p_country TEXT,
  p_state TEXT,
  p_workspace_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_rule_id UUID;
BEGIN
  -- Find first matching rule by priority
  SELECT id INTO v_rule_id
  FROM lead_routing_rules
  WHERE workspace_id = p_workspace_id
    AND is_active = true
    AND (
      (conditions->'industries' = '[]'::jsonb OR conditions->'industries' @> to_jsonb(p_industry))
      OR (conditions->'company_sizes' = '[]'::jsonb OR conditions->'company_sizes' @> to_jsonb(p_company_size))
      OR (conditions->'revenue_ranges' = '[]'::jsonb OR conditions->'revenue_ranges' @> to_jsonb(p_revenue_range))
      OR (conditions->'countries' = '[]'::jsonb OR conditions->'countries' @> to_jsonb(p_country))
      OR (conditions->'us_states' = '[]'::jsonb OR conditions->'us_states' @> to_jsonb(p_state))
    )
  ORDER BY priority DESC
  LIMIT 1;

  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to route lead to correct workspace
CREATE OR REPLACE FUNCTION route_lead_to_workspace(
  p_lead_id UUID,
  p_source_workspace_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_lead RECORD;
  v_rule RECORD;
  v_destination_workspace_id UUID;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found: %', p_lead_id;
  END IF;

  -- Find matching routing rule
  SELECT * INTO v_rule
  FROM lead_routing_rules
  WHERE workspace_id = p_source_workspace_id
    AND is_active = true
    AND (
      (conditions->'industries' = '[]'::jsonb OR conditions->'industries' @> to_jsonb(v_lead.company_industry))
      OR (conditions->'company_sizes' = '[]'::jsonb OR conditions->'company_sizes' @> to_jsonb(v_lead.company_size))
      OR (conditions->'countries' = '[]'::jsonb OR conditions->'countries' @> to_jsonb(COALESCE(v_lead.company_location->>'country', 'US')))
      OR (conditions->'us_states' = '[]'::jsonb OR conditions->'us_states' @> to_jsonb(v_lead.company_location->>'state'))
    )
  ORDER BY priority DESC
  LIMIT 1;

  -- Determine destination workspace
  IF FOUND AND v_rule.destination_workspace_id IS NOT NULL THEN
    v_destination_workspace_id := v_rule.destination_workspace_id;

    -- Update lead with routing info
    UPDATE leads
    SET
      workspace_id = v_destination_workspace_id,
      routing_rule_id = v_rule.id,
      routing_metadata = jsonb_set(
        routing_metadata,
        '{matched_rules}',
        routing_metadata->'matched_rules' || to_jsonb(v_rule.id)
      ),
      routing_metadata = jsonb_set(
        routing_metadata,
        '{routing_timestamp}',
        to_jsonb(NOW())
      ),
      routing_metadata = jsonb_set(
        routing_metadata,
        '{original_workspace_id}',
        to_jsonb(p_source_workspace_id)
      )
    WHERE id = p_lead_id;
  ELSE
    -- No matching rule, keep in source workspace
    v_destination_workspace_id := p_source_workspace_id;
  END IF;

  RETURN v_destination_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- Update triggers for updated_at
CREATE TRIGGER update_routing_rules_updated_at
  BEFORE UPDATE ON lead_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_upload_jobs_updated_at
  BEFORE UPDATE ON bulk_upload_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default routing rules for common verticals
INSERT INTO lead_routing_rules (workspace_id, rule_name, priority, conditions, actions)
SELECT
  id as workspace_id,
  'Default ' || industry_vertical || ' Rule' as rule_name,
  10 as priority,
  jsonb_build_object(
    'industries', ARRAY[industry_vertical]
  ) as conditions,
  jsonb_build_object(
    'assign_to_workspace', true,
    'notify_via', ARRAY['email'],
    'tag_with', ARRAY[industry_vertical]
  ) as actions
FROM workspaces
WHERE industry_vertical IS NOT NULL
ON CONFLICT DO NOTHING;

COMMENT ON TABLE lead_routing_rules IS 'Defines rules for routing leads to different workspaces based on industry, geography, and other criteria';
COMMENT ON TABLE bulk_upload_jobs IS 'Tracks bulk lead upload jobs from CSV, DataShopper, Audience Labs, and Clay';
COMMENT ON FUNCTION match_routing_rule IS 'Finds the highest priority routing rule that matches a lead based on its attributes';
COMMENT ON FUNCTION route_lead_to_workspace IS 'Routes a lead to the correct workspace based on routing rules and updates metadata';
