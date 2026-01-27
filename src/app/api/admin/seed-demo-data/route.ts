// Admin API: Seed Demo Data
// POST /api/admin/seed-demo-data - Populate dashboard with realistic demo data
// This is for demonstration purposes only
// SECURITY: Requires platform admin privileges

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { requireAdmin } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'

// Realistic company data for demos
const DEMO_COMPANIES = [
  { name: 'TechFlow Solutions', domain: 'techflow.io', industry: 'Technology', size: '51-200', city: 'San Francisco', state: 'CA' },
  { name: 'CloudScale Inc', domain: 'cloudscale.com', industry: 'Cloud Computing', size: '201-500', city: 'Seattle', state: 'WA' },
  { name: 'DataVault Analytics', domain: 'datavault.co', industry: 'Analytics', size: '11-50', city: 'Austin', state: 'TX' },
  { name: 'Nexus Innovations', domain: 'nexusinnovations.com', industry: 'Software', size: '51-200', city: 'Boston', state: 'MA' },
  { name: 'Quantum Systems', domain: 'quantumsystems.io', industry: 'Enterprise Software', size: '201-500', city: 'New York', state: 'NY' },
  { name: 'PrimeStack Tech', domain: 'primestack.com', industry: 'SaaS', size: '51-200', city: 'Denver', state: 'CO' },
  { name: 'Apex Digital Group', domain: 'apexdigital.co', industry: 'Digital Marketing', size: '11-50', city: 'Los Angeles', state: 'CA' },
  { name: 'Velocity Software', domain: 'velocitysw.com', industry: 'Software Development', size: '51-200', city: 'Chicago', state: 'IL' },
  { name: 'SynergyAI Labs', domain: 'synergyai.io', industry: 'Artificial Intelligence', size: '11-50', city: 'Palo Alto', state: 'CA' },
  { name: 'Frontier Systems', domain: 'frontiersys.com', industry: 'Cybersecurity', size: '201-500', city: 'Washington', state: 'DC' },
  { name: 'BlueOcean Tech', domain: 'blueoceantech.io', industry: 'FinTech', size: '51-200', city: 'Miami', state: 'FL' },
  { name: 'Meridian Software', domain: 'meridiansw.com', industry: 'Healthcare IT', size: '201-500', city: 'Nashville', state: 'TN' },
  { name: 'Elevate Digital', domain: 'elevatedigital.co', industry: 'E-commerce', size: '11-50', city: 'Portland', state: 'OR' },
  { name: 'CoreLogic Systems', domain: 'corelogicsys.com', industry: 'Data Services', size: '501-1000', city: 'Atlanta', state: 'GA' },
  { name: 'Pinnacle Networks', domain: 'pinnaclenet.io', industry: 'Networking', size: '51-200', city: 'Dallas', state: 'TX' },
  { name: 'Horizon Labs', domain: 'horizonlabs.co', industry: 'Biotech', size: '11-50', city: 'Cambridge', state: 'MA' },
  { name: 'Catalyst Ventures', domain: 'catalystvc.com', industry: 'Venture Capital', size: '11-50', city: 'San Francisco', state: 'CA' },
  { name: 'Stratus Cloud', domain: 'stratuscloud.io', industry: 'Cloud Infrastructure', size: '201-500', city: 'Seattle', state: 'WA' },
  { name: 'Radiant Solutions', domain: 'radiantsol.com', industry: 'Energy Tech', size: '51-200', city: 'Houston', state: 'TX' },
  { name: 'Infinity Systems', domain: 'infinitysys.io', industry: 'IoT', size: '51-200', city: 'San Jose', state: 'CA' },
  { name: 'Vanguard Tech', domain: 'vanguardtech.co', industry: 'Defense Tech', size: '501-1000', city: 'Arlington', state: 'VA' },
  { name: 'Summit Software', domain: 'summitsw.com', industry: 'ERP Software', size: '201-500', city: 'Salt Lake City', state: 'UT' },
  { name: 'Nova Digital', domain: 'novadigital.io', industry: 'Media Tech', size: '51-200', city: 'Los Angeles', state: 'CA' },
  { name: 'Pulse Analytics', domain: 'pulseanalytics.co', industry: 'Business Intelligence', size: '11-50', city: 'Minneapolis', state: 'MN' },
  { name: 'Forge Industries', domain: 'forgeindustries.com', industry: 'Manufacturing Tech', size: '201-500', city: 'Detroit', state: 'MI' },
]

const FIRST_NAMES = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jennifer', 'Robert', 'Lisa', 'William', 'Amanda', 'Richard', 'Jessica', 'Joseph', 'Michelle', 'Thomas', 'Ashley', 'Christopher', 'Stephanie', 'Daniel', 'Nicole']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris']
const JOB_TITLES = ['CEO', 'CTO', 'VP of Engineering', 'Head of Product', 'Director of Sales', 'VP of Marketing', 'Chief Revenue Officer', 'Head of Operations', 'Director of IT', 'VP of Business Development', 'Chief Data Officer', 'Head of Growth', 'Director of Customer Success', 'VP of Finance', 'Chief Strategy Officer']

const QUERY_TOPICS = [
  { topic: 'AI & Machine Learning', category: 'Technology' },
  { topic: 'Cloud Migration', category: 'Infrastructure' },
  { topic: 'Cybersecurity Solutions', category: 'Security' },
  { topic: 'Digital Transformation', category: 'Strategy' },
  { topic: 'SaaS Platforms', category: 'Software' },
]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateEmail(firstName: string, lastName: string, domain: string): string {
  const formats = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()[0]}@${domain}`,
    `${firstName.toLowerCase()[0]}${lastName.toLowerCase()}@${domain}`,
  ]
  return randomElement(formats)
}

function generatePhone(): string {
  return `+1 (${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`
}

function randomDate(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - randomInt(0, daysAgo))
  date.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0)
  return date.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check admin authorization (throws if not admin)
    await requireAdmin()

    // 2. Get current user for workspace context
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const workspaceId = user.workspace_id

    // Parse options from request body
    const body = await request.json().catch(() => ({}))
    const leadCount = Math.min(body.lead_count || 50, 200) // Max 200 leads
    const clearExisting = body.clear_existing || false

    // Optionally clear existing data
    if (clearExisting) {
      await supabase.from('lead_activities').delete().eq('workspace_id', workspaceId)
      await supabase.from('lead_notes').delete().eq('workspace_id', workspaceId)
      await supabase.from('lead_status_history').delete().eq('workspace_id', workspaceId)
      await supabase.from('leads').delete().eq('workspace_id', workspaceId)
      await supabase.from('queries').delete().eq('workspace_id', workspaceId)
    }

    // 2. Ensure global topics exist
    const topicsToInsert = QUERY_TOPICS.map(t => ({
      topic: t.topic,
      category: t.category,
      description: `Intent signals related to ${t.topic}`,
      keywords: [t.topic.toLowerCase().replace(/\s+/g, '-')],
      created_at: new Date().toISOString(),
    }))

    // Upsert topics (ignore conflicts)
    for (const topic of topicsToInsert) {
      await supabase.from('global_topics').upsert(topic, { onConflict: 'topic' }).select()
    }

    // Fetch topic IDs
    const { data: topics } = await supabase
      .from('global_topics')
      .select('id, topic')
      .in('topic', QUERY_TOPICS.map(t => t.topic))

    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'Failed to create topics' }, { status: 500 })
    }

    // 3. Create sample queries
    const queriesToInsert = topics.map((topic, i) => ({
      workspace_id: workspaceId,
      topic_id: topic.id,
      name: `${topic.topic} Intent Leads`,
      status: i === 0 ? 'active' : randomElement(['active', 'active', 'paused']),
      filters: {
        location: { country: 'United States' },
        employee_range: { min: 10, max: 1000 },
        industry: null,
      },
      delivery_config: {
        email: true,
        slack: false,
        webhook: false,
      },
      created_at: randomDate(60),
      last_run_at: randomDate(7),
    }))

    const { data: queries, error: queryError } = await supabase
      .from('queries')
      .insert(queriesToInsert)
      .select('id, name')

    if (queryError) {
      console.error('Query insert error:', queryError)
      return NextResponse.json({ error: 'Failed to create queries', details: queryError.message }, { status: 500 })
    }

    // 4. Create leads
    const leadsToInsert = []
    const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
    const statusWeights = [30, 25, 20, 10, 8, 5, 2] // Weighted distribution

    function weightedRandomStatus(): string {
      const total = statusWeights.reduce((a, b) => a + b, 0)
      let random = Math.random() * total
      for (let i = 0; i < statuses.length; i++) {
        random -= statusWeights[i]
        if (random <= 0) return statuses[i]
      }
      return 'new'
    }

    for (let i = 0; i < leadCount; i++) {
      const company = randomElement(DEMO_COMPANIES)
      const firstName = randomElement(FIRST_NAMES)
      const lastName = randomElement(LAST_NAMES)
      const query = randomElement(queries || [])

      leadsToInsert.push({
        workspace_id: workspaceId,
        query_id: query?.id || null,
        company_name: company.name,
        company_domain: company.domain,
        company_industry: company.industry,
        company_location: { city: company.city, state: company.state, country: 'United States' },
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName, company.domain),
        phone: Math.random() > 0.3 ? generatePhone() : null,
        job_title: randomElement(JOB_TITLES),
        linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${randomInt(10000, 99999)}`,
        source: randomElement(['datashopper', 'csv_import', 'manual', 'api', 'clay']),
        enrichment_status: randomElement(['completed', 'completed', 'completed', 'pending']),
        delivery_status: randomElement(['delivered', 'delivered', 'pending']),
        status: weightedRandomStatus(),
        created_at: randomDate(90),
      })
    }

    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select('id, company_name, status, created_at')

    if (leadError) {
      console.error('Lead insert error:', leadError)
      return NextResponse.json({ error: 'Failed to create leads', details: leadError.message }, { status: 500 })
    }

    // 5. Create activities for leads
    const activitiesToInsert = []
    const activityTypes = ['created', 'status_change', 'note_added', 'email_sent', 'email_opened', 'call_logged', 'enriched']

    for (const lead of leads || []) {
      // Every lead gets a 'created' activity
      activitiesToInsert.push({
        lead_id: lead.id,
        workspace_id: workspaceId,
        activity_type: 'created',
        title: 'Lead created',
        description: `Lead ${lead.company_name} was added to the system`,
        metadata: { source: 'seed_data' },
        created_at: lead.created_at,
      })

      // Add random additional activities
      const activityCount = randomInt(1, 5)
      for (let j = 0; j < activityCount; j++) {
        const type = randomElement(activityTypes.filter(t => t !== 'created'))
        activitiesToInsert.push({
          lead_id: lead.id,
          workspace_id: workspaceId,
          activity_type: type,
          title: type === 'status_change' ? 'Status updated' :
                 type === 'note_added' ? 'Note added' :
                 type === 'email_sent' ? 'Email sent' :
                 type === 'email_opened' ? 'Email opened' :
                 type === 'call_logged' ? 'Call logged' :
                 type === 'enriched' ? 'Lead enriched' : 'Activity',
          description: null,
          metadata: {},
          created_at: randomDate(30),
        })
      }
    }

    // Insert activities in batches
    const activityBatchSize = 100
    for (let i = 0; i < activitiesToInsert.length; i += activityBatchSize) {
      const batch = activitiesToInsert.slice(i, i + activityBatchSize)
      await supabase.from('lead_activities').insert(batch)
    }

    // 6. Create some notes for leads
    const notesToInsert = []
    const noteContents = [
      'Had a great initial call. Very interested in our solution.',
      'Decision maker confirmed. Budget approved for Q1.',
      'Sent follow-up email with pricing details.',
      'Competitor evaluation in progress. Need to highlight our differentiators.',
      'Scheduled demo for next week.',
      'Waiting on procurement approval.',
      'Very responsive. High intent buyer.',
      'Referenced by existing customer. Warm lead.',
      'Asked about enterprise features and SLA.',
      'Integration requirements discussed. Technical fit confirmed.',
    ]

    const contactedLeads = (leads || []).filter(l => l.status !== 'new').slice(0, 30)
    for (const lead of contactedLeads) {
      const noteCount = randomInt(1, 3)
      for (let j = 0; j < noteCount; j++) {
        notesToInsert.push({
          lead_id: lead.id,
          workspace_id: workspaceId,
          content: randomElement(noteContents),
          note_type: randomElement(['note', 'call', 'email', 'meeting']),
          created_by: user.id,
          is_pinned: Math.random() > 0.9,
          created_at: randomDate(30),
          updated_at: randomDate(7),
        })
      }
    }

    if (notesToInsert.length > 0) {
      await supabase.from('lead_notes').insert(notesToInsert)
    }

    // 7. Return summary
    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      summary: {
        topics_created: topics.length,
        queries_created: queries?.length || 0,
        leads_created: leads?.length || 0,
        activities_created: activitiesToInsert.length,
        notes_created: notesToInsert.length,
      },
      queries: queries?.map(q => ({ id: q.id, name: q.name })),
    })
  } catch (error: any) {
    console.error('[Admin] Seed demo data error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
