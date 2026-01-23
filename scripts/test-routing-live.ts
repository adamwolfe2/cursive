#!/usr/bin/env tsx
/**
 * Live Routing Test Script
 *
 * Tests the routing system with real database:
 * 1. Creates test workspace for Healthcare
 * 2. Creates routing rule: Healthcare vertical, California state
 * 3. Inserts 3 test leads
 * 4. Routes each lead and shows results
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface TestLead {
  company_name: string
  company_industry: string | null
  company_location: { state: string | null; country: string }
  expected_routing: string
}

async function main() {
  console.log('🚀 Starting Live Routing Test\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  // Step 1: Create test workspace
  console.log('📦 Step 1: Creating test Healthcare workspace...')

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name: 'Healthcare Test Workspace',
      slug: 'healthcare-test',
      industry_vertical: 'Healthcare',
      subdomain: 'healthcare-test',
      allowed_industries: ['Healthcare', 'Medical Spa', 'Wellness', 'Dental'],
      allowed_regions: []
    })
    .select()
    .single()

  if (workspaceError) {
    console.error('❌ Failed to create workspace:', workspaceError.message)
    process.exit(1)
  }

  console.log(`✅ Created workspace: ${workspace.name} (${workspace.id})\n`)

  // Step 2: Create routing rule
  console.log('📋 Step 2: Creating routing rule...')
  console.log('   Rule: Healthcare industry + California state → Healthcare workspace')

  const { data: rule, error: ruleError } = await supabase
    .from('lead_routing_rules')
    .insert({
      workspace_id: workspace.id,
      rule_name: 'Healthcare California Rule',
      priority: 100,
      is_active: true,
      destination_workspace_id: workspace.id,
      conditions: {
        industries: ['Healthcare', 'Medical Spa', 'Wellness', 'Dental'],
        us_states: ['CA'],
        company_sizes: [],
        revenue_ranges: [],
        countries: ['US'],
        regions: []
      },
      actions: {
        assign_to_workspace: true,
        notify_via: ['email'],
        tag_with: ['healthcare', 'california']
      }
    })
    .select()
    .single()

  if (ruleError) {
    console.error('❌ Failed to create rule:', ruleError.message)
    await cleanup(workspace.id)
    process.exit(1)
  }

  console.log(`✅ Created rule: ${rule.rule_name} (Priority ${rule.priority})\n`)

  // Step 3: Create test leads
  console.log('📝 Step 3: Creating 3 test leads...\n')

  const testLeads: TestLead[] = [
    {
      company_name: 'Glow Medical Spa',
      company_industry: 'Medical Spa',
      company_location: { state: 'CA', country: 'US' },
      expected_routing: 'Healthcare workspace (matches rule)'
    },
    {
      company_name: 'Texas Wellness Center',
      company_industry: 'Wellness',
      company_location: { state: 'TX', country: 'US' },
      expected_routing: 'Unmatched (wrong state)'
    },
    {
      company_name: 'California Law Firm',
      company_industry: 'Legal Services',
      company_location: { state: 'CA', country: 'US' },
      expected_routing: 'Unmatched (wrong industry)'
    }
  ]

  const results: Array<{
    lead: TestLead
    leadId: string
    actualWorkspace: string
    ruleMatched: string | null
    correct: boolean
  }> = []

  for (const testLead of testLeads) {
    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspace.id, // Start in source workspace
        query_id: null,
        company_name: testLead.company_name,
        company_industry: testLead.company_industry,
        company_location: testLead.company_location,
        email: `test@${testLead.company_name.toLowerCase().replace(/\s+/g, '')}.com`,
        source: 'manual',
        enrichment_status: 'pending',
        delivery_status: 'pending'
      })
      .select()
      .single()

    if (leadError) {
      console.error(`❌ Failed to create lead: ${testLead.company_name}`)
      console.error(leadError.message)
      continue
    }

    // Route the lead
    const { data: routedWorkspaceId, error: routeError } = await supabase
      .rpc('route_lead_to_workspace', {
        p_lead_id: lead.id,
        p_source_workspace_id: workspace.id
      })

    if (routeError) {
      console.error(`❌ Failed to route lead: ${testLead.company_name}`)
      console.error(routeError.message)
      continue
    }

    // Fetch updated lead to see routing metadata
    const { data: updatedLead } = await supabase
      .from('leads')
      .select('*, lead_routing_rules(rule_name)')
      .eq('id', lead.id)
      .single()

    const actualWorkspaceId = updatedLead?.workspace_id || workspace.id
    const ruleMatched = updatedLead?.lead_routing_rules?.rule_name || null

    // Determine if routing was correct
    // Rule requires: (Medical Spa OR Wellness) AND CA state
    const industryMatches = testLead.company_industry === 'Medical Spa' || testLead.company_industry === 'Wellness'
    const stateMatches = testLead.company_location.state === 'CA'
    const shouldMatch = industryMatches && stateMatches
    const didMatch = ruleMatched !== null
    const correct = shouldMatch === didMatch

    results.push({
      lead: testLead,
      leadId: lead.id,
      actualWorkspace: actualWorkspaceId === workspace.id ? workspace.name : 'Unmatched',
      ruleMatched,
      correct
    })

    console.log(`   ${correct ? '✅' : '❌'} ${testLead.company_name}`)
    console.log(`      Industry: ${testLead.company_industry}`)
    console.log(`      Location: ${testLead.company_location.state}, ${testLead.company_location.country}`)
    console.log(`      Routed to: ${actualWorkspaceId === workspace.id ? workspace.name : 'Unmatched'}`)
    console.log(`      Rule matched: ${ruleMatched || 'None'}`)
    console.log(`      Expected: ${testLead.expected_routing}`)
    console.log('')
  }

  // Step 4: Show results
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log('📊 ROUTING TEST RESULTS\n')
  console.log('═══════════════════════════════════════════════════════════\n')

  const correctCount = results.filter(r => r.correct).length
  const totalCount = results.length
  const accuracy = (correctCount / totalCount) * 100

  console.log(`Total Leads Tested:    ${totalCount}`)
  console.log(`Correct Routing:       ${correctCount} ✅`)
  console.log(`Incorrect Routing:     ${totalCount - correctCount} ❌`)
  console.log(`Accuracy:              ${accuracy.toFixed(0)}%\n`)

  console.log('Lead Details:')
  console.log('─────────────────────────────────────────────────────────\n')

  results.forEach((result, index) => {
    const status = result.correct ? '✅' : '❌'
    console.log(`${index + 1}. ${status} ${result.lead.company_name}`)
    console.log(`   Industry: ${result.lead.company_industry || 'N/A'}`)
    console.log(`   State: ${result.lead.company_location.state || 'N/A'}`)
    console.log(`   → Routed to: ${result.actualWorkspace}`)
    console.log(`   → Rule: ${result.ruleMatched || 'No rule matched'}`)
    console.log(`   → Expected: ${result.lead.expected_routing}`)
    console.log('')
  })

  console.log('═══════════════════════════════════════════════════════════\n')

  // Step 5: Cleanup
  console.log('🧹 Step 5: Cleaning up test data...')
  await cleanup(workspace.id)
  console.log('✅ Cleanup complete\n')

  console.log('═══════════════════════════════════════════════════════════')
  console.log(`${accuracy === 100 ? '🎉' : '⚠️'} Test ${accuracy === 100 ? 'PASSED' : 'FAILED'} - ${accuracy.toFixed(0)}% accuracy`)
  console.log('═══════════════════════════════════════════════════════════\n')

  process.exit(accuracy === 100 ? 0 : 1)
}

async function cleanup(workspaceId: string) {
  // Delete leads (cascades to related records)
  await supabase
    .from('leads')
    .delete()
    .eq('workspace_id', workspaceId)

  // Delete routing rules
  await supabase
    .from('lead_routing_rules')
    .delete()
    .eq('workspace_id', workspaceId)

  // Delete workspace
  await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
}

main().catch((error) => {
  console.error('❌ Test failed with error:', error)
  process.exit(1)
})
