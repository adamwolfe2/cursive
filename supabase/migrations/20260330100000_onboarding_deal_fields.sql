-- Add deal pricing fields to onboarding_clients
-- infra_monthly_fee: the infrastructure cost passed-through to client (domains + inboxes)
-- deal_notes: internal sales notes from the admin wizard

ALTER TABLE onboarding_clients
  ADD COLUMN IF NOT EXISTS infra_monthly_fee numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deal_notes text DEFAULT NULL;
