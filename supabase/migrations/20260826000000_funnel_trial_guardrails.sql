-- Funnel trial guardrails
-- -----------------------
-- The 14-day trial means "an order exists" no longer implies "money changed
-- hands". Two timestamps make that distinction explicit so downstream code can
-- stop inferring payment from the existence of a row:
--   trial_ends_at  — when Stripe will take the first real charge
--   first_paid_at  — set once, when a non-zero invoice actually succeeds
-- Entitlement to the expensive deliverable (the managed audience) keys off
-- first_paid_at, not off order status.

alter table funnel_orders
  add column if not exists trial_ends_at timestamptz,
  add column if not exists first_paid_at timestamptz;

-- Repeat-trial detection looks up prior orders by buyer email on every
-- checkout completion; without this it is a seq scan on a growing table.
create index if not exists idx_funnel_orders_customer_email
  on funnel_orders (customer_email);

-- Finds trials approaching conversion that have not yet paid.
create index if not exists idx_funnel_orders_trial_unpaid
  on funnel_orders (trial_ends_at)
  where first_paid_at is null;

comment on column funnel_orders.trial_ends_at is
  'When the free trial converts to a paid charge. Null = no trial (paid immediately).';
comment on column funnel_orders.first_paid_at is
  'First non-zero invoice payment. Null = never paid us anything yet.';

-- Backfill. Every order created before the 14-day trial shipped (2026-08-26,
-- ~18:15 UTC) was charged at checkout, so first_paid_at is its creation time.
-- Skipped without this, existing paying customers would be treated as
-- unconverted trialers and locked out of the audience they already pay for.
update funnel_orders
   set first_paid_at = created_at
 where first_paid_at is null
   and created_at < timestamptz '2026-08-26 18:00:00+00'
   and subscription_state <> 'incomplete';
