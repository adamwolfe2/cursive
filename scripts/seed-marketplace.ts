import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedMarketplace() {
  console.log('Seeding marketplace data...')

  // 1. Create test partner
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .upsert(
      {
        id: '11111111-1111-1111-1111-111111111111',
        company_name: 'Demo Data Provider',
        contact_email: 'partner@demo.com',
        contact_name: 'Demo Partner',
        website: 'https://demo-provider.com',
        status: 'active',
        tier: 'gold',
        quality_score: 85,
        commission_rate: 0.3,
        total_leads_uploaded: 0,
        total_leads_sold: 0,
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  console.log('Created partner:', partner?.company_name)

  // 2. Create sample marketplace leads
  const industries = ['HVAC', 'Roofing', 'Plumbing', 'Solar', 'Electrical']
  const states = ['CA', 'TX', 'FL', 'NY', 'AZ']
  const sizes = ['1-10', '11-50', '51-200', '201-500']
  const seniorityLevels = ['C-Level', 'VP', 'Director', 'Manager']

  const leads = []
  for (let i = 0; i < 50; i++) {
    const industry = industries[Math.floor(Math.random() * industries.length)]
    const state = states[Math.floor(Math.random() * states.length)]
    const intentScore = Math.floor(Math.random() * 60) + 40 // 40-100
    const freshnessScore = Math.floor(Math.random() * 40) + 60 // 60-100

    leads.push({
      workspace_id: '00000000-0000-0000-0000-000000000001',
      partner_id: partner?.id,
      company_name: `${industry} Company ${i + 1}`,
      company_domain: `${industry.toLowerCase()}company${i + 1}.com`,
      company_industry: industry,
      company_size: sizes[Math.floor(Math.random() * sizes.length)],
      company_location: {
        city: ['Los Angeles', 'Houston', 'Miami', 'New York', 'Phoenix'][
          Math.floor(Math.random() * 5)
        ],
        state,
        country: 'US',
      },
      contact_data: {
        contacts: [
          {
            full_name: `John Doe ${i + 1}`,
            email: `john${i + 1}@${industry.toLowerCase()}company${i + 1}.com`,
            phone: `555-${String(1000 + i).padStart(4, '0')}`,
            job_title: seniorityLevels[Math.floor(Math.random() * seniorityLevels.length)],
          },
        ],
        total_contacts: 1,
      },
      intent_score_calculated: intentScore,
      freshness_score: freshnessScore,
      verification_status: Math.random() > 0.2 ? 'valid' : 'catch_all',
      is_marketplace_listed: true,
      source: 'partner_upload',
      marketplace_price: 0, // Will be calculated below
    })
  }

  // Calculate prices using the database function
  for (const lead of leads) {
    const { data: price } = await supabase.rpc('calculate_lead_marketplace_price', {
      p_intent_score: lead.intent_score_calculated,
      p_freshness_score: lead.freshness_score,
      p_has_phone: true,
      p_verification_status: lead.verification_status,
    })
    lead.marketplace_price = price || 5.0
  }

  const { error: leadsError } = await supabase.from('leads').insert(leads)

  if (leadsError) {
    console.error('Error inserting leads:', leadsError)
  } else {
    console.log(`Created ${leads.length} marketplace leads`)
  }

  // 3. Initialize workspace credits for admin workspace
  await supabase
    .from('workspace_credits')
    .upsert(
      {
        workspace_id: '00000000-0000-0000-0000-000000000001',
        available_credits: 500,
        total_purchased: 500,
        total_spent: 0,
      },
      { onConflict: 'workspace_id' }
    )

  console.log('Initialized 500 credits for admin workspace')

  // 4. Create platform admin
  await supabase
    .from('platform_admins')
    .upsert(
      {
        email: 'adam@meetcursive.com',
        full_name: 'Adam Wolfe',
        is_active: true,
        permissions: ['all'],
      },
      { onConflict: 'email' }
    )

  console.log('Created platform admin: adam@meetcursive.com')

  console.log('\n✅ Marketplace seed complete!')
  console.log('- 1 demo partner (active)')
  console.log('- 50 marketplace leads (listed)')
  console.log('- 500 credits for admin workspace')
  console.log('- Platform admin created')
}

seedMarketplace().catch(console.error)
