-- Add domains_approval_url to onboarding_clients
-- Lets admin paste a shareable link (e.g. Google Sheet of sending domains + sender names)
-- so the client portal's Step 3 can surface it without an in-portal table editor.

ALTER TABLE public.onboarding_clients
  ADD COLUMN IF NOT EXISTS domains_approval_url text;

COMMENT ON COLUMN public.onboarding_clients.domains_approval_url IS
  'Optional external URL (e.g. Google Sheet) where the client reviews sending domains and sender names. Rendered on the client portal Step 3.';
