-- ============================================================================
-- Webhook Dead-Letter Queue
-- ----------------------------------------------------------------------------
-- When audiencelab_events inserts fail in the SuperPixel / AudienceSync
-- webhook handlers, we write the failed row here instead of silently dropping
-- it. The inbound-email handler also writes here for unmatched messages.
--
-- Used by:
--   - src/app/api/webhooks/audiencelab/superpixel/route.ts
--   - src/app/api/webhooks/audiencelab/audiencesync/route.ts
--   - src/app/api/webhooks/inbound-email/route.ts
-- ============================================================================

create table if not exists webhook_dead_letter (
  id uuid primary key default gen_random_uuid(),
  source text not null,           -- 'audiencelab.superpixel', 'audiencelab.audiencesync', 'inbound_email_unmatched', etc.
  payload jsonb not null,         -- the row/event that failed to insert
  error text not null,            -- the captured error message
  workspace_id uuid,              -- if known, for cleanup queries
  created_at timestamptz not null default now(),
  retried_at timestamptz,
  retry_count integer not null default 0
);

create index if not exists idx_webhook_dead_letter_source_created
  on webhook_dead_letter(source, created_at desc);

create index if not exists idx_webhook_dead_letter_unretried
  on webhook_dead_letter(created_at desc) where retried_at is null;

alter table webhook_dead_letter enable row level security;

-- Service role only — admins read via internal API, no end-user access.
create policy "Service role manages dead letter" on webhook_dead_letter
  for all using (false) with check (false);
