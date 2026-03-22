-- Onboarding clients intake system
-- Tables: onboarding_clients, client_files, fulfillment_checklists

create table onboarding_clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Pipeline status
  status text default 'onboarding' check (status in ('lead','booked','discovery','closed','onboarding','setup','active','reporting','churned')),

  -- Section 1: Company basics
  company_name text not null,
  company_website text not null,
  industry text not null,
  primary_contact_name text not null,
  primary_contact_email text not null,
  primary_contact_phone text not null,
  billing_contact_name text,
  billing_contact_email text,
  team_members text,
  communication_channel text not null,
  slack_url text,
  referral_source text,
  referral_detail text,

  -- Section 2: Package selection
  packages_selected jsonb not null default '[]'::jsonb,

  -- Section 3: Commercial approvals
  setup_fee numeric,
  recurring_fee numeric,
  billing_cadence text,
  outbound_tier text,
  custom_tier_details text,
  payment_method text,
  invoice_email text,
  domain_cost_acknowledged boolean default false,
  audience_cost_acknowledged boolean default false,
  pixel_cost_acknowledged boolean default false,
  additional_audience_noted boolean default false,

  -- Section 4: ICP intake
  icp_description text,
  target_industries jsonb default '[]'::jsonb,
  sub_industries jsonb default '[]'::jsonb,
  target_company_sizes jsonb default '[]'::jsonb,
  target_titles jsonb default '[]'::jsonb,
  target_geography jsonb default '[]'::jsonb,
  specific_regions text,
  must_have_traits text,
  exclusion_criteria text,
  pain_points text,
  intent_keywords jsonb default '[]'::jsonb,
  competitor_names jsonb default '[]'::jsonb,
  best_customers text,
  sample_accounts text,

  -- Section 5: Outbound email setup
  sending_volume text,
  lead_volume text,
  start_timeline text,
  sender_names text,
  domain_variations text,
  domain_provider text,
  existing_domains text,
  copy_tone text,
  primary_cta text,
  custom_cta text,
  calendar_link text,
  reply_routing_email text,
  backup_reply_email text,
  compliance_disclaimers text,

  -- Section 6: Pixel setup
  pixel_urls text,
  uses_gtm text,
  gtm_container_id text,
  pixel_installer text,
  developer_email text,
  pixel_delivery jsonb default '[]'::jsonb,
  pixel_delivery_other text,
  pixel_crm_name text,
  conversion_events text,
  monthly_traffic text,
  audience_refresh text,

  -- Section 7: Use case and delivery
  data_use_cases jsonb default '[]'::jsonb,
  primary_crm text,
  custom_platform text,
  data_format text,
  audience_count text,
  has_existing_list text,

  -- Section 8: Content approvals
  copy_approval boolean default false,
  sender_identity_approval boolean default false,

  -- Section 9: Legal
  sow_signed boolean default false,
  payment_confirmed boolean default false,
  data_usage_ack boolean default false,
  privacy_ack boolean default false,
  billing_terms_ack boolean default false,
  additional_notes text,
  signature_name text,
  signature_date date,

  -- Automation outputs
  enriched_icp_brief jsonb,
  enrichment_status text default 'pending' check (enrichment_status in ('pending','processing','complete','failed')),
  draft_sequences jsonb,
  copy_generation_status text default 'pending' check (copy_generation_status in ('pending','processing','complete','failed','not_applicable')),
  copy_approval_status text default 'pending' check (copy_approval_status in ('pending','approved','needs_edits','regenerating','not_applicable')),
  slack_notification_sent boolean default false,
  confirmation_email_sent boolean default false,
  crm_record_id text,
  crm_sync_status text default 'pending' check (crm_sync_status in ('pending','synced','failed')),
  onboarding_complete boolean default false,
  automation_log jsonb default '[]'::jsonb,
  admin_notes text
);

-- Indexes
create index idx_onboarding_clients_status on onboarding_clients(status);
create index idx_onboarding_clients_created on onboarding_clients(created_at desc);
create index idx_onboarding_clients_email on onboarding_clients(primary_contact_email);

-- Auto-update updated_at
create or replace function update_onboarding_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger onboarding_clients_updated
  before update on onboarding_clients
  for each row execute function update_onboarding_updated_at();

-- Client files
create table client_files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references onboarding_clients(id) on delete cascade,
  created_at timestamptz default now(),
  file_name text not null,
  file_type text not null check (file_type in ('brand_guidelines','deck','testimonials','sample_offers','examples','existing_list','suppression_list')),
  storage_path text not null,
  file_size integer,
  mime_type text
);

create index idx_client_files_client on client_files(client_id);

-- Fulfillment checklists
create table fulfillment_checklists (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references onboarding_clients(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  items jsonb not null default '[]'::jsonb
);

create index idx_fulfillment_checklists_client on fulfillment_checklists(client_id);

create trigger fulfillment_checklists_updated
  before update on fulfillment_checklists
  for each row execute function update_onboarding_updated_at();

-- RLS Policies
alter table onboarding_clients enable row level security;
alter table client_files enable row level security;
alter table fulfillment_checklists enable row level security;

-- Admin-only access (service role bypasses RLS, but for completeness)
-- These tables are admin-managed, not workspace-scoped
-- Service role key is used for all operations

-- Allow authenticated admins to read/write
create policy "Admin full access on onboarding_clients" on onboarding_clients
  for all using (
    exists (
      select 1 from users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );

create policy "Admin full access on client_files" on client_files
  for all using (
    exists (
      select 1 from users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );

create policy "Admin full access on fulfillment_checklists" on fulfillment_checklists
  for all using (
    exists (
      select 1 from users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );

-- Public insert policy for onboarding form (unauthenticated clients can submit)
create policy "Public can insert onboarding_clients" on onboarding_clients
  for insert with check (true);

create policy "Public can insert client_files" on client_files
  for insert with check (true);

-- Create storage bucket for client uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-uploads',
  'client-uploads',
  false,
  26214400, -- 25MB
  array['application/pdf','image/png','image/jpeg','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']
) on conflict (id) do nothing;

-- Storage policies
create policy "Anyone can upload to client-uploads" on storage.objects
  for insert with check (bucket_id = 'client-uploads');

create policy "Admins can read client-uploads" on storage.objects
  for select using (
    bucket_id = 'client-uploads'
    and exists (
      select 1 from users
      where users.auth_user_id = auth.uid()
      and users.role in ('owner', 'admin')
    )
  );
