-- First-visitor "aha" tracking (#3).
-- Records when a funnel buyer was emailed about their first identified visitor,
-- so the aha email fires exactly once.

alter table funnel_orders
  add column if not exists first_visitor_notified_at timestamptz;

comment on column funnel_orders.first_visitor_notified_at is
  'When the buyer was emailed their first-identified-visitor "aha" moment (#3). Guards against re-sending.';
