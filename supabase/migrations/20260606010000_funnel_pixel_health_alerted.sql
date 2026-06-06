-- Funnel pixel health alerting (#1).
-- Tracks when ops was alerted that a funnel pixel is "silent" (installed but
-- receiving zero visitor events), so the health-check cron alerts once, not
-- on every run.

alter table funnel_orders
  add column if not exists pixel_health_alerted_at timestamptz;

comment on column funnel_orders.pixel_health_alerted_at is
  'When ops was alerted that this funnel pixel is silent (installed but receiving 0 events). Guards against duplicate alerts.';
