-- Visitor-Estimate Lead Magnet capture table
-- Cold marketing leads from leads.meetcursive.com/visitor-estimate
-- Self-contained (no workspace coupling); service-role writes only.

CREATE TABLE IF NOT EXISTS public.visitor_estimate_leads (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     text NOT NULL,
  domain                    text,
  monthly_visitors          integer,
  deal_size                 integer,
  industry                  text,
  revenue_leak_annual       bigint,
  cursive_advantage_annual  bigint,
  utm_source                text,
  utm_medium                text,
  utm_campaign              text,
  ip_address                text,
  user_agent                text,
  referrer                  text,
  nurture_status            text NOT NULL DEFAULT 'enrolled',
  unsubscribed_at           timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- One row per email (idempotent re-submission via upsert)
CREATE UNIQUE INDEX IF NOT EXISTS visitor_estimate_leads_email_key
  ON public.visitor_estimate_leads (email);

CREATE INDEX IF NOT EXISTS visitor_estimate_leads_created_at_idx
  ON public.visitor_estimate_leads (created_at DESC);

-- Partial index for active (non-unsubscribed) nurture targets
CREATE INDEX IF NOT EXISTS visitor_estimate_leads_active_idx
  ON public.visitor_estimate_leads (created_at DESC)
  WHERE unsubscribed_at IS NULL;

-- RLS: deny all by default. Inserts/reads happen via service-role (admin client),
-- which bypasses RLS. No public/anon policies — this table holds raw lead PII.
ALTER TABLE public.visitor_estimate_leads ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.visitor_estimate_leads IS
  'Cold leads captured from the public /visitor-estimate VSL calculator. Service-role writes only.';
