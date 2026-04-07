/**
 * AudienceLab Lead Ingestion API
 *
 * GET  /api/audiencelab/ingest — Preview available leads from AL (count + sample)
 * POST /api/audiencelab/ingest — Pull leads from AL and insert into our database
 *
 * Supports two modes:
 *   1. Segment-based (preferred): Pass segment_ids from al_segment_catalog
 *   2. Filter-based: Pass nested filters (business/location/etc.)
 *
 * Quality pipeline:
 *   AL API → field normalization → deliverability scoring (≥60) →
 *   verified email check → name sanitization → dedup (hash + global email) →
 *   quota check → lead insert → user routing via user_targeting →
 *   user_lead_assignments → Inngest notifications
 *
 * Auth: Requires authenticated user with workspace membership.
 * API Key: Uses AUDIENCELAB_ACCOUNT_API_KEY from environment.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import {
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  UNFILTERED_PREVIEW_THRESHOLD,
  type ALAudienceSegmentFilters,
} from '@/lib/audiencelab/api-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { processEventInline } from '@/lib/audiencelab/edge-processor'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL Ingest]'
const BATCH_SIZE = 100

// ── Validation Schemas ──────────────────────────────────────────────────────

const PreviewQuerySchema = z.object({
  days_back: z.coerce.number().int().min(1).max(10).default(5),
  limit: z.coerce.number().int().min(0).max(500).default(10),
  // Segment ID from al_segment_catalog (preferred — reliable filtering)
  segment_id: z.string().optional(),
  // Flat filter params as fallback
  industry: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  seniority: z.string().optional(),
  department: z.string().optional(),
})

const IngestBodySchema = z.object({
  name: z.string().min(1).max(200),
  days_back: z.number().int().min(1).max(10).default(5),
  // Segment IDs from al_segment_catalog (preferred path)
  segment_ids: z.array(z.string()).optional(),
  // Nested filters (fallback — AL sub-account API may not support all filter fields)
  filters: z.object({
    business: z.object({
      industry: z.array(z.string()).optional(),
      seniority: z.array(z.enum([
        'C-Suite', 'VP', 'Director', 'Manager', 'Individual Contributor', 'Entry Level',
      ])).optional(),
      department: z.array(z.string()).optional(),
      jobTitle: z.array(z.string()).optional(),
      sic: z.array(z.string()).optional(),
      naics: z.array(z.string()).optional(),
      employeeCount: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
      companyRevenue: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    }).optional(),
    location: z.object({
      state: z.array(z.string()).optional(),
      city: z.array(z.string()).optional(),
      zip: z.array(z.string()).optional(),
    }).optional(),
    personal: z.object({
      ageRange: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
      gender: z.array(z.enum(['M', 'F'])).optional(),
    }).optional(),
    financial: z.object({
      incomeRange: z.array(z.string()).optional(),
      netWorth: z.array(z.string()).optional(),
    }).optional(),
    housing: z.object({
      homeowner: z.boolean().optional(),
    }).optional(),
    family: z.object({
      married: z.boolean().optional(),
      children: z.boolean().optional(),
    }).optional(),
  }).optional(),
  // Max pages to fetch (safety cap)
  max_pages: z.number().int().min(1).max(20).default(5),
  page_size: z.number().int().min(50).max(500).default(500),
})

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildFiltersFromQuery(params: z.infer<typeof PreviewQuerySchema>): ALAudienceSegmentFilters {
  const filters: ALAudienceSegmentFilters = {}

  const industries = params.industry?.split(',').map(s => s.trim()).filter(Boolean)
  const seniorities = params.seniority?.split(',').map(s => s.trim()).filter(Boolean)
  const departments = params.department?.split(',').map(s => s.trim()).filter(Boolean)

  if (industries?.length || seniorities?.length || departments?.length) {
    filters.business = {
      ...(industries?.length && { industry: industries }),
      ...(seniorities?.length && { seniority: seniorities as ALAudienceSegmentFilters['business'] extends { seniority?: infer S } ? S : never }),
      ...(departments?.length && { department: departments }),
    }
  }

  const states = params.state?.split(',').map(s => s.trim()).filter(Boolean)
  const cities = params.city?.split(',').map(s => s.trim()).filter(Boolean)
  const zips = params.zip?.split(',').map(s => s.trim()).filter(Boolean)

  if (states?.length || cities?.length || zips?.length) {
    filters.location = {
      ...(states?.length && { state: states }),
      ...(cities?.length && { city: cities }),
      ...(zips?.length && { zip: zips }),
    }
  }

  return filters
}

function hasFilters(filters: ALAudienceSegmentFilters): boolean {
  return Object.keys(filters).length > 0
}

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── GET: Preview ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 })
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = PreviewQuerySchema.safeParse(searchParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { days_back, limit, segment_id } = parsed.data

    safeLog(`${LOG_PREFIX} Preview: days_back=${days_back}, limit=${limit}, segment_id=${segment_id || 'none'}`)

    // Segment-based preview (preferred — reliable with AL sub-account API)
    if (segment_id) {
      const preview = await previewAudience({
        days_back,
        limit,
        segment: parseInt(segment_id, 10),
      })

      return NextResponse.json({
        success: true,
        count: preview.count,
        sample_size: preview.result?.length ?? 0,
        sample: preview.result ?? [],
        field_coverage: preview.field_coverage ?? {},
        segment_id,
      })
    }

    // Filter-based preview (fallback)
    const filters = buildFiltersFromQuery(parsed.data)
    const preview = await previewAudience({
      days_back,
      limit,
      filters: hasFilters(filters) ? filters : undefined,
    })

    return NextResponse.json({
      success: true,
      count: preview.count,
      sample_size: preview.result?.length ?? 0,
      sample: preview.result ?? [],
      field_coverage: preview.field_coverage ?? {},
      filters_applied: filters,
    })
  } catch (error) {
    safeError(`${LOG_PREFIX} Preview failed`, error)
    return handleApiError(error)
  }
}

// ── POST: Ingest ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  let jobId: string | null = null

  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = IngestBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name, days_back, segment_ids, filters, max_pages, page_size } = parsed.data
    const workspaceId = user.workspace_id

    // Must provide segment_ids OR filters
    const resolvedFilters: ALAudienceSegmentFilters = filters ?? {}
    const hasSegments = segment_ids && segment_ids.length > 0

    if (!hasSegments && !hasFilters(resolvedFilters)) {
      return NextResponse.json(
        { error: 'Provide segment_ids or at least one filter (industry, location, etc.)' },
        { status: 400 }
      )
    }

    safeLog(`${LOG_PREFIX} Ingest: name="${name}", days_back=${days_back}, segments=${segment_ids?.join(',') || 'none'}`)

    // Idempotency check
    const hashInput = hasSegments
      ? `ingest|${name}|segments:${segment_ids!.join(',')}|${workspaceId}`
      : `ingest|${name}|${JSON.stringify(resolvedFilters)}|${workspaceId}`
    const importHash = await sha256(hashInput)

    const { data: existingJob } = await supabase
      .from('audiencelab_import_jobs')
      .select('id, status, total_rows, processed_rows')
      .eq('idempotency_hash', importHash)
      .maybeSingle()

    if (existingJob?.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Import already completed (idempotent)',
        job_id: existingJob.id,
        total_rows: existingJob.total_rows,
        processed_rows: existingJob.processed_rows,
      })
    }

    if (existingJob?.status === 'processing') {
      return NextResponse.json(
        { error: 'Import already in progress', job_id: existingJob.id },
        { status: 409 }
      )
    }

    // Create import job with 'processing' status
    const { data: importJob } = await supabase
      .from('audiencelab_import_jobs')
      .upsert({
        id: existingJob?.id || undefined,
        workspace_id: workspaceId,
        audience_id: name,
        file_url: `api://audiencelab/ingest/${name}`,
        status: 'processing',
        idempotency_hash: importHash,
      }, { onConflict: 'idempotency_hash' })
      .select('id')
      .maybeSingle()

    jobId = importJob?.id ?? null

    // Step 1: Preview to validate and get count
    const preview = await previewAudience({
      days_back,
      limit: 0,
      ...(hasSegments
        ? { segment: parseInt(segment_ids![0], 10) }
        : { filters: resolvedFilters }),
    })

    if (preview.count === 0) {
      await markJobStatus(supabase, jobId, 'completed', 0, 0, 0)
      return NextResponse.json({
        success: true,
        message: 'No leads match these criteria',
        count: 0,
        leads_created: 0,
      })
    }

    // Safety: reject if AL returned unfiltered response
    if (preview.count >= UNFILTERED_PREVIEW_THRESHOLD) {
      await markJobStatus(supabase, jobId, 'failed', 0, 0, 0, 'Unfiltered response — filters may not have applied')
      safeError(`${LOG_PREFIX} Preview count ${preview.count} exceeds safety threshold`)
      return NextResponse.json(
        { error: `Audience too large (${preview.count.toLocaleString()} records) — filters may not have applied` },
        { status: 422 }
      )
    }

    safeLog(`${LOG_PREFIX} Preview: ${preview.count} leads available`)

    // Step 2: Look up segment context for industry tagging
    // AL records often lack COMPANY_INDUSTRY — tag with segment's category so routing works
    let segmentIndustry: string | null = null
    if (hasSegments) {
      const { data: segmentInfo } = await supabase
        .from('al_segment_catalog')
        .select('name, category, sub_category')
        .in('segment_id', segment_ids!)
        .limit(1)
        .maybeSingle()

      if (segmentInfo) {
        segmentIndustry = segmentInfo.sub_category || segmentInfo.category || segmentInfo.name
        safeLog(`${LOG_PREFIX} Segment industry context: "${segmentIndustry}"`)
      }
    }

    // Step 3: Create audience in AL and fetch records
    const audience = await createAudience({
      name: `cursive_ingest_${name}_${Date.now()}`,
      filters: resolvedFilters,
    })

    if (!audience.audienceId) {
      await markJobStatus(supabase, jobId, 'failed', 0, 0, 0, 'AL audience creation failed')
      return NextResponse.json(
        { error: 'Failed to create audience in AudienceLab' },
        { status: 502 }
      )
    }

    if (jobId) {
      await supabase
        .from('audiencelab_import_jobs')
        .update({ audience_id: audience.audienceId })
        .eq('id', jobId)
    }

    safeLog(`${LOG_PREFIX} Created audience: ${audience.audienceId}`)

    // Step 4: Fetch records and process through quality pipeline
    // AL createAudience may take time to build — poll until ready or use existing audience
    let totalFetched = 0
    let totalStored = 0
    let totalLeadsCreated = 0
    let totalDuplicates = 0
    let totalQuotaSkipped = 0
    let totalFailed = 0

    // Wait for audience to be ready (AL queues audience builds)
    let audienceReady = false
    for (let attempt = 0; attempt < 6; attempt++) {
      const testFetch = await fetchAudienceRecords(audience.audienceId, 1, 1)
        .catch(() => null)

      if (testFetch?.data?.length) {
        audienceReady = true
        break
      }

      // Wait 5 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    if (!audienceReady) {
      await markJobStatus(supabase, jobId, 'failed', 0, 0, 0, 'Audience build timed out')
      return NextResponse.json(
        { error: 'AudienceLab is still building this audience. Try again in a minute.' },
        { status: 503 }
      )
    }

    for (let page = 1; page <= max_pages; page++) {
      const records = await fetchAudienceRecords(audience.audienceId, page, page_size)

      if (!records.data?.length) break

      totalFetched += records.data.length

      for (let i = 0; i < records.data.length; i += BATCH_SIZE) {
        const batch = records.data.slice(i, i + BATCH_SIZE)

        // Inject segment industry context into records that lack COMPANY_INDUSTRY
        const enrichedBatch = batch.map(record => {
          const raw = { ...record } as Record<string, unknown>
          if (!raw.COMPANY_INDUSTRY && segmentIndustry) {
            raw.COMPANY_INDUSTRY = segmentIndustry
          }
          return raw
        })

        const rowsToInsert = enrichedBatch.map(record => ({
          source: 'audiencesync' as const,
          event_type: 'ingest_pull',
          profile_id: (record.UUID as string) || null,
          raw: record,
          processed: false,
          workspace_id: workspaceId,
        }))

        const { data: inserted, error: insertError } = await supabase
          .from('audiencelab_events')
          .insert(rowsToInsert)
          .select('id')

        if (insertError) {
          safeError(`${LOG_PREFIX} Batch insert error (page ${page})`, insertError)
          totalFailed += batch.length
          continue
        }

        if (inserted?.length) {
          totalStored += inserted.length

          const results = await Promise.allSettled(
            inserted.map(row => processEventInline(row.id, workspaceId, 'ingest'))
          )

          for (const result of results) {
            if (result.status === 'fulfilled') {
              if (result.value.lead_id && !result.value.error) {
                totalLeadsCreated++
              } else if (result.value.error === 'quota_exhausted') {
                totalQuotaSkipped++
              } else {
                totalDuplicates++
              }
            } else {
              totalFailed++
            }
          }
        }
      }

      if (page >= records.total_pages) break
    }

    await markJobStatus(supabase, jobId, 'completed', totalFetched, totalStored, totalFetched - totalStored)

    const summary = {
      success: true,
      job_id: jobId,
      audience_id: audience.audienceId,
      available_count: preview.count,
      total_fetched: totalFetched,
      total_processed: totalStored,
      leads_created: totalLeadsCreated,
      duplicates_or_filtered: totalDuplicates,
      quota_skipped: totalQuotaSkipped,
      failed: totalFailed,
    }

    safeLog(`${LOG_PREFIX} Ingest complete: ${totalLeadsCreated} leads created from ${totalFetched} records`)

    return NextResponse.json(summary)
  } catch (error) {
    safeError(`${LOG_PREFIX} Ingest failed`, error)
    await markJobStatus(supabase, jobId, 'failed', 0, 0, 0, error instanceof Error ? error.message : 'Unknown error')
    return handleApiError(error)
  }
}

// ── Job Status Helper ───────────────────────────────────────────────────────

async function markJobStatus(
  supabase: ReturnType<typeof createAdminClient>,
  jobId: string | null,
  status: string,
  totalRows: number,
  processedRows: number,
  failedRows: number,
  error?: string
): Promise<void> {
  if (!jobId) return
  try {
    await supabase
      .from('audiencelab_import_jobs')
      .update({
        status,
        total_rows: totalRows,
        processed_rows: processedRows,
        failed_rows: failedRows,
        ...(error && { error }),
      })
      .eq('id', jobId)
  } catch {
    // Best-effort
  }
}
