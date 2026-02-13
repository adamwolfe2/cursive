/**
 * Run Saved Segment
 * Execute segment query (preview or pull leads)
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { z } from 'zod'
import {
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  type ALAudienceFilter,
} from '@/lib/audiencelab/api-client'

const runSchema = z.object({
  action: z.enum(['preview', 'pull']),
  limit: z.number().min(1).max(100).default(25),
})

/**
 * POST /api/segments/[id]/run
 * Execute the saved segment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, limit } = runSchema.parse(body)

    const supabase = await createClient()

    // Fetch segment
    const { data: segment, error: segmentError } = await supabase
      .from('saved_segments')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (segmentError || !segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    // Get workspace for credit check
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, credits_balance')
      .eq('id', user.workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Convert segment filters to AL format
    const audienceQuery = segment.filters as ALAudienceFilter

    if (action === 'preview') {
      // Preview mode
      try {
        const preview = await previewAudience({
          filters: audienceQuery,
        })

        const creditCostPerLead = 0.5
        const maxPullable = Math.min(preview.count, limit)
        const totalCost = maxPullable * creditCostPerLead

        // Update segment stats
        await supabase
          .from('saved_segments')
          .update({
            last_count: preview.count,
            last_run_at: new Date().toISOString(),
          })
          .eq('id', id)

        return NextResponse.json({
          preview: {
            count: preview.count,
            sample: preview.result || [],
            credit_cost: totalCost,
            credit_cost_per_lead: creditCostPerLead,
            can_afford: workspace.credits_balance >= totalCost,
            current_balance: workspace.credits_balance,
          },
        })
      } catch (alError) {
        safeError('[Segment Run] Preview error:', alError)
        return NextResponse.json(
          { error: 'Failed to preview segment' },
          { status: 502 }
        )
      }
    } else {
      // Pull mode
      const creditCostPerLead = 0.5
      const maxRecords = Math.min(limit, 100)
      const estimatedCost = maxRecords * creditCostPerLead

      // Check credits
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
        // Create audience and fetch records
        const audience = await createAudience({
          filters: audienceQuery,
          name: `segment-${id}-${Date.now()}`,
        })

        const recordsResponse = await fetchAudienceRecords(
          audience.audienceId,
          1,
          maxRecords
        )

        const records = recordsResponse.data || []

        if (records.length === 0) {
          return NextResponse.json({
            leads: [],
            pulled: 0,
            credits_charged: 0,
            message: 'No matching records found',
          })
        }

        // Check for duplicates
        const emails = records
          .map(r => r.BUSINESS_EMAIL || r.PERSONAL_EMAILS?.split(',')[0])
          .filter(Boolean)

        const { data: existingLeads } = await supabase
          .from('leads')
          .select('email')
          .eq('workspace_id', workspace.id)
          .in('email', emails)

        const existingEmails = new Set(existingLeads?.map(l => l.email) || [])
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

        // Deduct credits using RPC
        const actualCost = newRecords.length * creditCostPerLead
        const { data: creditResult } = await supabase.rpc('deduct_credits', {
          p_workspace_id: workspace.id,
          p_amount: actualCost,
          p_user_id: user.id,
          p_action_type: 'segment_run',
          p_metadata: { segment_id: id, segment_name: segment.name },
        })

        if (!creditResult || !creditResult[0]?.success) {
          return NextResponse.json(
            { error: creditResult?.[0]?.error_message || 'Credit deduction failed' },
            { status: 402 }
          )
        }

        // Insert leads
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
          source: 'audiencelab_database',
          verification_status: 'approved',
          is_marketplace_listed: false,
          marketplace_price: null,
        }))

        const { data: insertedLeads, error: insertError } = await supabase
          .from('leads')
          .insert(leadsToInsert)
          .select()

        if (insertError) {
          // Refund credits
          await supabase.rpc('refund_credits', {
            p_workspace_id: workspace.id,
            p_amount: actualCost,
            p_user_id: user.id,
            p_reason: 'Lead insert failed',
            p_original_action: 'segment_run',
          })

          safeError('[Segment Run] Insert failed:', insertError)
          return NextResponse.json(
            { error: 'Failed to save leads' },
            { status: 500 }
          )
        }

        // Update segment stats
        await supabase
          .from('saved_segments')
          .update({
            last_count: records.length,
            last_run_at: new Date().toISOString(),
          })
          .eq('id', id)

        safeLog('[Segment Run] Success:', {
          segment_id: id,
          total_fetched: records.length,
          new_leads: newRecords.length,
          duplicates: records.length - newRecords.length,
          cost: actualCost,
        })

        return NextResponse.json({
          success: true,
          leads: insertedLeads,
          pulled: newRecords.length,
          credits_charged: actualCost,
          new_balance: creditResult[0].new_balance,
          message: `Successfully pulled ${newRecords.length} leads${
            records.length > newRecords.length
              ? ` (${records.length - newRecords.length} duplicates skipped)`
              : ''
          }`,
        })
      } catch (alError) {
        safeError('[Segment Run] Pull error:', alError)
        return NextResponse.json(
          { error: 'Failed to pull leads' },
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

    safeError('[Segment Run] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
