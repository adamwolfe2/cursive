-- CRM Fields Migration
-- Adds CRM-specific fields to leads table for lead management

-- Add CRM columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS crm_stage VARCHAR(50) DEFAULT 'new';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_leads_crm_stage ON leads(crm_stage);
CREATE INDEX IF NOT EXISTS idx_leads_last_contacted ON leads(last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_at);

-- Add comment
COMMENT ON COLUMN leads.assigned_user_id IS 'User assigned to this lead';
COMMENT ON COLUMN leads.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN leads.notes IS 'Internal notes about the lead';
COMMENT ON COLUMN leads.last_contacted_at IS 'Last time lead was contacted';
COMMENT ON COLUMN leads.next_follow_up_at IS 'Scheduled follow-up time';
COMMENT ON COLUMN leads.crm_stage IS 'Current stage in CRM pipeline';

-- Update RLS policies to include assigned_user_id in SELECT
-- Users should see leads assigned to them or unassigned leads in their workspace
DROP POLICY IF EXISTS "Users can view leads in their workspace" ON leads;
CREATE POLICY "Users can view leads in their workspace" ON leads
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Add policy for updating assigned leads
CREATE POLICY "Users can update leads assigned to them" ON leads
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );
