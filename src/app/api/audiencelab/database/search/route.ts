/**
 * Audience Labs Database Search API
 * Search/preview the 280M+ AL database
 * Credit-based lead purchasing
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { z } from 'zod'

// Import AL API client
import {
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  type ALAudienceFilter,
} from '@/lib/audiencelab/api-client'

const searchSchema = z.object({
  // Filters
  industries: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  company_sizes: z.array(z.string()).optional(),
  job_titles: z.array(z.string()).optional(),
  seniority_levels: z.array(z.string()).optional(),

  // Search
  search: z.string().optional(),

  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),

  // Action
  action: z.enum(['preview', 'pull']).default('preview'),
})

/**
 * POST /api/audiencelab/database/search
 * Search AL database and preview or pull records
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Build AL audience query from filters
    const audienceQuery = buildAudienceQuery(params)

    if (params.action === 'preview') {
      // Preview mode: just get count and sample
      try {
        const preview = await previewAudience({
          filters: audienceQuery,
        })

        // Calculate credit cost for 25 leads (or fewer if less available)
        const creditCostPerLead = 0.5
        const maxPullable = Math.min(preview.count, 25)
        const totalCost = maxPullable * creditCostPerLead

        return NextResponse.json({
          preview: {
            count: preview.count,
            sample: preview.sample || [],
            credit_cost: totalCost,
            credit_cost_per_lead: creditCostPerLead,
            can_afford: workspace.credits_balance >= totalCost,
            current_balance: workspace.credits_balance,
          },
        })
      } catch (alError) {
        safeError('[AL Database Search] Preview error:', alError)
        return NextResponse.json(
          { error: 'Failed to preview audience. AL API may be unavailable.' },
          { status: 502 }
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
        // Step 1: Create audience with filters
        const audience = await createAudience({
          filters: audienceQuery,
          name: `db-search-${Date.now()}-${workspace.id.substring(0, 8)}`,
        })

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
        safeError('[AL Database Search] Pull error:', alError)
        return NextResponse.json(
          { error: 'Failed to pull records from AL database' },
          { status: 502 }
        )
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[AL Database Search] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * Build AL audience query from search parameters
 */
function buildAudienceQuery(params: z.infer<typeof searchSchema>): ALAudienceFilter {
  const query: ALAudienceFilter = {}

  // Map industries
  if (params.industries && params.industries.length > 0) {
    query.industries = params.industries
  }

  // Map states
  if (params.states && params.states.length > 0) {
    query.state = params.states
  }

  // Map seniority levels
  if (params.seniority_levels && params.seniority_levels.length > 0) {
    query.seniority = params.seniority_levels
  }

  // Map job titles to departments
  if (params.job_titles && params.job_titles.length > 0) {
    query.departments = params.job_titles
  }

  // Note: company_sizes not directly supported by ALAudienceFilter
  // Would need to map to SIC codes or employee count ranges

  return query
}
