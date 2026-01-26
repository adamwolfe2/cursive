-- ============================================================================
-- LeadMe Platform - Complete Database Setup
-- Run this in Supabase SQL Editor (supabase.com -> Your Project -> SQL Editor)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: CORE TABLES (Workspaces & Users)
-- ============================================================================

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry_vertical TEXT,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  branding JSONB DEFAULT '{"logo_url": null, "primary_color": "#3b82f6", "secondary_color": "#1e40af"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_subdomain ON workspaces(subdomain);

-- Updated_at trigger function
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

-- User plan and role enums
DO $$ BEGIN
  CREATE TYPE user_plan AS ENUM ('free', 'pro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  plan user_plan NOT NULL DEFAULT 'free',
  daily_credits_used INTEGER NOT NULL DEFAULT 0,
  daily_credit_limit INTEGER NOT NULL DEFAULT 3,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Referral code generator
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_val BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists_val;
    EXIT WHEN NOT exists_val;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_referral_code ON users;
CREATE TRIGGER users_set_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- ============================================================================
-- PART 2: GLOBAL TOPICS & TRENDS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE topic_category AS ENUM ('technology', 'marketing', 'sales', 'finance', 'operations', 'hr', 'legal', 'product', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trend_direction AS ENUM ('up', 'down', 'stable');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS global_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL UNIQUE,
  category topic_category NOT NULL DEFAULT 'other',
  topic_tsv TSVECTOR,
  current_volume INTEGER NOT NULL DEFAULT 0,
  trend_direction trend_direction NOT NULL DEFAULT 'stable',
  change_percent NUMERIC(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_topics_topic_tsv ON global_topics USING GIN(topic_tsv);
CREATE INDEX IF NOT EXISTS idx_global_topics_category ON global_topics(category);
CREATE INDEX IF NOT EXISTS idx_global_topics_volume ON global_topics(current_volume DESC);

CREATE OR REPLACE FUNCTION global_topics_tsvector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.topic_tsv := to_tsvector('english', NEW.topic);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS global_topics_tsvector_trigger ON global_topics;
CREATE TRIGGER global_topics_tsvector_trigger
  BEFORE INSERT OR UPDATE OF topic ON global_topics
  FOR EACH ROW
  EXECUTE FUNCTION global_topics_tsvector_update();

CREATE TRIGGER global_topics_updated_at
  BEFORE UPDATE ON global_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trends table
CREATE TABLE IF NOT EXISTS trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES global_topics(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  volume INTEGER NOT NULL DEFAULT 0,
  change_percent NUMERIC(5,2) DEFAULT 0.00,
  rank_overall INTEGER,
  rank_category INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_topic_week UNIQUE(topic_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_trends_topic_id ON trends(topic_id);
CREATE INDEX IF NOT EXISTS idx_trends_week_start ON trends(week_start DESC);

-- ============================================================================
-- PART 3: QUERY SYSTEM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE query_status AS ENUM ('active', 'paused', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES global_topics(id) ON DELETE RESTRICT,
  name TEXT,
  filters JSONB NOT NULL DEFAULT '{"location": null, "company_size": null, "industry": null}'::jsonb,
  status query_status NOT NULL DEFAULT 'active',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  total_leads_generated INTEGER NOT NULL DEFAULT 0,
  leads_this_week INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_queries_workspace_id ON queries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_queries_topic_id ON queries(topic_id);
CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);

CREATE TRIGGER queries_updated_at
  BEFORE UPDATE ON queries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 4: LEADS SYSTEM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE enrichment_status AS ENUM ('pending', 'enriching', 'enriched', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM ('pending', 'delivered', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  query_id UUID REFERENCES queries(id) ON DELETE SET NULL,
  company_name TEXT,
  company_domain TEXT,
  company_industry TEXT,
  company_size TEXT,
  company_location JSONB DEFAULT '{"city": null, "state": null, "country": "US"}'::jsonb,
  company_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_data JSONB DEFAULT '{"contacts": [], "total_contacts": 0}'::jsonb,
  enrichment_status enrichment_status NOT NULL DEFAULT 'pending',
  delivery_status delivery_status NOT NULL DEFAULT 'pending',
  source VARCHAR(50) DEFAULT 'manual',
  routing_rule_id UUID,
  routing_metadata JSONB DEFAULT '{"matched_rules": [], "routing_timestamp": null}'::jsonb,
  bulk_upload_job_id UUID,
  external_ids JSONB DEFAULT '{"datashopper_id": null, "clay_id": null, "audience_labs_id": null}'::jsonb,
  enrichment_attempts INTEGER NOT NULL DEFAULT 0,
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enriched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_query_id ON leads(query_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_status ON leads(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_company_industry ON leads(company_industry);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- ============================================================================
-- PART 5: LEAD ROUTING SYSTEM
-- ============================================================================

-- Add routing fields to workspaces
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS routing_config JSONB DEFAULT '{"enabled": true, "lead_assignment_method": "round_robin"}'::jsonb,
ADD COLUMN IF NOT EXISTS is_white_label BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS allowed_industries TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS allowed_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS webhook_endpoints JSONB DEFAULT '{"datashopper": null, "clay": null, "audience_labs": null}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_workspaces_allowed_industries ON workspaces USING GIN(allowed_industries);
CREATE INDEX IF NOT EXISTS idx_workspaces_allowed_regions ON workspaces USING GIN(allowed_regions);

-- Lead routing rules table
CREATE TABLE IF NOT EXISTS lead_routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{"industries": [], "company_sizes": [], "countries": [], "us_states": []}'::jsonb,
  destination_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  actions JSONB NOT NULL DEFAULT '{"assign_to_workspace": true, "notify_via": ["email"], "tag_with": []}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_workspace ON lead_routing_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON lead_routing_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON lead_routing_rules(is_active) WHERE is_active = true;

ALTER TABLE leads ADD CONSTRAINT fk_leads_routing_rule
  FOREIGN KEY (routing_rule_id) REFERENCES lead_routing_rules(id) ON DELETE SET NULL;

CREATE TRIGGER update_routing_rules_updated_at
  BEFORE UPDATE ON lead_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Bulk upload jobs table
CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  file_url TEXT,
  raw_data JSONB,
  error_log JSONB,
  routing_summary JSONB DEFAULT '{"routed_workspaces": {}, "unrouted_count": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bulk_upload_workspace ON bulk_upload_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_status ON bulk_upload_jobs(status);

ALTER TABLE leads ADD CONSTRAINT fk_leads_bulk_job
  FOREIGN KEY (bulk_upload_job_id) REFERENCES bulk_upload_jobs(id) ON DELETE SET NULL;

CREATE TRIGGER update_bulk_upload_jobs_updated_at
  BEFORE UPDATE ON bulk_upload_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 6: CREDIT USAGE
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE credit_action AS ENUM ('email_reveal', 'lead_export', 'people_search', 'contact_enrichment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type credit_action NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  reference_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_workspace_id ON credit_usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON credit_usage(created_at DESC);

-- ============================================================================
-- PART 7: PEOPLE SEARCH
-- ============================================================================

CREATE TABLE IF NOT EXISTS people_search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_data JSONB NOT NULL DEFAULT '{"full_name": null, "title": null, "company": null, "email": null, "email_revealed": false}'::jsonb,
  search_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_revealed_at TIMESTAMPTZ,
  email_revealed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_people_search_workspace_id ON people_search_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_people_search_created_at ON people_search_results(created_at DESC);

-- ============================================================================
-- PART 8: INTEGRATIONS & BILLING
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE integration_type AS ENUM ('slack', 'zapier', 'webhook', 'email');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type integration_type NOT NULL,
  name TEXT NOT NULL,
  status integration_status NOT NULL DEFAULT 'active',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_used_at TIMESTAMPTZ,
  total_events_sent INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_integrations_workspace_id ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN
  CREATE TYPE billing_event_type AS ENUM ('subscription_created', 'subscription_updated', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'plan_upgraded', 'plan_downgraded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type billing_event_type NOT NULL,
  stripe_event_id TEXT UNIQUE,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  old_plan user_plan,
  new_plan user_plan,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_workspace_id ON billing_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_new_leads BOOLEAN NOT NULL DEFAULT true,
  email_daily_digest BOOLEAN NOT NULL DEFAULT true,
  email_weekly_report BOOLEAN NOT NULL DEFAULT true,
  email_credit_low BOOLEAN NOT NULL DEFAULT true,
  email_billing_updates BOOLEAN NOT NULL DEFAULT true,
  inapp_new_leads BOOLEAN NOT NULL DEFAULT true,
  inapp_system_updates BOOLEAN NOT NULL DEFAULT true,
  slack_new_leads BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  default_payment_method TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_workspace_id ON stripe_customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

CREATE TRIGGER stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 9: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Workspaces policies
DROP POLICY IF EXISTS "Users can view their own workspace" ON workspaces;
CREATE POLICY "Users can view their own workspace" ON workspaces
  FOR SELECT USING (id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can update workspace" ON workspaces;
CREATE POLICY "Owners can update workspace" ON workspaces
  FOR UPDATE USING (id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid() AND role = 'owner'));

-- Users policies
DROP POLICY IF EXISTS "Users can view workspace members" ON users;
CREATE POLICY "Users can view workspace members" ON users
  FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Global topics (public read)
DROP POLICY IF EXISTS "Global topics are viewable by authenticated users" ON global_topics;
CREATE POLICY "Global topics are viewable by authenticated users" ON global_topics
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service role can modify global topics" ON global_topics;
CREATE POLICY "Service role can modify global topics" ON global_topics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trends (public read)
DROP POLICY IF EXISTS "Trends are viewable by authenticated users" ON trends;
CREATE POLICY "Trends are viewable by authenticated users" ON trends
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Workspace isolation for all other tables
DROP POLICY IF EXISTS "Workspace isolation for queries" ON queries;
CREATE POLICY "Workspace isolation for queries" ON queries
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace isolation for leads" ON leads;
CREATE POLICY "Workspace isolation for leads" ON leads
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace isolation for routing rules" ON lead_routing_rules;
CREATE POLICY "Workspace isolation for routing rules" ON lead_routing_rules
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace isolation for bulk uploads" ON bulk_upload_jobs;
CREATE POLICY "Workspace isolation for bulk uploads" ON bulk_upload_jobs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace isolation for credit usage" ON credit_usage;
CREATE POLICY "Workspace isolation for credit usage" ON credit_usage
  FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace isolation for people search" ON people_search_results;
CREATE POLICY "Workspace isolation for people search" ON people_search_results
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace isolation for integrations" ON integrations;
CREATE POLICY "Workspace isolation for integrations" ON integrations
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace isolation for billing events" ON billing_events;
CREATE POLICY "Workspace isolation for billing events" ON billing_events
  FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace isolation for stripe customers" ON stripe_customers;
CREATE POLICY "Workspace isolation for stripe customers" ON stripe_customers
  FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================================================
-- PART 10: HELPER FUNCTIONS
-- ============================================================================

-- Get current user's workspace
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Reset daily credits (run via cron)
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
  UPDATE users SET daily_credits_used = 0;
$$ LANGUAGE sql;

-- Check credits available
CREATE OR REPLACE FUNCTION check_credits_available(p_user_id UUID, p_credits_needed INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  user_rec RECORD;
BEGIN
  SELECT daily_credits_used, daily_credit_limit INTO user_rec FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  RETURN (user_rec.daily_credits_used + p_credits_needed) <= user_rec.daily_credit_limit;
END;
$$ LANGUAGE plpgsql;

-- Record credit usage
CREATE OR REPLACE FUNCTION record_credit_usage(
  p_workspace_id UUID, p_user_id UUID, p_action_type credit_action,
  p_credits_used INTEGER DEFAULT 1, p_reference_id UUID DEFAULT NULL, p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  INSERT INTO credit_usage (workspace_id, user_id, action_type, credits_used, reference_id, metadata)
  VALUES (p_workspace_id, p_user_id, p_action_type, p_credits_used, p_reference_id, p_metadata)
  RETURNING id INTO usage_id;
  UPDATE users SET daily_credits_used = daily_credits_used + p_credits_used WHERE id = p_user_id;
  RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- Route lead to workspace
CREATE OR REPLACE FUNCTION route_lead_to_workspace(p_lead_id UUID, p_source_workspace_id UUID)
RETURNS UUID AS $$
DECLARE
  v_lead RECORD;
  v_rule RECORD;
  v_destination_workspace_id UUID;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found: %', p_lead_id; END IF;

  SELECT * INTO v_rule FROM lead_routing_rules
  WHERE workspace_id = p_source_workspace_id AND is_active = true
  AND (
    (conditions->'industries' = '[]'::jsonb OR conditions->'industries' @> to_jsonb(v_lead.company_industry))
    OR (conditions->'us_states' = '[]'::jsonb OR conditions->'us_states' @> to_jsonb(v_lead.company_location->>'state'))
  )
  ORDER BY priority DESC LIMIT 1;

  IF FOUND AND v_rule.destination_workspace_id IS NOT NULL THEN
    v_destination_workspace_id := v_rule.destination_workspace_id;
    UPDATE leads SET workspace_id = v_destination_workspace_id, routing_rule_id = v_rule.id,
      routing_metadata = jsonb_build_object('matched_rules', ARRAY[v_rule.id], 'routing_timestamp', NOW(), 'original_workspace_id', p_source_workspace_id)
    WHERE id = p_lead_id;
  ELSE
    v_destination_workspace_id := p_source_workspace_id;
  END IF;
  RETURN v_destination_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 11: SEED DATA
-- ============================================================================

-- Seed global topics (B2B lead categories)
INSERT INTO global_topics (topic, category, current_volume, trend_direction) VALUES
  ('HVAC Services', 'other', 15420, 'up'),
  ('Roofing Contractors', 'other', 12350, 'up'),
  ('Plumbing Services', 'other', 18900, 'stable'),
  ('Electrical Contractors', 'other', 11200, 'up'),
  ('Solar Installation', 'technology', 25600, 'up'),
  ('Real Estate Agents', 'sales', 32100, 'stable'),
  ('Insurance Agents', 'finance', 28400, 'stable'),
  ('Home Services', 'other', 45200, 'up'),
  ('Landscaping Services', 'other', 8900, 'up'),
  ('Pest Control', 'other', 6700, 'stable'),
  ('Cleaning Services', 'other', 14300, 'up'),
  ('Auto Repair', 'other', 19800, 'stable'),
  ('Legal Services', 'legal', 22100, 'stable'),
  ('Financial Advisors', 'finance', 17600, 'up'),
  ('Healthcare Providers', 'other', 31200, 'up'),
  ('Window Installation', 'other', 7800, 'up'),
  ('Garage Door Services', 'other', 5400, 'stable'),
  ('Pool Services', 'other', 4200, 'up'),
  ('Moving Services', 'other', 9100, 'stable'),
  ('Painting Contractors', 'other', 8300, 'up')
ON CONFLICT (topic) DO NOTHING;

-- Seed admin workspace (your master workspace)
INSERT INTO workspaces (id, slug, name, industry_vertical, allowed_industries, allowed_regions) VALUES
  ('00000000-0000-0000-0000-000000000001', 'leadme-admin', 'LeadMe Admin', 'Platform Admin',
   ARRAY['HVAC', 'Roofing', 'Plumbing', 'Electrical', 'Solar', 'Real Estate', 'Insurance', 'Home Services', 'Landscaping', 'Pest Control', 'Cleaning Services', 'Auto Services', 'Legal Services', 'Financial Services', 'Healthcare'],
   ARRAY['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'])
ON CONFLICT (slug) DO NOTHING;

-- Seed sample business owner workspaces
INSERT INTO workspaces (id, slug, name, industry_vertical, allowed_industries, allowed_regions) VALUES
  ('00000000-0000-0000-0000-000000000002', 'acme-hvac', 'Acme HVAC Solutions', 'HVAC', ARRAY['HVAC'], ARRAY['TX', 'OK', 'LA']),
  ('00000000-0000-0000-0000-000000000003', 'johnson-roofing', 'Johnson Roofing Co', 'Roofing', ARRAY['Roofing'], ARRAY['FL', 'GA', 'SC']),
  ('00000000-0000-0000-0000-000000000004', 'sunshine-solar', 'Sunshine Solar Inc', 'Solar', ARRAY['Solar'], ARRAY['CA', 'AZ', 'NV']),
  ('00000000-0000-0000-0000-000000000005', 'reliable-plumbing', 'Reliable Plumbing', 'Plumbing', ARRAY['Plumbing'], ARRAY['NY', 'NJ', 'CT'])
ON CONFLICT (slug) DO NOTHING;

-- Seed routing rules for admin workspace
INSERT INTO lead_routing_rules (workspace_id, rule_name, priority, conditions, destination_workspace_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Route HVAC to Acme', 100,
   '{"industries": ["HVAC"], "us_states": ["TX", "OK", "LA"]}', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', 'Route Roofing to Johnson', 100,
   '{"industries": ["Roofing"], "us_states": ["FL", "GA", "SC"]}', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000001', 'Route Solar to Sunshine', 100,
   '{"industries": ["Solar"], "us_states": ["CA", "AZ", "NV"]}', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000001', 'Route Plumbing to Reliable', 100,
   '{"industries": ["Plumbing"], "us_states": ["NY", "NJ", "CT"]}', '00000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- Seed sample leads (these would be uploaded by admin)
INSERT INTO leads (workspace_id, company_name, company_domain, company_industry, company_size, company_location, source, company_data) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Cool Air Systems', 'coolairsystems.com', 'HVAC', '11-50', '{"city": "Houston", "state": "TX", "country": "US"}', 'csv', '{"revenue": "$1M-$5M", "founded": 2015}'),
  ('00000000-0000-0000-0000-000000000001', 'Texas Comfort HVAC', 'texascomforthvac.com', 'HVAC', '1-10', '{"city": "Dallas", "state": "TX", "country": "US"}', 'csv', '{"revenue": "$500K-$1M", "founded": 2018}'),
  ('00000000-0000-0000-0000-000000000001', 'Miami Roof Pros', 'miamiiroofpros.com', 'Roofing', '11-50', '{"city": "Miami", "state": "FL", "country": "US"}', 'csv', '{"revenue": "$2M-$5M", "founded": 2010}'),
  ('00000000-0000-0000-0000-000000000001', 'Atlanta Roofing Masters', 'atlantaroofingmasters.com', 'Roofing', '11-50', '{"city": "Atlanta", "state": "GA", "country": "US"}', 'csv', '{"revenue": "$1M-$2M", "founded": 2012}'),
  ('00000000-0000-0000-0000-000000000001', 'SoCal Solar Solutions', 'socalsolar.com', 'Solar', '51-100', '{"city": "Los Angeles", "state": "CA", "country": "US"}', 'datashopper', '{"revenue": "$5M-$10M", "founded": 2008}'),
  ('00000000-0000-0000-0000-000000000001', 'Phoenix Sun Power', 'phoenixsunpower.com', 'Solar', '11-50', '{"city": "Phoenix", "state": "AZ", "country": "US"}', 'datashopper', '{"revenue": "$2M-$5M", "founded": 2014}'),
  ('00000000-0000-0000-0000-000000000001', 'NYC Plumbing Experts', 'nycplumbingexperts.com', 'Plumbing', '11-50', '{"city": "New York", "state": "NY", "country": "US"}', 'csv', '{"revenue": "$1M-$2M", "founded": 2016}'),
  ('00000000-0000-0000-0000-000000000001', 'Jersey Shore Plumbing', 'jerseyshooreplumbing.com', 'Plumbing', '1-10', '{"city": "Newark", "state": "NJ", "country": "US"}', 'csv', '{"revenue": "$500K-$1M", "founded": 2019}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE! Your database is ready.
--
-- Next steps:
-- 1. Set up Supabase Auth (email/password or OAuth)
-- 2. Add environment variables to Vercel:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY
-- 3. Create your admin user through the signup flow
-- 4. Link your user to the admin workspace:
--    UPDATE users SET workspace_id = '00000000-0000-0000-0000-000000000001'
--    WHERE email = 'your@email.com';
-- ============================================================================

SELECT 'Setup complete! Tables created: ' ||
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public')::text ||
  ' | Topics seeded: ' || (SELECT count(*) FROM global_topics)::text ||
  ' | Workspaces seeded: ' || (SELECT count(*) FROM workspaces)::text ||
  ' | Sample leads: ' || (SELECT count(*) FROM leads)::text;
