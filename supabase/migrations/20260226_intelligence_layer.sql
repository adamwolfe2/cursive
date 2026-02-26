-- Intelligence Layer: new columns on leads + enrichment_costs table

-- New leads columns for intelligence data
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_tech_stack jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_data jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_intel jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS news_mentions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS research_brief text,
  ADD COLUMN IF NOT EXISTS research_brief_at timestamptz,
  ADD COLUMN IF NOT EXISTS intelligence_tier text DEFAULT 'none';

-- Cost tracking table for intelligence enrichments
CREATE TABLE IF NOT EXISTS enrichment_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  tier text NOT NULL CHECK (tier IN ('auto', 'intel', 'deep_research', 'nl_query')),
  provider text NOT NULL,
  credits_charged numeric(10,2) DEFAULT 0,
  api_cost_usd numeric(10,6) DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'rate_limited')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS on enrichment_costs
ALTER TABLE enrichment_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation" ON enrichment_costs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Admin bypass
CREATE POLICY "service_role_bypass" ON enrichment_costs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for admin margin queries
CREATE INDEX IF NOT EXISTS idx_enrichment_costs_workspace ON enrichment_costs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrichment_costs_tier ON enrichment_costs(tier, created_at DESC);

-- Safe execute function for NL queries (SELECT only, called by service role)
CREATE OR REPLACE FUNCTION execute_nl_query(query_sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  upper_sql text;
BEGIN
  upper_sql := upper(trim(query_sql));

  -- Only allow SELECT
  IF NOT (upper_sql LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Block dangerous keywords
  IF upper_sql ~ '(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Must include workspace_id filter
  IF lower(query_sql) NOT LIKE '%workspace_id%' THEN
    RAISE EXCEPTION 'Query must include workspace_id filter';
  END IF;

  EXECUTE 'SELECT json_agg(q) FROM (' || query_sql || ') q' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;
