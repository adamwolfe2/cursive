/**
 * Audience Labs Database Search API
 * Search/preview the 280M+ AL database
 * Credit-based lead purchasing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { z } from 'zod'

import {
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  type ALAudienceSegmentFilters,
} from '@/lib/audiencelab/api-client'

const AL_SEARCH_TIMEOUT = 20_000

const searchSchema = z.object({
  industries: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  company_sizes: z.array(z.string()).optional(),
  job_titles: z.array(z.string()).optional(),
  seniority_levels: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
  action: z.enum(['preview', 'pull']).default('preview'),
})

/**
 * POST /api/audiencelab/database/search
 * Search AL database and preview or pull records
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const params = searchSchema.parse(body)

    const supabase = await createClient()

    // Get user's workspace and credits
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, credits_balance')
      .eq('id', user.workspace_id)
      .maybeSingle()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (params.action === 'preview') {
      try {
        const segmentId = await findMatchingSegment(params)

        const previewPromise = segmentId
          ? previewAudience({ days_back: 7, limit: 25, segment: parseInt(segmentId, 10) })
          : previewAudience({ days_back: 7, limit: 25 })

        const preview = await Promise.race([
          previewPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AL preview timed out')), AL_SEARCH_TIMEOUT)
          ),
        ])

        const creditCostPerLead = 0.5
        const maxPullable = Math.min(preview.count, 25)
        const totalCost = maxPullable * creditCostPerLead

        return NextResponse.json({
          preview: {
            count: preview.count,
            sample: preview.result || [],
            credit_cost: totalCost,
            credit_cost_per_lead: creditCostPerLead,
            can_afford: workspace.credits_balance >= totalCost,
            current_balance: workspace.credits_balance,
            segment_id: segmentId || null,
          },
        })
      } catch (alError) {
        const isTimeout = alError instanceof Error && alError.message.includes('timed out')
        safeError('[AL Database Search] Preview error:', alError)
        return NextResponse.json(
          { error: isTimeout ? 'Search timed out. Try narrowing your filters.' : 'Failed to preview audience. AL API may be unavailable.' },
          { status: isTimeout ? 504 : 502 }
        )
      }
    } else {
      // Pull mode: create audience and fetch records
      const creditCostPerLead = 0.5
      const maxRecords = Math.min(params.limit, 100)
      const estimatedCost = maxRecords * creditCostPerLead

      // Check if user has enough credits
      if (workspace.credits_balance < estimatedCost) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: estimatedCost,
            current: workspace.credits_balance,
            shortfall: estimatedCost - workspace.credits_balance,
          },
          { status: 402 }
        )
      }

      try {
        const audienceFilters = buildAudienceFilters(params)

        const audience = await Promise.race([
          createAudience({
            filters: audienceFilters,
            name: `db-search-${Date.now()}-${workspace.id.substring(0, 8)}`,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AL pull timed out')), AL_SEARCH_TIMEOUT)
          ),
        ])

        // Step 2: Fetch records from created audience
        const recordsResponse = await fetchAudienceRecords(
          audience.audienceId,
          params.page,
          maxRecords
        )

        const records = recordsResponse.data || []

        if (!records || records.length === 0) {
          return NextResponse.json({
            leads: [],
            pulled: 0,
            credits_charged: 0,
            message: 'No matching records found',
          })
        }

        // Check for duplicate leads by email BEFORE charging credits
        const emails = records
          .map(r => r.BUSINESS_EMAIL || r.PERSONAL_EMAILS?.split(',')[0])
          .filter(Boolean)

        const { data: existingLeads } = await supabase
          .from('leads')
          .select('email')
          .eq('workspace_id', workspace.id)
          .in('email', emails)

        const existingEmails = new Set(existingLeads?.map(l => l.email) || [])

        // Filter out leads that already exist
        const newRecords = records.filter(record => {
          const email = record.BUSINESS_EMAIL || record.PERSONAL_EMAILS?.split(',')[0]
          return email && !existingEmails.has(email)
        })

        if (newRecords.length === 0) {
          return NextResponse.json({
            leads: [],
            pulled: 0,
            credits_charged: 0,
            message: 'All leads already exist in your workspace',
          })
        }

        // Calculate actual cost based on NEW records (not duplicates)
        const actualCost = newRecords.length * creditCostPerLead

        // Deduct credits atomically using RPC
        const { data: creditResult } = await supabase.rpc('deduct_credits', {
          p_workspace_id: workspace.id,
          p_amount: actualCost,
          p_user_id: user.id,
          p_action_type: 'al_database_pull',
          p_metadata: {
            total_fetched: records.length,
            new_leads: newRecords.length,
            duplicates_skipped: records.length - newRecords.length,
            filters: params,
          },
        })

        if (!creditResult || !creditResult[0]?.success) {
          return NextResponse.json(
            { error: creditResult?.[0]?.error_message || 'Credit deduction failed' },
            { status: 402 }
          )
        }

        const newBalance = creditResult[0].new_balance

        // Store only new leads in workspace
        const leadsToInsert = newRecords.map(record => ({
          workspace_id: workspace.id,
          email: record.BUSINESS_EMAIL || record.PERSONAL_EMAILS?.split(',')[0] || null,
          first_name: record.FIRST_NAME || null,
          last_name: record.LAST_NAME || null,
          company_name: record.COMPANY_NAME || null,
          job_title: record.JOB_TITLE || null,
          phone: record.MOBILE_PHONE || record.DIRECT_NUMBER || null,
          linkedin_url: record.LINKEDIN_URL || null,
          industry: record.COMPANY_INDUSTRY || null,
          company_size: record.COMPANY_EMPLOYEE_COUNT || null,
          state: record.COMPANY_STATE || record.PERSONAL_STATE || null,
          city: record.COMPANY_CITY || record.PERSONAL_CITY || null,
          source: 'audiencelab_database' as const,
          verification_status: 'approved' as const,
          is_marketplace_listed: false,
          marketplace_price: null,
        }))

        const { data: insertedLeads, error: insertError } = await supabase
          .from('leads')
          .insert(leadsToInsert)
          .select()

        if (insertError) {
          // Refund credits on insert failure using RPC
          await supabase.rpc('refund_credits', {
            p_workspace_id: workspace.id,
            p_amount: actualCost,
            p_user_id: user.id,
            p_reason: 'Lead insert failed',
            p_original_action: 'al_database_pull',
          })

          safeError('[AL Database Search] Lead insert failed, credits refunded:', insertError)
          return NextResponse.json(
            { error: 'Failed to save leads' },
            { status: 500 }
          )
        }

        // Credit usage already logged by deduct_credits RPC
        safeLog('[AL Database Search] Pulled records:', {
          workspace_id: workspace.id,
          total_fetched: records.length,
          new_leads: newRecords.length,
          duplicates_skipped: records.length - newRecords.length,
          cost: actualCost,
        })

        return NextResponse.json({
          success: true,
          leads: insertedLeads,
          pulled: newRecords.length,
          credits_charged: actualCost,
          new_balance: newBalance,
          message: `Successfully pulled ${newRecords.length} leads${
            records.length > newRecords.length
              ? ` (${records.length - newRecords.length} duplicates skipped)`
              : ''
          }`,
        })
      } catch (alError) {
        const isTimeout = alError instanceof Error && alError.message.includes('timed out')
        safeError('[AL Database Search] Pull error:', alError)
        return NextResponse.json(
          { error: isTimeout ? 'Pull timed out. Try again or narrow your filters.' : 'Failed to pull records from AL database' },
          { status: isTimeout ? 504 : 502 }
        )
      }
    }
  } catch (error) {
    return handleApiError(error)
  }
}

function buildAudienceFilters(params: z.infer<typeof searchSchema>): ALAudienceSegmentFilters {
  const filters: ALAudienceSegmentFilters = {}

  if (params.industries?.length || params.job_titles?.length || params.seniority_levels?.length) {
    filters.business = {
      ...(params.industries?.length && { industry: params.industries }),
      ...(params.job_titles?.length && { jobTitle: params.job_titles }),
      ...(params.seniority_levels?.length && {
        seniority: params.seniority_levels as Array<'C-Suite' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor' | 'Entry Level'>,
      }),
    }
  }

  if (params.states?.length) {
    filters.location = { state: params.states }
  }

  return filters
}

async function findMatchingSegment(
  params: z.infer<typeof searchSchema>
): Promise<string | null> {
  const searchTerms: string[] = []

  if (params.industries?.length) searchTerms.push(...params.industries)
  if (params.search) searchTerms.push(params.search)
  if (params.job_titles?.length) searchTerms.push(...params.job_titles)

  if (searchTerms.length === 0) return null

  try {
    const admin = createAdminClient()
    const term = sanitizeSearchTerm(searchTerms.join(' '))

    const { data } = await admin
      .from('al_segment_catalog')
      .select('segment_id')
      .or(`name.ilike.%${term}%,category.ilike.%${term}%,keywords.ilike.%${term}%`)
      .limit(1)
      .maybeSingle()

    return data?.segment_id ?? null
  } catch (err) {
    safeError('[AL Database Search] Segment catalog lookup failed:', err)
    return null
  }
}
