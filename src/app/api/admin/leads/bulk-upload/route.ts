
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { parse } from 'csv-parse/sync'
import { z } from 'zod'
import { calculateIntentScore, calculateFreshnessScore, calculateMarketplacePrice } from '@/lib/services/lead-scoring.service'
import { routeLeadsToMatchingUsers } from '@/lib/services/marketplace-lead-routing'
import { queueLeadsForVerification } from '@/lib/services/email-verification.service'
import { safeError } from '@/lib/utils/log-sanitizer'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit'

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

// CSV row validation schema
const csvRowSchema = z.object({
  first_name: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/, 'Invalid first name'),
  last_name: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/, 'Invalid last name'),
  email: z.string().email().max(255),
  phone: z.string().max(20).regex(/^[\d\s\-()+.]+$/, 'Invalid phone').optional().nullable(),
  company_name: z.string().max(200).optional().nullable(),
  company_domain: z.string().max(200).optional().nullable(),
  job_title: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().length(2).toUpperCase(),
  industry: z.string().min(1).max(100),
  intent_signal: z.string().max(500).optional().nullable(),
  seniority_level: z.enum(['junior', 'mid', 'senior', 'executive', 'unknown']).optional().nullable(),
  company_size: z.string().max(50).optional().nullable(),
  company_employee_count: z.string().regex(/^\d+$/).optional().nullable(),
  utm_source: z.string().max(200).optional().nullable(),
  utm_medium: z.string().max(200).optional().nullable(),
  utm_campaign: z.string().max(200).optional().nullable(),
})

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
    const admin = await requireAdmin()

    // SECURITY: Rate limit bulk upload operations to prevent abuse
    const rateLimitKey = `admin_bulk_upload:${admin.email}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.admin_bulk_upload)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many bulk upload requests. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const adminClient = createAdminClient()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = formData.get('source') as string || 'admin_upload'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 413 }
      )
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
      safeError('[Admin Bulk Upload] CSV parsing error:', e)
      return NextResponse.json({
        success: false,
        total: 0,
        successful: 0,
        failed: 0,
        errors: ['CSV parsing error: Invalid file format. Please check your CSV file.'],
        category_summary: {},
      })
    }

    // Validate max record count to prevent DoS
    const MAX_RECORDS = 10000
    if (records.length > MAX_RECORDS) {
      return NextResponse.json(
        { error: `Too many records. Maximum ${MAX_RECORDS} records per upload.` },
        { status: 413 }
      )
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
        // Validate row with Zod schema
        const validationResult = csvRowSchema.safeParse(row)
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(e => e.message).join(', ')
          results.errors.push(`Row ${rowNum}: Validation failed - ${errors}`)
          results.failed++
          continue
        }

        const validRow = validationResult.data
        const email = validRow.email.toLowerCase().trim()

        const state = normalizeState(validRow.state)
        if (!state) {
          results.errors.push(`Row ${rowNum}: Invalid state code "${validRow.state}"`)
          results.failed++
          continue
        }

        const industry = normalizeIndustry(validRow.industry)
        if (!industry) {
          results.errors.push(`Row ${rowNum}: Invalid industry "${validRow.industry}"`)
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

        // Calculate lead score (basic) - using validated data
        const leadScore = calculateLeadScore(validRow)

        // Calculate marketplace scores with sanitized input
        const intentScore = calculateIntentScore({
          seniority_level: validRow.seniority_level || 'unknown',
          company_size: validRow.company_size || null,
          company_employee_count: validRow.company_employee_count ? Number(validRow.company_employee_count) : null,
          email: email,
          company_domain: validRow.company_domain || null,
          phone: validRow.phone || null,
          first_name: validRow.first_name,
          last_name: validRow.last_name,
          city: validRow.city || null,
          state: state,
          job_title: validRow.job_title || null,
        })

        const freshnessScore = calculateFreshnessScore(new Date())
        const marketplacePrice = calculateMarketplacePrice({
          intentScore: intentScore.score,
          freshnessScore,
          hasPhone: !!validRow.phone,
          verificationStatus: 'pending',
        })

        const fullName = [validRow.first_name, validRow.last_name].filter(Boolean).join(' ')

        // Insert lead as marketplace lead using admin client
        const { data: insertedLead, error: insertError } = await adminClient.from('leads').insert({
          workspace_id: null,
          is_marketplace_listed: true,
          marketplace_status: 'available',
          source: source,
          first_name: validRow.first_name,
          last_name: validRow.last_name,
          full_name: fullName,
          email: email,
          phone: validRow.phone || null,
          company_name: validRow.company_name || `${validRow.first_name}'s Company`,
          company_domain: validRow.company_domain || null,
          company_industry: industry,
          job_title: validRow.job_title || null,
          city: validRow.city || null,
          state: state,
          state_code: state,
          country: 'US',
          country_code: 'US',
          intent_signal: validRow.intent_signal || null,
          lead_score: leadScore,
          intent_score_calculated: intentScore.score,
          freshness_score: freshnessScore,
          marketplace_price: marketplacePrice,
          utm_source: validRow.utm_source || null,
          utm_medium: validRow.utm_medium || null,
          utm_campaign: validRow.utm_campaign || null,
          enrichment_status: 'pending',
          delivery_status: 'pending',
        } as any).select('id').maybeSingle()

        if (insertError) {
          safeError(`[Admin Bulk Upload] Row ${rowNum} insert error:`, insertError)
          results.errors.push(`Row ${rowNum}: Failed to insert lead`)
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
        safeError('[Bulk Upload] Row error:', e)
        results.errors.push(`Row ${rowNum}: Failed to process`)
        results.failed++
      }
    }

    safeError(`[Admin Bulk Upload] ${results.successful} marketplace leads created, ${results.skipped_duplicates} duplicates skipped`)

    // Route newly created leads to matching users
    let routingStats = { routed: 0, notified: 0 }
    if (insertedLeadIds.length > 0) {
      routingStats = await routeLeadsToMatchingUsers(insertedLeadIds, { source: 'admin_upload' })
      safeError(`[Admin Bulk Upload] Routed ${routingStats.routed} leads to matching users`)

      // Queue all inserted leads for async email verification (high priority)
      queueLeadsForVerification(insertedLeadIds, 1).catch(err => {
        safeError('[Admin Bulk Upload] Failed to queue verification:', err)
      })
    }

    return NextResponse.json({
      success: results.failed === 0,
      ...results,
      routing: routingStats,
    })

  } catch (error: any) {
    safeError('[Admin Bulk Upload] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
