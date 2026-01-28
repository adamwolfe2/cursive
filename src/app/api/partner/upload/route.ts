import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parse } from 'csv-parse/sync'
import { z } from 'zod'
import {
  calculateHashKey,
  batchCheckDuplicates,
  handleSamePartnerDuplicate,
  storeRejectionLog,
  RejectionReason,
  type RejectionLogEntry,
} from '@/lib/services/deduplication.service'
import { calculateIntentScore, calculateFreshnessScore, calculateMarketplacePrice } from '@/lib/services/lead-scoring.service'

// Input validation for lead data
const leadSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional().nullable(),
  company_name: z.string().max(200).optional().nullable(),
  company_domain: z.string().max(200).optional().nullable(),
  job_title: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50),
  industry: z.string().max(100),
  seniority_level: z.enum(['c_suite', 'vp', 'director', 'manager', 'ic', 'unknown']).optional().nullable(),
  company_size: z.string().max(50).optional().nullable(),
  company_employee_count: z.coerce.number().optional().nullable(),
  intent_signal: z.string().max(500).optional().nullable(),
  utm_source: z.string().max(100).optional().nullable(),
})

// Industry mapping
const INDUSTRY_MAP: Record<string, string> = {
  hvac: 'HVAC',
  roofing: 'Roofing',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  solar: 'Solar',
  'real estate': 'Real Estate',
  real_estate: 'Real Estate',
  realestate: 'Real Estate',
  insurance: 'Insurance',
  landscaping: 'Landscaping',
  'pest control': 'Pest Control',
  cleaning: 'Cleaning Services',
  auto: 'Auto Services',
  legal: 'Legal Services',
  financial: 'Financial Services',
  healthcare: 'Healthcare',
  technology: 'Technology',
  manufacturing: 'Manufacturing',
  retail: 'Retail',
  construction: 'Construction',
  education: 'Education',
  hospitality: 'Hospitality',
  transportation: 'Transportation',
  utilities: 'Utilities',
  telecommunications: 'Telecommunications',
  media: 'Media & Entertainment',
  government: 'Government',
  nonprofit: 'Non-Profit',
  professional_services: 'Professional Services',
  consulting: 'Consulting',
}

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

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()

  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const supabase = await createClient()

    // Validate partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, name, payout_rate, is_active, status')
      .eq('api_key', apiKey)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (!partner.is_active || partner.status === 'suspended') {
      return NextResponse.json({ error: 'Partner account is suspended' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parse CSV
    const csvContent = await file.text()
    let records: Record<string, string>[]

    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown parse error'
      return NextResponse.json({
        success: false,
        error: `CSV parsing error: ${message}`,
      }, { status: 400 })
    }

    if (records.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'CSV file is empty',
      }, { status: 400 })
    }

    // Create upload batch record
    const { data: uploadBatch, error: batchError } = await adminClient
      .from('partner_upload_batches')
      .insert({
        partner_id: partner.id,
        file_name: file.name,
        file_size_bytes: file.size,
        file_type: file.type || 'text/csv',
        total_rows: records.length,
        status: 'validating',
        detected_columns: Object.keys(records[0] || {}),
      })
      .select('id')
      .single()

    if (batchError) {
      console.error('Failed to create upload batch:', batchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create upload batch',
      }, { status: 500 })
    }

    const batchId = uploadBatch.id

    // Pre-process leads for batch duplicate check
    const leadsToCheck = records.map((row, index) => ({
      index,
      email: row.email?.toLowerCase().trim() || '',
      companyDomain: row.company_domain?.toLowerCase().trim() || null,
      phone: row.phone || null,
    })).filter(l => l.email)

    // Batch check for duplicates
    const duplicateResults = await batchCheckDuplicates(
      leadsToCheck,
      partner.id
    )

    // Process leads
    const results = {
      total: records.length,
      successful: 0,
      failed: 0,
      duplicates_same_partner: 0,
      duplicates_cross_partner: 0,
      duplicates_platform_owned: 0,
      validation_errors: 0,
    }
    const rejections: RejectionLogEntry[] = []
    const leadsToInsert: Record<string, unknown>[] = []

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNum = i + 2 // Account for header row

      try {
        // Validate input with Zod schema
        const parseResult = leadSchema.safeParse(row)
        if (!parseResult.success) {
          const errorMessage = parseResult.error.issues[0]?.message || 'validation failed'
          rejections.push({
            rowNumber: rowNum,
            reason: RejectionReason.VALIDATION_ERROR,
            field: parseResult.error.issues[0]?.path.join('.'),
            value: String(row[parseResult.error.issues[0]?.path[0] as string] || '').slice(0, 100),
            message: errorMessage,
          })
          results.failed++
          results.validation_errors++
          continue
        }

        const validatedRow = parseResult.data

        // Validate state
        const state = normalizeState(validatedRow.state)
        if (!state) {
          rejections.push({
            rowNumber: rowNum,
            reason: RejectionReason.INVALID_STATE,
            field: 'state',
            value: validatedRow.state,
            message: `Invalid state: ${validatedRow.state}`,
          })
          results.failed++
          results.validation_errors++
          continue
        }

        // Validate industry
        const industry = normalizeIndustry(validatedRow.industry)
        if (!industry) {
          rejections.push({
            rowNumber: rowNum,
            reason: RejectionReason.INVALID_INDUSTRY,
            field: 'industry',
            value: validatedRow.industry,
            message: `Invalid industry: ${validatedRow.industry}`,
          })
          results.failed++
          results.validation_errors++
          continue
        }

        // Check for duplicates
        const email = validatedRow.email.toLowerCase().trim()
        const dupResult = duplicateResults.get(email)

        if (dupResult?.isDuplicate) {
          if (dupResult.isPlatformOwned) {
            // Platform-owned seed lead - cannot be claimed by partner
            rejections.push({
              rowNumber: rowNum,
              reason: RejectionReason.PLATFORM_OWNED_LEAD,
              field: 'email',
              value: email,
              existingLeadId: dupResult.existingLeadId,
              message: 'This lead already exists as a platform-owned lead',
            })
            results.failed++
            results.duplicates_platform_owned++
            continue
          } else if (dupResult.isSamePartner) {
            // Same partner - update existing lead
            await handleSamePartnerDuplicate(dupResult.existingLeadId!, {
              first_name: validatedRow.first_name,
              last_name: validatedRow.last_name,
              phone: validatedRow.phone || undefined,
              job_title: validatedRow.job_title || undefined,
              company_name: validatedRow.company_name || undefined,
              city: validatedRow.city || undefined,
              state: state,
            })
            results.duplicates_same_partner++
            // This is a success (updated), but we don't count it as a new insert
            continue
          } else {
            // Cross-partner duplicate - reject, first uploader retains attribution
            rejections.push({
              rowNumber: rowNum,
              reason: RejectionReason.DUPLICATE_CROSS_PARTNER,
              field: 'email',
              value: email,
              existingLeadId: dupResult.existingLeadId,
              existingPartnerId: dupResult.existingPartnerId,
              message: 'This lead was already uploaded by another partner',
            })
            results.failed++
            results.duplicates_cross_partner++
            continue
          }
        }

        // Calculate hash key for new lead
        const hashKey = calculateHashKey(
          email,
          validatedRow.company_domain || null,
          validatedRow.phone || null
        )

        // Calculate scores for marketplace
        const intentScore = calculateIntentScore({
          seniorityLevel: validatedRow.seniority_level || 'unknown',
          companySize: validatedRow.company_size || null,
          companyEmployeeCount: validatedRow.company_employee_count || null,
          email: email,
          companyDomain: validatedRow.company_domain || null,
          hasPhone: !!validatedRow.phone,
          hasVerifiedEmail: false, // Will be updated after verification
          dataCompleteness: calculateDataCompleteness(validatedRow),
        })

        const freshnessScore = calculateFreshnessScore(new Date())
        const marketplacePrice = calculateMarketplacePrice({
          intentScore: intentScore.score,
          freshnessScore,
          hasPhone: !!validatedRow.phone,
          verificationStatus: 'pending',
        })

        // Prepare lead for insertion
        leadsToInsert.push({
          workspace_id: null, // Will be set when lead is purchased or routed
          partner_id: partner.id,
          upload_batch_id: batchId,
          first_name: validatedRow.first_name,
          last_name: validatedRow.last_name,
          email: email,
          phone: validatedRow.phone || null,
          company_name: validatedRow.company_name || `${validatedRow.first_name}'s Company`,
          company_domain: validatedRow.company_domain || null,
          company_industry: industry,
          company_size: validatedRow.company_size || null,
          company_employee_count: validatedRow.company_employee_count || null,
          job_title: validatedRow.job_title || null,
          seniority_level: validatedRow.seniority_level || 'unknown',
          city: validatedRow.city || null,
          state: state,
          state_code: state,
          country: 'US',
          country_code: 'US',
          hash_key: hashKey,
          intent_score_calculated: intentScore.score,
          freshness_score: freshnessScore,
          marketplace_price: marketplacePrice,
          is_marketplace_listed: true,
          verification_status: 'pending',
          source: 'partner',
          enrichment_status: 'pending',
          delivery_status: 'pending',
        })

        results.successful++
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        rejections.push({
          rowNumber: rowNum,
          reason: RejectionReason.UNKNOWN_ERROR,
          message,
        })
        results.failed++
      }
    }

    // Batch insert leads
    if (leadsToInsert.length > 0) {
      const { error: insertError } = await adminClient
        .from('leads')
        .insert(leadsToInsert as never[])

      if (insertError) {
        console.error('Failed to insert leads:', insertError)
        // Update batch status to failed
        await adminClient
          .from('partner_upload_batches')
          .update({
            status: 'failed',
            error_message: insertError.message,
          })
          .eq('id', batchId)

        return NextResponse.json({
          success: false,
          error: `Failed to insert leads: ${insertError.message}`,
        }, { status: 500 })
      }
    }

    // Store rejection log if any
    let rejectedRowsUrl: string | null = null
    if (rejections.length > 0) {
      rejectedRowsUrl = await storeRejectionLog(batchId, rejections)
    }

    // Update batch record with results
    await adminClient
      .from('partner_upload_batches')
      .update({
        status: 'completed',
        processed_rows: records.length,
        valid_rows: results.successful,
        invalid_rows: results.validation_errors,
        duplicate_rows: results.duplicates_cross_partner + results.duplicates_platform_owned,
        marketplace_listed: results.successful,
        error_log: rejections.slice(0, 100), // Store first 100 errors
        rejected_rows_url: rejectedRowsUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    // Update partner statistics
    await adminClient
      .from('partners')
      .update({
        total_leads_uploaded: adminClient.sql`total_leads_uploaded + ${results.successful}`,
        last_upload_at: new Date().toISOString(),
      } as never)
      .eq('id', partner.id)

    // Return response
    return NextResponse.json({
      success: results.failed === 0,
      batch_id: batchId,
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      duplicates: {
        same_partner_updated: results.duplicates_same_partner,
        cross_partner_rejected: results.duplicates_cross_partner,
        platform_owned_rejected: results.duplicates_platform_owned,
      },
      validation_errors: results.validation_errors,
      rejected_rows_url: rejectedRowsUrl,
    })
  } catch (error: unknown) {
    console.error('Partner upload error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 })
  }
}

/**
 * Calculate data completeness percentage
 */
function calculateDataCompleteness(row: z.infer<typeof leadSchema>): number {
  const fields = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'company_name',
    'company_domain',
    'job_title',
    'city',
    'state',
    'industry',
    'seniority_level',
    'company_size',
  ]

  let filled = 0
  for (const field of fields) {
    const value = row[field as keyof typeof row]
    if (value !== null && value !== undefined && value !== '') {
      filled++
    }
  }

  return (filled / fields.length) * 100
}
