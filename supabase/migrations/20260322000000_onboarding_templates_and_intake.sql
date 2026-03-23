-- Migration: onboarding_templates table, intake_source column, campaign tracking columns
-- Part of Phase 1: Internal Intake Mode + Template System

-- ---------------------------------------------------------------------------
-- 1. Add intake_source to onboarding_clients
-- ---------------------------------------------------------------------------

alter table onboarding_clients
  add column if not exists intake_source text default 'client_form'
  check (intake_source in ('client_form', 'internal_intake', 'template_clone', 'duplicate'));

-- ---------------------------------------------------------------------------
-- 2. Add campaign tracking columns to onboarding_clients
-- ---------------------------------------------------------------------------

alter table onboarding_clients
  add column if not exists campaign_deployed boolean default false;

alter table onboarding_clients
  add column if not exists emailbison_campaign_ids jsonb default '[]'::jsonb;

alter table onboarding_clients
  add column if not exists campaign_stats jsonb;

-- ---------------------------------------------------------------------------
-- 3. Create onboarding_templates table
-- ---------------------------------------------------------------------------

create table if not exists onboarding_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  description text,
  category text check (category in ('Agency', 'SaaS', 'E-commerce', 'Services', 'Custom')),
  is_default boolean default false,
  template_data jsonb not null default '{}'::jsonb
);

-- Index for listing templates
create index if not exists idx_onboarding_templates_category on onboarding_templates(category);
create index if not exists idx_onboarding_templates_default on onboarding_templates(is_default) where is_default = true;

-- Auto-update updated_at trigger
create trigger onboarding_templates_updated
  before update on onboarding_templates
  for each row
  execute function update_onboarding_updated_at();

-- ---------------------------------------------------------------------------
-- 4. RLS for onboarding_templates (admin-only read/write)
-- ---------------------------------------------------------------------------

alter table onboarding_templates enable row level security;

-- Authenticated admins/owners can do everything
create policy "Admin full access to templates"
  on onboarding_templates
  for all
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from users
      where users.auth_user_id = auth.uid()
      and users.role in ('admin', 'owner')
    )
  );

-- Service role always has access (for server actions)
create policy "Service role access to templates"
  on onboarding_templates
  for all
  using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 5. Seed starter templates
-- ---------------------------------------------------------------------------

insert into onboarding_templates (name, description, category, is_default, template_data) values
(
  'Agency Owner (GHL / Automation)',
  'Pre-filled ICP for marketing/automation agency owners using GoHighLevel',
  'Agency',
  true,
  '{
    "packages_selected": ["outbound", "audience"],
    "target_industries": ["Marketing Agency", "Automation Agency", "Digital Agency"],
    "target_company_sizes": ["1-10", "11-50"],
    "target_titles": ["Agency Owner", "Founder", "CEO", "Managing Director"],
    "target_geography": ["US Only"],
    "pain_points": "Struggling to find new clients consistently. Relying on referrals. Want predictable outbound pipeline. Need to differentiate from hundreds of other agencies.",
    "intent_keywords": ["GHL agency", "GoHighLevel", "white label SaaS", "agency growth", "client acquisition for agencies"],
    "copy_tone": "Conversational",
    "primary_cta": "Book a call",
    "data_use_cases": ["Cold email"],
    "primary_crm": "GoHighLevel",
    "data_format": "CSV",
    "audience_count": "2-3"
  }'::jsonb
),
(
  'B2B SaaS - Mid Market',
  'Pre-filled ICP for B2B SaaS companies targeting mid-market buyers',
  'SaaS',
  true,
  '{
    "packages_selected": ["outbound", "super_pixel"],
    "target_industries": ["B2B SaaS", "Technology"],
    "target_company_sizes": ["51-200", "201-500"],
    "target_titles": ["VP Marketing", "Head of Growth", "VP Sales", "Director of Demand Gen", "CMO"],
    "target_geography": ["US Only"],
    "pain_points": "High CAC on paid channels. Inbound slowing down. Need outbound motion to supplement pipeline. Competitors outbounding them.",
    "intent_keywords": ["B2B lead generation", "outbound sales", "demand generation", "sales pipeline"],
    "copy_tone": "Direct/Bold",
    "primary_cta": "Book a call",
    "data_use_cases": ["Cold email", "CRM enrichment"],
    "primary_crm": "HubSpot",
    "data_format": "Direct CRM sync"
  }'::jsonb
),
(
  'E-commerce / DTC Brand',
  'Pre-filled ICP for e-commerce and direct-to-consumer brands',
  'E-commerce',
  true,
  '{
    "packages_selected": ["super_pixel", "audience"],
    "target_industries": ["E-commerce", "Direct to Consumer", "Retail"],
    "target_company_sizes": ["11-50", "51-200"],
    "target_titles": ["Founder", "CEO", "Head of Marketing", "E-commerce Manager", "Growth Lead"],
    "target_geography": ["US Only"],
    "pain_points": "Rising ad costs on Meta/Google. Cannot retarget anonymous visitors. Losing 97% of site traffic without identification. Email list growth stalled.",
    "intent_keywords": ["identity resolution", "website visitor identification", "retargeting", "abandoned cart", "Klaviyo"],
    "copy_tone": "Friendly/Casual",
    "primary_cta": "Book a call",
    "data_use_cases": ["Paid ads", "CRM enrichment"],
    "primary_crm": "Klaviyo",
    "data_format": "Direct CRM sync"
  }'::jsonb
),
(
  'SDR Team / RevOps',
  'Pre-filled ICP for sales development and revenue operations teams',
  'SaaS',
  true,
  '{
    "packages_selected": ["audience", "enrichment"],
    "target_industries": ["B2B SaaS", "Technology", "Professional Services"],
    "target_company_sizes": ["201-500", "500-1000", "1000+"],
    "target_titles": ["SDR Manager", "VP Sales Development", "Head of RevOps", "Director of Sales Ops"],
    "target_geography": ["US Only"],
    "pain_points": "Data quality issues with current providers. Low connect rates. SDR team wasting time on bad leads. Need higher-intent, verified contacts.",
    "intent_keywords": ["B2B data provider", "lead enrichment", "sales intelligence", "intent data", "contact database"],
    "copy_tone": "Professional/Formal",
    "primary_cta": "Reply to learn more",
    "data_use_cases": ["Cold email", "Call center / phone outreach"],
    "primary_crm": "Salesforce",
    "data_format": "CSV"
  }'::jsonb
),
(
  'Podcast Host / Influencer (Affiliate)',
  'Pre-filled for content creators and influencers joining the affiliate program',
  'Services',
  true,
  '{
    "packages_selected": ["affiliate"],
    "target_industries": ["Media", "Content Creation", "Coaching"],
    "target_company_sizes": ["1-10"],
    "target_titles": ["Podcast Host", "Content Creator", "Influencer", "Community Leader", "Coach"],
    "target_geography": ["US Only", "Global"],
    "pain_points": "Looking for high-ticket affiliate offers. Want passive income from audience. Need something that actually converts for B2B followers.",
    "copy_tone": "Conversational",
    "primary_cta": "Book a call"
  }'::jsonb
);
