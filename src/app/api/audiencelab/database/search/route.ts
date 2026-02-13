/**
 * Audience Labs Database Search API
 * Search/preview the 280M+ AL database
 * Credit-based lead purchasing
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { z } from 'zod'

// Import AL API client
import {
  previewAudience,
  fetchAudienceRecords,
  type ALEnrichFilter,
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
      .single()

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
          limit: 10, // Sample size
        })

        // Calculate credit cost (e.g., $0.50 per lead = 0.5 credits)
        const creditCostPerLead = 0.5
        const totalCost = preview.count * creditCostPerLead

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
        // Fetch records from AL
        const records = await fetchAudienceRecords({
          filters: audienceQuery,
          limit: maxRecords,
          offset: (params.page - 1) * params.limit,
        })

        if (!records || records.length === 0) {
          return NextResponse.json({
            leads: [],
            pulled: 0,
            credits_charged: 0,
            message: 'No matching records found',
          })
        }

        // Calculate actual cost based on records pulled
        const actualCost = records.length * creditCostPerLead

        // Deduct credits
        const { error: creditError } = await supabase
          .from('workspaces')
          .update({
            credits_balance: workspace.credits_balance - actualCost,
          })
          .eq('id', workspace.id)

        if (creditError) {
          safeError('[AL Database Search] Credit deduction failed:', creditError)
          return NextResponse.json(
            { error: 'Failed to deduct credits' },
            { status: 500 }
          )
        }

        // Store leads in workspace
        const leadsToInsert = records.map(record => ({
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
          // Refund credits on insert failure
          await supabase
            .from('workspaces')
            .update({
              credits_balance: workspace.credits_balance, // Restore original balance
            })
            .eq('id', workspace.id)

          safeError('[AL Database Search] Lead insert failed:', insertError)
          return NextResponse.json(
            { error: 'Failed to save leads' },
            { status: 500 }
          )
        }

        // Log credit usage
        await supabase.from('credit_usage').insert({
          workspace_id: workspace.id,
          user_id: user.id,
          credits_used: actualCost,
          action_type: 'al_database_pull',
          metadata: {
            records_pulled: records.length,
            filters: params,
          },
        })

        safeLog('[AL Database Search] Pulled records:', {
          workspace_id: workspace.id,
          count: records.length,
          cost: actualCost,
        })

        return NextResponse.json({
          success: true,
          leads: insertedLeads,
          pulled: records.length,
          credits_charged: actualCost,
          new_balance: workspace.credits_balance - actualCost,
          message: `Successfully pulled ${records.length} leads`,
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
function buildAudienceQuery(params: z.infer<typeof searchSchema>): ALEnrichFilter {
  const query: ALEnrichFilter = {}

  // Note: AL API filter format may vary - adjust based on actual API docs
  // This is a placeholder structure
  if (params.search) {
    query.company = params.search
  }

  // Map filter arrays to AL format
  // (Actual implementation depends on AL API docs - may need adjustments)

  return query
}
