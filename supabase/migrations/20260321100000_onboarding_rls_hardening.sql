-- Onboarding RLS Hardening
-- Drop overly broad policies and replace with role-based access

-- Drop existing policies that are too broad
drop policy if exists "Public can insert onboarding_clients" on onboarding_clients;
drop policy if exists "Public can insert client_files" on client_files;
drop policy if exists "Admin full access on onboarding_clients" on onboarding_clients;
drop policy if exists "Admin full access on client_files" on client_files;
drop policy if exists "Admin full access on fulfillment_checklists" on fulfillment_checklists;

-- Anon can INSERT (form submission)
create policy "anon_insert_onboarding" on onboarding_clients
  for insert to anon with check (true);

-- Anon can INSERT files
create policy "anon_insert_client_files" on client_files
  for insert to anon with check (true);

-- Admin SELECT/UPDATE/DELETE on onboarding_clients
create policy "admin_select_onboarding" on onboarding_clients
  for select to authenticated using (
    exists (select 1 from users where users.auth_user_id = auth.uid() and users.role in ('owner','admin'))
  );
create policy "admin_update_onboarding" on onboarding_clients
  for update to authenticated using (
    exists (select 1 from users where users.auth_user_id = auth.uid() and users.role in ('owner','admin'))
  );
create policy "admin_delete_onboarding" on onboarding_clients
  for delete to authenticated using (
    exists (select 1 from users where users.auth_user_id = auth.uid() and users.role in ('owner','admin'))
  );

-- Admin full access on client_files (SELECT/UPDATE/DELETE)
create policy "admin_select_client_files" on client_files
  for select to authenticated using (
    exists (select 1 from users where users.auth_user_id = auth.uid() and users.role in ('owner','admin'))
  );
create policy "admin_update_client_files" on client_files
  for update to authenticated using (
    exists (select 1 from users where users.auth_user_id = auth.uid() and users.role in ('owner','admin'))
  );
create policy "admin_delete_client_files" on client_files
  for delete to authenticated using (
    exists (select 1 from users where users.auth_user_id = auth.uid() and users.role in ('owner','admin'))
  );

-- Admin full access on fulfillment_checklists
create policy "admin_all_checklists" on fulfillment_checklists
  for all to authenticated using (
    exists (select 1 from users where users.auth_user_id = auth.uid() and users.role in ('owner','admin'))
  );
