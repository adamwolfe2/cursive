-- Drop overly permissive anon insert
drop policy if exists "anon_insert_onboarding" on onboarding_clients;

-- Create a restrictive insert policy that enforces safe defaults
create policy "anon_insert_onboarding_restricted" on onboarding_clients
  for insert to anon
  with check (
    status = 'onboarding'
    and enrichment_status = 'pending'
    and copy_generation_status = 'pending'
    and copy_approval_status = 'pending'
    and crm_sync_status = 'pending'
    and slack_notification_sent = false
    and confirmation_email_sent = false
    and onboarding_complete = true
    and enriched_icp_brief is null
    and draft_sequences is null
    and crm_record_id is null
    and admin_notes is null
    and automation_log = '[]'::jsonb
  );
