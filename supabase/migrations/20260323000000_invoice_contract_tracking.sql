-- Migration: Add Stripe invoice + RabbitSign contract tracking to onboarding_clients

alter table onboarding_clients
  add column if not exists stripe_invoice_id text,
  add column if not exists stripe_invoice_url text,
  add column if not exists stripe_invoice_status text default 'none',
  add column if not exists rabbitsign_folder_id text,
  add column if not exists rabbitsign_status text default 'none',
  add column if not exists contract_signed_at timestamptz;
