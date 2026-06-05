-- Funnel orders — subscription lifecycle + pixel firing tracking
-- ------------------------------------------------------------
-- subscription_state mirrors Stripe (separate dimension from the workflow
-- `status` enum so billing changes don't clobber onboarding progress).
-- pixel_last_event_at + pixel_install_reminded_at let us detect buyers who
-- never actually pasted the snippet and nudge them once.

alter table funnel_orders
  add column if not exists subscription_state text not null default 'active',
  add column if not exists subscription_cancelled_at timestamptz,
  add column if not exists subscription_past_due_at timestamptz,
  add column if not exists pixel_last_event_at timestamptz,
  add column if not exists pixel_install_reminded_at timestamptz,
  add column if not exists last_visitor_digest_at timestamptz;

-- Reuse a check constraint name we can drop+recreate idempotently
do $$
begin
  if exists (
    select 1 from information_schema.constraint_column_usage
    where constraint_name = 'funnel_orders_subscription_state_check'
  ) then
    alter table funnel_orders drop constraint funnel_orders_subscription_state_check;
  end if;
end $$;

alter table funnel_orders
  add constraint funnel_orders_subscription_state_check
  check (subscription_state in ('active', 'past_due', 'paused', 'cancelled', 'incomplete'));

create index if not exists idx_funnel_orders_subscription_state
  on funnel_orders (subscription_state);

create index if not exists idx_funnel_orders_pixel_last_event
  on funnel_orders (pixel_last_event_at desc nulls last);

create index if not exists idx_funnel_orders_install_reminded
  on funnel_orders (pixel_install_reminded_at)
  where pixel_install_reminded_at is null;

comment on column funnel_orders.subscription_state is
  'Stripe subscription state. Workflow status lives separately in funnel_orders.status.';
comment on column funnel_orders.pixel_last_event_at is
  'Timestamp of the most recent audiencelab_events row for this order''s pixel. Updated by visitor query path + nightly cron.';
comment on column funnel_orders.pixel_install_reminded_at is
  'Set once we send the "did the snippet land?" reminder so we never double-send.';
comment on column funnel_orders.last_visitor_digest_at is
  'Set each time we send the weekly visitor digest email. Drives the next digest schedule.';
