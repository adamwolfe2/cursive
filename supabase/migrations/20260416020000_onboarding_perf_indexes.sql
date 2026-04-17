-- Performance: composite index for duplicate-submission check
-- Query in src/app/client-onboarding/actions.ts filters on email + created_at
-- (window of last hour) — a composite index avoids filtering the email result
-- set by created_at in memory.

create index if not exists idx_onboarding_clients_email_created
  on onboarding_clients (primary_contact_email, created_at desc);

-- Performance: status + created_at composite for kanban column ordering.
-- The kanban groups by status and sorts by created_at; a composite index
-- serves both at once.

create index if not exists idx_onboarding_clients_status_created
  on onboarding_clients (status, created_at desc);
