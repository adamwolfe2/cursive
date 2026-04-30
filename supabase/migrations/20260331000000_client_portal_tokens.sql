-- Client Portal Tokens
-- Magic-link style tokens for client portal access (no Supabase Auth required)
-- 60-day expiration, unique per send

CREATE TABLE IF NOT EXISTS public.client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.onboarding_clients(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  last_accessed_at timestamptz,
  revoked boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS client_portal_tokens_token_idx
  ON public.client_portal_tokens(token);

CREATE INDEX IF NOT EXISTS client_portal_tokens_client_id_idx
  ON public.client_portal_tokens(client_id);

ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Service role has full access (all portal API calls use service role client)
CREATE POLICY "Service role full access"
  ON public.client_portal_tokens
  TO service_role
  USING (true)
  WITH CHECK (true);
