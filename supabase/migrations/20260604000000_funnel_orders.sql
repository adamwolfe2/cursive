-- JustSearched VSL Funnel — orders + portal tokens
-- ------------------------------------------------------------
-- Pay-first self-serve flow for pixel + audience offers.
-- Anonymous purchase (no workspace, no user), identified by Stripe customer
-- email + an opaque portal token. RLS is OFF — all reads/writes go through
-- the admin client (same pattern as onboarding_clients).

create table if not exists funnel_orders (
  id uuid primary key default gen_random_uuid(),

  -- Stripe identity
  stripe_session_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,

  -- Buyer identity (collected by Stripe Checkout)
  customer_email text not null,
  customer_name text,

  -- Offer
  offer_slug text not null check (offer_slug in ('pixel_97', 'audience_197', 'bundle_247')),
  monthly_price_cents integer not null,

  -- Lifecycle: pending → paid → awaiting_pixel|awaiting_audience → awaiting_delivery → delivered
  -- pixel-only orders go pending → paid → awaiting_pixel → delivered (pixel snippet IS the deliverable)
  -- audience-only orders go pending → paid → awaiting_audience → awaiting_delivery → delivered
  -- bundle orders go pending → paid → awaiting_pixel → awaiting_audience → awaiting_delivery → delivered
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'awaiting_pixel', 'awaiting_audience', 'awaiting_delivery', 'delivered', 'cancelled')
  ),

  -- Pixel step output
  pixel_website_url text,
  pixel_domain text,
  pixel_audiencelab_id text,
  pixel_snippet text,
  pixel_install_url text,
  pixel_provisioned_at timestamptz,

  -- Audience step output (form payload + fulfillment)
  audience_solution text,
  audience_icp_description text,
  audience_titles text[],
  audience_industries text[],
  audience_employee_range text,
  audience_locations text[],
  audience_submitted_at timestamptz,

  -- Fulfillment (manual for now → automated later)
  audience_sheet_url text,
  audience_delivered_at timestamptz,
  fulfilled_by text,

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Sanity: required for offers that include audience
  constraint funnel_orders_offer_pixel_required check (
    offer_slug = 'audience_197' or pixel_website_url is null or pixel_website_url ~ '^https?://'
  )
);

create index if not exists idx_funnel_orders_status on funnel_orders (status, created_at desc);
create index if not exists idx_funnel_orders_email on funnel_orders (customer_email);
create index if not exists idx_funnel_orders_stripe_customer on funnel_orders (stripe_customer_id);

comment on table funnel_orders is
  'Pay-first VSL funnel orders. Anonymous purchase; identified by Stripe customer email + portal token.';

-- ------------------------------------------------------------
-- Portal tokens — one per order, opaque, expirable
-- ------------------------------------------------------------

create table if not exists funnel_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references funnel_orders(id) on delete cascade,
  token text not null unique,
  email text not null,
  expires_at timestamptz not null default (now() + interval '90 days'),
  revoked boolean not null default false,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_funnel_portal_tokens_order on funnel_portal_tokens (order_id);
create index if not exists idx_funnel_portal_tokens_token on funnel_portal_tokens (token);

comment on table funnel_portal_tokens is
  'Opaque tokens granting access to a funnel order''s portal. ≥32 bytes from crypto.randomBytes.';

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------

create or replace function set_updated_at_funnel_orders()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_funnel_orders_updated_at on funnel_orders;
create trigger trg_funnel_orders_updated_at
  before update on funnel_orders
  for each row
  execute function set_updated_at_funnel_orders();

-- RLS intentionally OFF — admin-client access only.
alter table funnel_orders disable row level security;
alter table funnel_portal_tokens disable row level security;
