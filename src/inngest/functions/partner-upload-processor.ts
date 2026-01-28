// Partner Upload Processor - Chunked Background Processing
// Processes large CSV uploads in chunks with progress tracking

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { parse } from 'csv-parse'
import { Readable } from 'stream'
import {
  calculateHashKey,
  batchCheckDuplicates,
  handleSamePartnerDuplicate,
  storeRejectionLog,
  RejectionReason,
  type RejectionLogEntry,
} from '@/lib/services/deduplication.service'
import {
  calculateIntentScore,
  calculateFreshnessScore,
  calculateMarketplacePrice,
} from '@/lib/services/lead-scoring.service'
import { z } from 'zod'

// Lead validation schema
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

const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

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

/**
 * Main upload processor - handles large files in chunks
 */
export const processPartnerUpload = inngest.createFunction(
  {
    id: 'partner-upload-processor',
    name: 'Process Partner Upload',
    retries: 3,
    concurrency: {
      limit: 5, // Max 5 concurrent uploads
    },
  },
  { event: 'partner/upload.process' },
  async ({ event, step, logger }) => {
    const { batch_id, partner_id, storage_path } = event.data
    const supabase = createAdminClient()

    logger.info(`Starting upload processing for batch ${batch_id}`)

    // Step 1: Download and count rows
    const fileData = await step.run('download-file', async () => {
      const { data: batch } = await supabase
        .from('partner_upload_batches')
        .select('chunk_size')
        .eq('id', batch_id)
        .single()

      // Download file from storage
      const { data: fileBuffer, error: downloadError } = await supabase
        .storage
        .from('partner-uploads')
        .download(storage_path)

      if (downloadError || !fileBuffer) {
        throw new Error(`Failed to download file: ${downloadError?.message}`)
      }

      const content = await fileBuffer.text()

      // Count rows
      const lines = content.split('\n').filter(line => line.trim())
      const totalRows = lines.length - 1 // Exclude header

      // Update batch with total rows
      await supabase
        .from('partner_upload_batches')
        .update({
          total_rows: totalRows,
          status: 'processing',
          processing_started_at: new Date().toISOString(),
          total_chunks: Math.ceil(totalRows / (batch?.chunk_size || 1000)),
        })
        .eq('id', batch_id)

      return {
        content,
        totalRows,
        chunkSize: batch?.chunk_size || 1000,
      }
    })

    // Step 2: Parse CSV header
    const header = await step.run('parse-header', async () => {
      const lines = fileData.content.split('\n')
      const headerLine = lines[0]

      // Parse header to get column names
      const parser = parse(headerLine, {
        columns: false,
        skip_empty_lines: true,
        trim: true,
      })

      const records: string[][] = []
      for await (const record of parser) {
        records.push(record)
      }

      return records[0] || []
    })

    // Step 3: Process in chunks
    const chunkSize = fileData.chunkSize
    const totalChunks = Math.ceil(fileData.totalRows / chunkSize)

    let totalResults = {
      successful: 0,
      failed: 0,
      duplicates_same_partner: 0,
      duplicates_cross_partner: 0,
      duplicates_platform_owned: 0,
      validation_errors: 0,
    }
    let allRejections: RejectionLogEntry[] = []

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const chunkResult = await step.run(`process-chunk-${chunkIndex}`, async () => {
        const startRow = chunkIndex * chunkSize
        const endRow = Math.min(startRow + chunkSize, fileData.totalRows)

        // Parse this chunk
        const lines = fileData.content.split('\n')
        const chunkLines = [lines[0], ...lines.slice(startRow + 1, endRow + 1)]
        const chunkContent = chunkLines.join('\n')

        const records: Record<string, string>[] = []
        const parser = parse(chunkContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        })

        for await (const record of parser) {
          records.push(record)
        }

        // Pre-check duplicates for this chunk
        const leadsToCheck = records.map((row, index) => ({
          index: startRow + index,
          email: row.email?.toLowerCase().trim() || '',
          companyDomain: row.company_domain?.toLowerCase().trim() || null,
          phone: row.phone || null,
        })).filter(l => l.email)

        const duplicateResults = await batchCheckDuplicates(leadsToCheck, partner_id)

        // Process each row
        const results = {
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
          const rowNum = startRow + i + 2 // Account for header and 0-index

          try {
            // Validate
            const parseResult = leadSchema.safeParse(row)
            if (!parseResult.success) {
              rejections.push({
                rowNumber: rowNum,
                reason: RejectionReason.VALIDATION_ERROR,
                field: parseResult.error.issues[0]?.path.join('.'),
                value: String(row[parseResult.error.issues[0]?.path[0] as string] || '').slice(0, 100),
                message: parseResult.error.issues[0]?.message || 'validation failed',
              })
              results.failed++
              results.validation_errors++
              continue
            }

            const validatedRow = parseResult.data
            const state = normalizeState(validatedRow.state)
            const industry = normalizeIndustry(validatedRow.industry)

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

            // Check duplicates
            const email = validatedRow.email.toLowerCase().trim()
            const dupResult = duplicateResults.get(email)

            if (dupResult?.isDuplicate) {
              if (dupResult.isPlatformOwned) {
                rejections.push({
                  rowNumber: rowNum,
                  reason: RejectionReason.PLATFORM_OWNED_LEAD,
                  field: 'email',
                  value: email,
                  existingLeadId: dupResult.existingLeadId,
                  message: 'Platform-owned lead',
                })
                results.failed++
                results.duplicates_platform_owned++
                continue
              } else if (dupResult.isSamePartner) {
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
                continue
              } else {
                rejections.push({
                  rowNumber: rowNum,
                  reason: RejectionReason.DUPLICATE_CROSS_PARTNER,
                  field: 'email',
                  value: email,
                  existingLeadId: dupResult.existingLeadId,
                  existingPartnerId: dupResult.existingPartnerId,
                  message: 'Already uploaded by another partner',
                })
                results.failed++
                results.duplicates_cross_partner++
                continue
              }
            }

            // Calculate scores
            const hashKey = calculateHashKey(email, validatedRow.company_domain || null, validatedRow.phone || null)
            const intentScore = calculateIntentScore({
              seniorityLevel: validatedRow.seniority_level || 'unknown',
              companySize: validatedRow.company_size || null,
              companyEmployeeCount: validatedRow.company_employee_count || null,
              email: email,
              companyDomain: validatedRow.company_domain || null,
              hasPhone: !!validatedRow.phone,
              hasVerifiedEmail: false,
              dataCompleteness: calculateDataCompleteness(validatedRow),
            })
            const freshnessScore = calculateFreshnessScore(new Date())
            const marketplacePrice = calculateMarketplacePrice({
              intentScore: intentScore.score,
              freshnessScore,
              hasPhone: !!validatedRow.phone,
              verificationStatus: 'pending',
            })

            leadsToInsert.push({
              workspace_id: null,
              partner_id: partner_id,
              upload_batch_id: batch_id,
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
          const { error: insertError } = await supabase
            .from('leads')
            .insert(leadsToInsert as never[])

          if (insertError) {
            throw new Error(`Failed to insert leads: ${insertError.message}`)
          }
        }

        // Update progress
        const processedRows = endRow
        await supabase.rpc('update_upload_progress', {
          p_batch_id: batch_id,
          p_processed_rows: processedRows,
          p_valid_rows: totalResults.successful + results.successful,
          p_invalid_rows: totalResults.validation_errors + results.validation_errors,
          p_duplicate_rows: totalResults.duplicates_cross_partner + results.duplicates_cross_partner +
            totalResults.duplicates_platform_owned + results.duplicates_platform_owned,
        })

        // Update current chunk
        await supabase
          .from('partner_upload_batches')
          .update({ current_chunk: chunkIndex + 1 })
          .eq('id', batch_id)

        return { results, rejections }
      })

      // Accumulate results
      totalResults.successful += chunkResult.results.successful
      totalResults.failed += chunkResult.results.failed
      totalResults.duplicates_same_partner += chunkResult.results.duplicates_same_partner
      totalResults.duplicates_cross_partner += chunkResult.results.duplicates_cross_partner
      totalResults.duplicates_platform_owned += chunkResult.results.duplicates_platform_owned
      totalResults.validation_errors += chunkResult.results.validation_errors
      allRejections.push(...chunkResult.rejections)

      logger.info(`Chunk ${chunkIndex + 1}/${totalChunks} complete. Successful: ${totalResults.successful}`)
    }

    // Step 4: Finalize
    await step.run('finalize', async () => {
      // Store rejection log if any
      let rejectedRowsUrl: string | null = null
      if (allRejections.length > 0) {
        rejectedRowsUrl = await storeRejectionLog(batch_id, allRejections)
      }

      // Update batch record with final results
      await supabase
        .from('partner_upload_batches')
        .update({
          status: 'completed',
          processed_rows: fileData.totalRows,
          valid_rows: totalResults.successful,
          invalid_rows: totalResults.validation_errors,
          duplicate_rows: totalResults.duplicates_cross_partner + totalResults.duplicates_platform_owned,
          marketplace_listed: totalResults.successful,
          progress_percent: 100,
          error_log: allRejections.slice(0, 100),
          rejected_rows_url: rejectedRowsUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', batch_id)

      // Update partner statistics
      await supabase
        .from('partners')
        .update({
          total_leads_uploaded: supabase.sql`total_leads_uploaded + ${totalResults.successful}`,
          last_upload_at: new Date().toISOString(),
        } as never)
        .eq('id', partner_id)

      // Queue new leads for verification
      await inngest.send({
        name: 'marketplace/verification.queue-batch',
        data: {
          batch_id: batch_id,
          partner_id: partner_id,
        },
      })
    })

    return {
      success: true,
      batch_id,
      total_rows: fileData.totalRows,
      results: totalResults,
    }
  }
)

/**
 * Retry stalled uploads - runs every 10 minutes
 */
export const retryStatledUploads = inngest.createFunction(
  {
    id: 'retry-stalled-uploads',
    name: 'Retry Stalled Uploads',
    retries: 1,
  },
  { cron: '*/10 * * * *' },
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    const stalledBatches = await step.run('find-stalled', async () => {
      const { data } = await supabase.rpc('detect_stalled_uploads')
      return data || []
    })

    if (stalledBatches.length === 0) {
      logger.info('No stalled uploads found')
      return { stalled: 0 }
    }

    logger.info(`Found ${stalledBatches.length} stalled uploads`)

    for (const batch of stalledBatches) {
      await step.run(`retry-${batch.batch_id}`, async () => {
        // Increment retry count
        await supabase
          .from('partner_upload_batches')
          .update({
            retry_count: supabase.sql`retry_count + 1`,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', batch.batch_id)

        // Get storage path
        const { data: batchData } = await supabase
          .from('partner_upload_batches')
          .select('storage_path, partner_id, retry_count, max_retries')
          .eq('id', batch.batch_id)
          .single()

        if (batchData && batchData.retry_count <= batchData.max_retries) {
          // Re-trigger processing
          await inngest.send({
            name: 'partner/upload.process',
            data: {
              batch_id: batch.batch_id,
              partner_id: batchData.partner_id,
              storage_path: batchData.storage_path,
              is_retry: true,
            },
          })
        } else {
          // Mark as failed
          await supabase
            .from('partner_upload_batches')
            .update({
              status: 'failed',
              error_message: 'Max retries exceeded after upload stalled',
              completed_at: new Date().toISOString(),
            })
            .eq('id', batch.batch_id)
        }
      })
    }

    return { retried: stalledBatches.length }
  }
)

// Helper functions
function normalizeIndustry(industry: string): string | null {
  const normalized = industry?.toLowerCase().trim()
  return INDUSTRY_MAP[normalized] || null
}

function normalizeState(state: string): string | null {
  const normalized = state?.toUpperCase().trim()
  return VALID_STATES.includes(normalized) ? normalized : null
}

function calculateDataCompleteness(row: z.infer<typeof leadSchema>): number {
  const fields = [
    'first_name', 'last_name', 'email', 'phone', 'company_name',
    'company_domain', 'job_title', 'city', 'state', 'industry',
    'seniority_level', 'company_size',
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
