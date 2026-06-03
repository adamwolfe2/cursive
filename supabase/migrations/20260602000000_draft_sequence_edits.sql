-- Audit log for inline edits to onboarding_clients.draft_sequences.
-- Each row captures one save: which actor (admin or client), which field
-- (subject_line | body), which sequence_index + email_step, and the
-- prev/next values. Lets us reconstruct edit history without versioning
-- the entire draft_sequences blob.
--
-- Designed for low write volume (~10 edits per client onboarding) so RLS
-- is intentionally simple: server-side service-role inserts only. Read
-- access happens through the admin onboarding routes via
-- createAdminClient(); RLS off for now (matches admin_audit_logs pattern).

create table if not exists draft_sequence_edits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references onboarding_clients(id) on delete cascade,
  actor text not null check (actor in ('admin', 'client')),
  actor_email text,
  actor_token_id uuid references client_portal_tokens(id) on delete set null,
  sequence_index integer not null,
  email_step integer not null,
  field text not null check (field in ('subject_line', 'body')),
  prev_value text,
  next_value text,
  created_at timestamptz not null default now()
);

create index if not exists idx_draft_sequence_edits_client_created
  on draft_sequence_edits (client_id, created_at desc);

create index if not exists idx_draft_sequence_edits_client_position
  on draft_sequence_edits (client_id, sequence_index, email_step);

comment on table draft_sequence_edits is
  'Audit log for inline edits to onboarding_clients.draft_sequences. One row per autosave per field.';
