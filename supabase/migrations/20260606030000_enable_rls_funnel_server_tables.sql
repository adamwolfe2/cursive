-- Security fix: close anonymous REST exposure on server-only tables.
--
-- Supabase advisor flagged `rls_disabled_in_public` (ERROR) on these tables,
-- and the `anon` role held SELECT — meaning the public anon key (shipped in
-- the client bundle) could read them. funnel_portal_tokens.token grants full
-- portal access, so this was a credential-leak risk the moment a buyer
-- transacted.
--
-- All access to these tables is via the service-role admin client
-- (createAdminClient), which BYPASSES RLS. Enabling RLS with no policies +
-- revoking anon/authenticated grants therefore denies public access without
-- breaking any server-side flow.

alter table funnel_portal_tokens enable row level security;
alter table funnel_orders        enable row level security;
alter table draft_sequence_edits enable row level security;

revoke select, insert, update, delete on funnel_portal_tokens from anon, authenticated;
revoke select, insert, update, delete on funnel_orders        from anon, authenticated;
revoke select, insert, update, delete on draft_sequence_edits from anon, authenticated;
