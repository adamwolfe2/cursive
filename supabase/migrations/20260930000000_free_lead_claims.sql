-- Free-leads flow (/start): one free batch of 25 verified leads per work email and per company domain.
-- Spec: .claude/specs/2026-09-30-free-leads-flow.md
-- Server-only table: RLS enabled with NO policies, so anon/authenticated roles can
-- neither read nor write it. Only service-role server routes touch it.
--
-- Status machine: pending -> processing -> fulfilled | failed
--   processing -> pending ONLY when the failure happened before the paid pull
--   request was sent; processing older than 5 minutes is treated as failed.

CREATE TABLE IF NOT EXISTS public.free_lead_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL CHECK (email = lower(email)),
  email_domain TEXT NOT NULL CHECK (email_domain = lower(email_domain)),
  website TEXT NOT NULL,
  icp JSONB NOT NULL,
  filters JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'fulfilled', 'failed')),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  auth_user_id UUID,
  ip_hash TEXT,
  -- sha256 of the one-time token carried in the emailed link (?c=...). The
  -- 25-lead pull requires it, so a session alone (e.g. password signup with
  -- auto-confirm) cannot fulfill a claim without mailbox access.
  claim_token_hash TEXT,
  -- Paid pulls attempted. Once a pull request has been sent it is never retried
  -- automatically (a timeout may already have been billed).
  attempts INTEGER NOT NULL DEFAULT 0,
  processing_started_at TIMESTAMPTZ,
  credits_used INTEGER NOT NULL DEFAULT 0,
  total_matching INTEGER,
  upgrade_interest TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);

-- Invariant 2a: one claim per email, ever.
CREATE UNIQUE INDEX IF NOT EXISTS free_lead_claims_email_key
  ON public.free_lead_claims (email);

-- Invariant 2b: one in-flight or fulfilled claim per company domain. The
-- pending -> processing transition hits this index, so two colleagues racing
-- cannot both be fulfilled.
CREATE UNIQUE INDEX IF NOT EXISTS free_lead_claims_domain_active_key
  ON public.free_lead_claims (email_domain)
  WHERE status IN ('processing', 'fulfilled');

CREATE INDEX IF NOT EXISTS free_lead_claims_created_at_idx
  ON public.free_lead_claims (created_at);

ALTER TABLE public.free_lead_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.free_lead_claims FROM anon, authenticated;

COMMENT ON TABLE public.free_lead_claims IS
  'Free-leads (/start) claims. Server-only (service role); RLS on with no policies.';
