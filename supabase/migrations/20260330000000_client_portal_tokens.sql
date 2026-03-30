-- Client portal magic link tokens
CREATE TABLE client_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES onboarding_clients(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '60 days',
  last_accessed_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_portal_tokens_token ON client_portal_tokens(token);
CREATE INDEX idx_portal_tokens_client ON client_portal_tokens(client_id);

-- Client portal step approvals (what the client has done)
CREATE TABLE client_portal_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES onboarding_clients(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES client_portal_tokens(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN ('contract', 'invoice', 'domains', 'copy')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, step_type)
);

CREATE INDEX idx_portal_approvals_client ON client_portal_approvals(client_id);

-- Add portal tracking columns to onboarding_clients
ALTER TABLE onboarding_clients ADD COLUMN IF NOT EXISTS portal_invite_sent_at TIMESTAMPTZ;
ALTER TABLE onboarding_clients ADD COLUMN IF NOT EXISTS portal_last_visited_at TIMESTAMPTZ;

-- RLS: tokens are only accessible via service role (we use service role in portal API)
ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON client_portal_tokens FOR ALL USING (false);
CREATE POLICY "Service role only" ON client_portal_approvals FOR ALL USING (false);
