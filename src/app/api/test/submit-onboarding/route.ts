export const maxDuration = 30

import { NextResponse } from 'next/server'
import { getInngest } from '@/inngest/client'

export async function POST(request: Request) {
  // Test endpoint — never run in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const secret = request.headers.get('x-automation-secret')
  if (!process.env.AUTOMATION_SECRET || secret !== process.env.AUTOMATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Import admin client
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()

  const testClient = {
    status: 'onboarding',
    company_name: 'TestCo Inc',
    company_website: 'https://testco.example.com',
    industry: 'B2B SaaS',
    primary_contact_name: 'Test User',
    primary_contact_email: 'adam@amcollective.io',
    primary_contact_phone: '555-0100',
    communication_channel: 'Slack',
    packages_selected: ['outbound', 'super_pixel'],
    setup_fee: 1500,
    recurring_fee: null,
    billing_cadence: 'Quarterly',
    outbound_tier: 'Growth',
    custom_tier_details: null,
    payment_method: 'Credit Card',
    invoice_email: null,
    domain_cost_acknowledged: true,
    audience_cost_acknowledged: false,
    pixel_cost_acknowledged: true,
    additional_audience_noted: false,
    icp_description: 'Mid-market B2B SaaS companies with 50-500 employees that are spending on paid ads but not doing outbound email. They have a sales team but no dedicated SDR function.',
    target_industries: ['B2B SaaS', 'FinTech', 'MarTech'],
    sub_industries: ['Sales Tech', 'Growth Tools'],
    target_company_sizes: ['51-200', '201-500'],
    target_titles: ['VP Marketing', 'Head of Growth', 'VP Sales', 'SDR Manager'],
    target_geography: ['US Only'],
    specific_regions: null,
    must_have_traits: 'Must have a website with pricing page. Must be running paid ads.',
    exclusion_criteria: 'No government agencies. No companies under $1M revenue.',
    pain_points: 'Spending too much on paid ads with declining returns. No outbound motion. Sales team waiting for inbound leads that are getting more expensive. Competitors are outbounding them.',
    intent_keywords: ['cold email software', 'lead enrichment', 'identity resolution', 'B2B data provider'],
    competitor_names: ['Apollo', 'ZoomInfo', 'Instantly'],
    best_customers: 'Acme Corp, TechStart Inc, DataFlow Systems',
    sample_accounts: 'Notion, Linear, Vercel, Supabase',
    sending_volume: '15,000',
    lead_volume: '15,000',
    start_timeline: 'ASAP',
    sender_names: 'Sarah Chen\nMike Torres',
    domain_variations: 'testco\ngettestco\ntestcohq\ntrytestco',
    domain_provider: 'Mixed (recommended)',
    existing_domains: null,
    copy_tone: 'Conversational',
    primary_cta: 'Book a call',
    custom_cta: null,
    calendar_link: 'https://cal.com/testco/intro',
    reply_routing_email: 'adam@amcollective.io',
    backup_reply_email: null,
    compliance_disclaimers: null,
    pixel_urls: 'https://testco.example.com\nhttps://app.testco.example.com',
    uses_gtm: 'Yes',
    gtm_container_id: 'GTM-TEST123',
    pixel_installer: 'My developer will install it',
    developer_email: 'dev@testco.example.com',
    pixel_delivery: ['Send to CRM', 'Add to outbound email list'],
    pixel_delivery_other: null,
    pixel_crm_name: 'HubSpot',
    conversion_events: 'Form submission, Pricing page visit, Demo request',
    monthly_traffic: '5,000-25,000',
    audience_refresh: 'Weekly',
    data_use_cases: ['Cold email', 'CRM enrichment'],
    primary_crm: 'HubSpot',
    custom_platform: null,
    data_format: 'CSV',
    audience_count: '2-3',
    has_existing_list: 'No',
    copy_approval: true,
    sender_identity_approval: true,
    sow_signed: true,
    payment_confirmed: true,
    data_usage_ack: true,
    privacy_ack: true,
    billing_terms_ack: true,
    additional_notes: 'This is a test submission from the test script.',
    signature_name: 'Test User',
    signature_date: new Date().toISOString().split('T')[0],
    onboarding_complete: true,
  }

  // Insert
  const { data, error } = await supabase
    .from('onboarding_clients')
    .insert(testClient)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create test client' }, { status: 500 })
  }

  const clientId = data.id

  // Fire Inngest event
  try {
    const inngest = getInngest()
    await inngest.send({
      name: 'onboarding/intake-complete' as const,
      data: { client_id: clientId },
    })
  } catch (_inngestError: any) {
    // Fallback: call API route directly
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
      await fetch(`${baseUrl}/api/automations/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-automation-secret': process.env.AUTOMATION_SECRET || '',
        },
        body: JSON.stringify({ client_id: clientId }),
      })
    } catch {
      return NextResponse.json({
        success: true,
        client_id: clientId,
        warning: 'Client created but automation pipeline failed to trigger. Run manually.',
      })
    }
  }

  return NextResponse.json({
    success: true,
    client_id: clientId,
    admin_url: `/admin/onboarding/${clientId}`,
    message: 'Test client created and pipeline triggered. Check admin dashboard and Slack.',
  })
}
