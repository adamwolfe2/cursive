export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { parse } from 'csv-parse/sync'
import { calculateIntentScore, calculateFreshnessScore, calculateMarketplacePrice } from '@/lib/services/lead-scoring.service'
import { routeLeadsToMatchingUsers } from '@/lib/services/marketplace-lead-routing'

// Industry mapping
const INDUSTRY_MAP: Record<string, string> = {
  hvac: 'HVAC',
  roofing: 'Roofing',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  solar: 'Solar',
  'real estate': 'Real Estate',
  'real_estate': 'Real Estate',
  realestate: 'Real Estate',
  insurance: 'Insurance',
  'home services': 'Home Services',
  'home_services': 'Home Services',
  landscaping: 'Landscaping',
  'pest control': 'Pest Control',
  'pest_control': 'Pest Control',
  cleaning: 'Cleaning Services',
  'cleaning services': 'Cleaning Services',
  auto: 'Auto Services',
  'auto services': 'Auto Services',
  legal: 'Legal Services',
  'legal services': 'Legal Services',
  financial: 'Financial Services',
  'financial services': 'Financial Services',
  healthcare: 'Healthcare',
}

// Valid US state codes
const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

function normalizeIndustry(industry: string): string | null {
  const normalized = industry?.toLowerCase().trim()
  return INDUSTRY_MAP[normalized] || null
}

function normalizeState(state: string): string | null {
  const normalized = state?.toUpperCase().trim()
  return VALID_STATES.includes(normalized) ? normalized : null
}

function calculateLeadScore(lead: any): number {
  let score = 50 // Base score

  // Intent signal strength
  if (lead.intent_signal?.length > 20) score += 15
  if (lead.intent_signal?.toLowerCase().includes('urgent')) score += 10
  if (lead.intent_signal?.toLowerCase().includes('need')) score += 5

  // Contact completeness
  if (lead.email) score += 10
  if (lead.phone) score += 10

  // Location completeness
  if (lead.city) score += 5
  if (lead.zip) score += 5

  return Math.min(100, score)
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization (throws if not admin)
    await requireAdmin()

    const adminClient = createAdminClient()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = formData.get('source') as string || 'admin_upload'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parse CSV
    const csvContent = await file.text()
    let records: any[]

    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        total: 0,
        successful: 0,
        failed: 0,
        errors: [`CSV parsing error: ${e.message}`],
        category_summary: {},
      })
    }

    // Collect all emails for batch deduplication check
    const emailsToCheck = records
      .map((row: any) => row.email?.toLowerCase().trim())
      .filter(Boolean) as string[]

    // Batch check: find existing marketplace leads (workspace_id IS NULL) with these emails
    const existingEmails = new Set<string>()
    if (emailsToCheck.length > 0) {
      const { data: existingLeads } = await adminClient
        .from('leads')
        .select('email')
        .is('workspace_id', null)
        .in('email', emailsToCheck)

      if (existingLeads) {
        for (const lead of existingLeads) {
          if (lead.email) existingEmails.add(lead.email.toLowerCase())
        }
      }
    }

    // Process leads
    const results = {
      total: records.length,
      successful: 0,
      failed: 0,
      skipped_duplicates: 0,
      errors: [] as string[],
      category_summary: {} as Record<string, number>,
    }
    const insertedLeadIds: string[] = []

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNum = i + 2 // Account for header row

      try {
        // Validate required fields
        if (!row.first_name || !row.last_name) {
          results.errors.push(`Row ${rowNum}: Missing first_name or last_name`)
          results.failed++
          continue
        }

        if (!row.email) {
          results.errors.push(`Row ${rowNum}: Missing email`)
          results.failed++
          continue
        }

        const email = row.email.toLowerCase().trim()

        const state = normalizeState(row.state)
        if (!state) {
          results.errors.push(`Row ${rowNum}: Invalid state code "${row.state}"`)
          results.failed++
          continue
        }

        const industry = normalizeIndustry(row.industry)
        if (!industry) {
          results.errors.push(`Row ${rowNum}: Invalid industry "${row.industry}"`)
          results.failed++
          continue
        }

        // Deduplicate: skip if a marketplace lead with this email already exists,
        // or if we already saw this email earlier in the current batch
        if (existingEmails.has(email)) {
          results.skipped_duplicates++
          results.errors.push(`Row ${rowNum}: Duplicate email "${email}" (already exists or seen in batch)`)
          results.failed++
          continue
        }

        // Mark email as seen for in-batch dedup
        existingEmails.add(email)

        // Calculate lead score (basic)
        const leadScore = calculateLeadScore(row)

        // Calculate marketplace scores
        const intentScore = calculateIntentScore({
          seniority_level: row.seniority_level || 'unknown',
          company_size: row.company_size || null,
          company_employee_count: row.company_employee_count ? Number(row.company_employee_count) : null,
          email: email,
          company_domain: row.company_domain || null,
          phone: row.phone || null,
          first_name: row.first_name,
          last_name: row.last_name,
          city: row.city || null,
          state: state,
          job_title: row.job_title || null,
        })

        const freshnessScore = calculateFreshnessScore(new Date())
        const marketplacePrice = calculateMarketplacePrice({
          intentScore: intentScore.score,
          freshnessScore,
          hasPhone: !!row.phone,
          verificationStatus: 'pending',
        })

        const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ')

        // Insert lead as marketplace lead using admin client
        const { data: insertedLead, error: insertError } = await adminClient.from('leads').insert({
          workspace_id: null,
          is_marketplace_listed: true,
          marketplace_status: 'available',
          source: source,
          first_name: row.first_name,
          last_name: row.last_name,
          full_name: fullName,
          email: email,
          phone: row.phone || null,
          company_name: row.company_name || `${row.first_name}'s Company`,
          company_domain: row.company_domain || null,
          company_industry: industry,
          job_title: row.job_title || null,
          city: row.city || null,
          state: state,
          state_code: state,
          country: 'US',
          country_code: 'US',
          intent_signal: row.intent_signal || null,
          lead_score: leadScore,
          intent_score_calculated: intentScore.score,
          freshness_score: freshnessScore,
          marketplace_price: marketplacePrice,
          utm_source: row.utm_source || null,
          utm_medium: row.utm_medium || null,
          utm_campaign: row.utm_campaign || null,
          enrichment_status: 'pending',
          delivery_status: 'pending',
        } as any).select('id').single()

        if (insertError) {
          results.errors.push(`Row ${rowNum}: ${insertError.message}`)
          results.failed++
          continue
        }

        if (insertedLead) {
          insertedLeadIds.push(insertedLead.id)
        }

        results.successful++

        // Track category summary by industry + state
        const categoryKey = `${industry} - ${state}`
        results.category_summary[categoryKey] = (results.category_summary[categoryKey] || 0) + 1

      } catch (e: any) {
        console.error('[Bulk Upload] Row error:', e)
        results.errors.push(`Row ${rowNum}: Failed to process`)
        results.failed++
      }
    }

    console.log(`[Admin Bulk Upload] ${results.successful} marketplace leads created, ${results.skipped_duplicates} duplicates skipped`)

    // Route newly created leads to matching users
    let routingStats = { routed: 0, notified: 0 }
    if (insertedLeadIds.length > 0) {
      routingStats = await routeLeadsToMatchingUsers(insertedLeadIds, { source: 'admin_upload' })
      console.log(`[Admin Bulk Upload] Routed ${routingStats.routed} leads to matching users`)
    }

    return NextResponse.json({
      success: results.failed === 0,
      ...results,
      routing: routingStats,
    })

  } catch (error: any) {
    console.error('[Admin Bulk Upload] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
