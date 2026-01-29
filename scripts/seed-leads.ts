/**
 * Seed Test Leads Script
 *
 * Creates workspaces, routing rules, and 500+ test leads
 * Run with: pnpm seed:leads
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.types'
import { generateAllTestLeads, type GeneratedLead } from './generate-test-leads'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Prefer': 'return=representation',
    },
  },
})

// ============================================================================
// WORKSPACE DATA
// ============================================================================

const WORKSPACES = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Healthcare/Med Spas Marketplace',
    slug: 'healthcare',
    subdomain: 'healthcare',
    industry_vertical: 'Healthcare',
    onboarding_status: 'completed',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Home Services/HVAC Marketplace',
    slug: 'hvac',
    subdomain: 'hvac',
    industry_vertical: 'HVAC',
    onboarding_status: 'completed',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Door-to-Door Sales Marketplace',
    slug: 'solar',
    subdomain: 'solar',
    industry_vertical: 'Solar',
    onboarding_status: 'completed',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Default Workspace (Unmatched Leads)',
    slug: 'default',
    subdomain: 'default',
    industry_vertical: 'General',
    onboarding_status: 'completed',
  },
]

// ============================================================================
// ROUTING RULES DATA
// ============================================================================

const ROUTING_RULES = [
  // Healthcare - High Demand States (Priority 100)
  {
    id: '10000000-0000-0000-0000-000000000001',
    workspace_id: '00000000-0000-0000-0000-000000000001', // Master (we'll use healthcare as master for demo)
    rule_name: 'Healthcare - High Demand States',
    priority: 100,
    is_active: true,
    destination_workspace_id: '00000000-0000-0000-0000-000000000001',
    conditions: {
      industries: ['Healthcare', 'Medical Spa', 'Dental'],
      us_states: ['CA', 'TX', 'FL'],
      countries: ['US'],
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['healthcare', 'high-demand'],
    },
  },

  // Healthcare - All Other States (Priority 90)
  {
    id: '10000000-0000-0000-0000-000000000002',
    workspace_id: '00000000-0000-0000-0000-000000000001',
    rule_name: 'Healthcare - All Other States',
    priority: 90,
    is_active: true,
    destination_workspace_id: '00000000-0000-0000-0000-000000000001',
    conditions: {
      industries: ['Healthcare', 'Medical Spa', 'Dental'],
      us_states: [],
      countries: ['US'],
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['healthcare'],
    },
  },

  // Door-to-Door - Pacific Northwest (Priority 100)
  {
    id: '10000000-0000-0000-0000-000000000003',
    workspace_id: '00000000-0000-0000-0000-000000000003',
    rule_name: 'Door-to-Door - Pacific Northwest',
    priority: 100,
    is_active: true,
    destination_workspace_id: '00000000-0000-0000-0000-000000000003',
    conditions: {
      industries: ['Solar', 'Roofing', 'Security Systems'],
      us_states: ['WA', 'OR'],
      countries: ['US'],
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['door-to-door', 'pnw'],
    },
  },

  // Door-to-Door - West Region (Priority 80)
  {
    id: '10000000-0000-0000-0000-000000000004',
    workspace_id: '00000000-0000-0000-0000-000000000003',
    rule_name: 'Door-to-Door - West Region',
    priority: 80,
    is_active: true,
    destination_workspace_id: '00000000-0000-0000-0000-000000000003',
    conditions: {
      industries: ['Solar', 'Roofing', 'Security Systems'],
      us_states: ['CA', 'AZ', 'NV', 'CO', 'UT', 'NM', 'ID'],
      countries: ['US'],
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['door-to-door', 'west'],
    },
  },

  // HVAC - Midwest + South (Priority 100)
  {
    id: '10000000-0000-0000-0000-000000000005',
    workspace_id: '00000000-0000-0000-0000-000000000002',
    rule_name: 'HVAC - Midwest + South',
    priority: 100,
    is_active: true,
    destination_workspace_id: '00000000-0000-0000-0000-000000000002',
    conditions: {
      industries: ['HVAC', 'Plumbing'],
      us_states: ['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'MO', 'GA', 'NC', 'VA', 'TN', 'AL', 'LA', 'SC', 'KY'],
      countries: ['US'],
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['hvac', 'priority'],
    },
  },

  // HVAC - Other States (Priority 80)
  {
    id: '10000000-0000-0000-0000-000000000006',
    workspace_id: '00000000-0000-0000-0000-000000000002',
    rule_name: 'HVAC - Other States',
    priority: 80,
    is_active: true,
    destination_workspace_id: '00000000-0000-0000-0000-000000000002',
    conditions: {
      industries: ['HVAC', 'Plumbing'],
      us_states: [],
      countries: ['US'],
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['hvac'],
    },
  },
]

// ============================================================================
// ROUTING LOGIC (Simplified from routing service)
// ============================================================================

function matchLeadToWorkspace(lead: GeneratedLead): string {
  const industry = lead.company_industry
  const state = lead.state_code

  // Find matching rule (sorted by priority)
  const sortedRules = [...ROUTING_RULES].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    const conditions = rule.conditions

    // Check industry match
    const industryMatch = conditions.industries.length === 0 ||
      conditions.industries.some((i) => industry.includes(i) || i.includes(industry))

    if (!industryMatch) continue

    // Check state match
    const stateMatch = conditions.us_states.length === 0 ||
      conditions.us_states.includes(state!)

    if (stateMatch) {
      return rule.destination_workspace_id
    }
  }

  // Default workspace if no match
  return '00000000-0000-0000-0000-000000000004'
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function clearExistingData() {
  console.log('\n🗑️  Clearing existing test data...')

  // First, check total leads in database
  const { data: allLeads, count: totalCount, error: countError } = await supabase
    .from('leads')
    .select('id, workspace_id, source, hash_key', { count: 'exact' })
    .limit(10)

  if (countError) {
    console.error('   ⚠️  Error counting leads:', countError.message)
  } else {
    console.log(`   Database has ${totalCount || 0} total leads`)
    if (allLeads && allLeads.length > 0) {
      console.log(`   Sample leads:`)
      allLeads.slice(0, 3).forEach((lead, i) => {
        console.log(`     ${i + 1}. workspace=${lead.workspace_id?.substring(0, 8)}..., source=${lead.source || 'null'}, hash=${lead.hash_key?.substring(0, 16)}...`)
      })
    }
  }

  // Delete ALL leads with source='test-seed' (most aggressive cleanup)
  const { error: testLeadsError, count: deletedCount } = await supabase
    .from('leads')
    .delete({ count: 'exact' })
    .eq('source', 'test-seed')

  if (testLeadsError) {
    console.error('   ⚠️  Error deleting test leads:', testLeadsError.message)
  } else if (deletedCount && deletedCount > 0) {
    console.log(`   ✓ Deleted ${deletedCount} test seed leads`)
  }

  // Delete routing rules FIRST (before workspaces, due to foreign keys)
  const { error: rulesError } = await supabase
    .from('lead_routing_rules')
    .delete()
    .in('id', ROUTING_RULES.map((r) => r.id))

  if (rulesError) {
    console.error('   ⚠️  Error deleting routing rules:', rulesError.message)
  } else {
    console.log('   ✓ Cleared existing routing rules')
  }

  // Delete workspaces by ID (this should CASCADE delete all leads in those workspaces)
  const { error: workspacesError } = await supabase
    .from('workspaces')
    .delete()
    .in('id', WORKSPACES.map((w) => w.id))

  if (workspacesError) {
    console.error('   ⚠️  Error deleting workspaces by ID:', workspacesError.message)
  } else {
    console.log('   ✓ Cleared existing workspaces by ID')
  }

  // Also delete by slug to handle any duplicates
  const { error: workspaceSlugError } = await supabase
    .from('workspaces')
    .delete()
    .in('slug', WORKSPACES.map((w) => w.slug))

  if (workspaceSlugError) {
    console.error('   ⚠️  Error deleting workspaces by slug:', workspaceSlugError.message)
  } else {
    console.log('   ✓ Cleared existing workspaces by slug')
  }

  // Double-check: delete any orphaned leads from test workspaces that CASCADE didn't catch
  const { error: leadsError, count: workspaceLeadsCount } = await supabase
    .from('leads')
    .delete({ count: 'exact' })
    .in('workspace_id', WORKSPACES.map((w) => w.id))

  if (leadsError) {
    console.error('   ⚠️  Error deleting leads by workspace:', leadsError.message)
  } else if (workspaceLeadsCount && workspaceLeadsCount > 0) {
    console.log(`   ✓ Deleted ${workspaceLeadsCount} orphaned leads from test workspaces`)
  }

  // Verify cleanup
  const { count: remainingTestLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'test-seed')

  const { count: remainingWorkspaceLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .in('workspace_id', WORKSPACES.map((w) => w.id))

  if ((remainingTestLeads && remainingTestLeads > 0) || (remainingWorkspaceLeads && remainingWorkspaceLeads > 0)) {
    console.warn(`   ⚠️  Warning: ${remainingTestLeads || 0} test leads and ${remainingWorkspaceLeads || 0} workspace leads still remain`)
  } else {
    console.log('   ✓ Verified all test data deleted')
  }

  console.log('✅ Cleared existing data\n')
}

async function seedWorkspaces() {
  console.log('🏢 Creating test workspaces...')

  const { data, error } = await supabase
    .from('workspaces')
    .insert(WORKSPACES as any)
    .select()

  if (error) {
    console.error('❌ Error creating workspaces:', error.message)
    throw error
  }

  console.log(`✅ Created ${data.length} workspaces\n`)
  return data
}

async function seedRoutingRules() {
  console.log('📋 Creating routing rules...')

  const { data, error } = await supabase
    .from('lead_routing_rules')
    .insert(ROUTING_RULES as any)
    .select()

  if (error) {
    console.error('❌ Error creating routing rules:', error.message)
    throw error
  }

  console.log(`✅ Created ${data.length} routing rules\n`)
  return data
}

async function seedLeads() {
  console.log('👥 Generating and inserting test leads...\n')

  // Generate all leads
  const generatedLeads = generateAllTestLeads()

  console.log('📍 Routing leads to workspaces...')

  // Convert to database format with routing
  const crypto = require('crypto')
  const leadsToInsert = generatedLeads.map((lead, index) => {
    const workspaceId = matchLeadToWorkspace(lead)
    const createdAt = new Date(Date.now() - lead.days_old * 24 * 60 * 60 * 1000).toISOString()

    // Generate a truly unique hash_key using randomBytes
    const hash_key = crypto.randomBytes(32).toString('hex')

    return {
      workspace_id: workspaceId,
      company_name: lead.company_name,
      company_industry: lead.company_industry,
      source: lead.source,
      enrichment_status: lead.enrichment_status,
      delivery_status: lead.delivery_status,
      status: lead.status,

      email: lead.email,
      first_name: lead.first_name,
      last_name: lead.last_name,
      full_name: lead.full_name,
      job_title: lead.job_title,
      phone: lead.phone,
      linkedin_url: lead.linkedin_url,

      company_domain: lead.company_domain,
      company_size: lead.company_size,
      company_employee_count: lead.company_employee_count,
      company_website: lead.company_website,
      company_description: lead.company_description,

      city: lead.city,
      state: lead.state,
      state_code: lead.state_code,
      country: lead.country,
      country_code: lead.country_code,

      intent_score: lead.intent_score,
      intent_signals: lead.intent_signals,

      hash_key,
      created_at: createdAt,
    }
  })

  console.log(`   ✓ Routed ${leadsToInsert.length} leads\n`)

  // Check for duplicate hash_keys in our generated leads
  const hashKeys = leadsToInsert.map((l) => l.hash_key)
  const uniqueHashKeys = new Set(hashKeys)
  if (hashKeys.length !== uniqueHashKeys.size) {
    console.error(`   ⚠️  WARNING: Generated ${hashKeys.length - uniqueHashKeys.size} duplicate hash_keys!`)
    // Find duplicates
    const seen = new Set()
    const duplicates = hashKeys.filter((h) => {
      if (seen.has(h)) return true
      seen.add(h)
      return false
    })
    console.error(`   Duplicate hash_keys: ${duplicates.slice(0, 3).join(', ')}`)
  } else {
    console.log(`   ✓ All ${uniqueHashKeys.size} hash_keys are unique`)
  }

  // Insert in batches of 100
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < leadsToInsert.length; i += batchSize) {
    const batch = leadsToInsert.slice(i, i + batchSize)

    // Temporarily omit intent_score and intent_signals due to schema cache issue
    const batchWithoutIntentFields = batch.map(({ intent_score, intent_signals, ...rest }) => rest)

    // Try inserting each lead individually to identify which one has the conflict
    let batchInserted = 0
    const errors: any[] = []

    for (const leadData of batchWithoutIntentFields) {
      const { error: leadError } = await supabase
        .from('leads')
        .insert([leadData] as any)

      if (leadError) {
        // If it's a duplicate, regenerate hash_key and try again
        if (leadError.code === '23505' && leadError.message.includes('hash_key')) {
          const crypto = require('crypto')
          const newHashKey = crypto.randomBytes(32).toString('hex')
          const { error: retryError } = await supabase
            .from('leads')
            .insert([{ ...leadData, hash_key: newHashKey }] as any)

          if (retryError) {
            errors.push({ lead: leadData.company_name, error: retryError.message })
          } else {
            batchInserted++
          }
        } else {
          errors.push({ lead: leadData.company_name, error: leadError.message })
        }
      } else {
        batchInserted++
      }
    }

    if (errors.length > 0 && errors.length === batchWithoutIntentFields.length) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, errors[0].error)
      throw new Error(errors[0].error)
    }

    inserted += batchInserted
    if (errors.length > 0) {
      console.log(`   ⚠️  Inserted ${batchInserted}/${batch.length} leads (${errors.length} skipped due to errors)`)
    } else {
      console.log(`   ✓ Inserted ${inserted}/${leadsToInsert.length} leads...`)
    }
  }

  console.log(`\n✅ Inserted ${inserted} leads total\n`)

  // Show distribution by workspace
  const workspaceDistribution = leadsToInsert.reduce((acc, lead) => {
    acc[lead.workspace_id] = (acc[lead.workspace_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('📊 Distribution by workspace:')
  for (const [workspaceId, count] of Object.entries(workspaceDistribution)) {
    const workspace = WORKSPACES.find((w) => w.id === workspaceId)
    console.log(`   • ${workspace?.name}: ${count} leads`)
  }
  console.log()

  return inserted
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('         SEED TEST LEADS - PHASE 1: LEAD DATA')
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    // Step 1: Clear existing data
    await clearExistingData()

    // Step 2: Create workspaces
    await seedWorkspaces()

    // Step 3: Create routing rules
    await seedRoutingRules()

    // Step 4: Generate and insert leads
    await seedLeads()

    console.log('═══════════════════════════════════════════════════════')
    console.log('                  ✅ SEEDING COMPLETE!')
    console.log('═══════════════════════════════════════════════════════\n')
    console.log('Next steps:')
    console.log('  1. Go to: https://leads.meetcursive.com/crm/leads')
    console.log('  2. Log in with: adam@meetcursive.com')
    console.log('  3. View the seeded leads in the CRM')
    console.log('  4. Test filtering, sorting, search')
    console.log('  5. Move to Phase 2: Build Marketplace\n')

  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { main as seedLeads }
