-- =============================================
-- LeadMe Quick Database Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. WORKSPACES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  industry_vertical TEXT,
  allowed_industries TEXT[] DEFAULT '{}',
  allowed_regions TEXT[] DEFAULT '{}',
  routing_config JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  credits_used INTEGER DEFAULT 0,
  daily_credit_limit INTEGER DEFAULT 3,
  last_credit_reset TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_name TEXT,
  company_domain TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_title TEXT,
  industry TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'US',
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  intent_score INTEGER DEFAULT 0,
  enrichment_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE RLS
-- =============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 6. DROP EXISTING POLICIES (to avoid conflicts)
-- =============================================
DROP POLICY IF EXISTS "Users can view own workspace" ON workspaces;
DROP POLICY IF EXISTS "Users can update own workspace" ON workspaces;
DROP POLICY IF EXISTS "Users can insert workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view workspace leads" ON leads;
DROP POLICY IF EXISTS "Users can insert workspace leads" ON leads;
DROP POLICY IF EXISTS "Users can update workspace leads" ON leads;
DROP POLICY IF EXISTS "Users can delete workspace leads" ON leads;

-- 7. WORKSPACE POLICIES
-- =============================================
CREATE POLICY "Users can view own workspace" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own workspace" ON workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Allow anyone authenticated to create a workspace (for onboarding)
CREATE POLICY "Users can insert workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. USER POLICIES
-- =============================================
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Allow anyone authenticated to create their user profile (for onboarding)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- 9. LEAD POLICIES
-- =============================================
CREATE POLICY "Users can view workspace leads" ON leads
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert workspace leads" ON leads
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update workspace leads" ON leads
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete workspace leads" ON leads
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- 10. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

-- 11. UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. APPLY UPDATED_AT TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DONE! Your database is now set up.
-- =============================================
-- Next steps:
-- 1. Go to leads.meetcursive.com
-- 2. Click "Sign up" to create an account
-- 3. Complete the onboarding to set up your workspace
-- =============================================
