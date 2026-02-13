/**
 * Individual Lead Operations API
 * CRUD operations for specific leads
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'

interface RouteContext {
  params: Promise<{ leadId: string }>
}

/**
 * GET /api/leads/[leadId]
 * Get a specific lead
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await context.params
    const supabase = await createClient()

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    safeError('[Leads API] GET error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/leads/[leadId]
 * Soft delete a lead (GDPR-compliant)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await context.params
    const supabase = await createClient()

    // Verify lead exists and belongs to workspace
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, email, workspace_id')
      .eq('id', leadId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Soft delete using SQL function
    // This sets deleted_at and deleted_by columns
    const { data: result, error: deleteError } = await supabase
      .rpc('soft_delete_lead', {
        p_lead_id: leadId,
        p_deleted_by: user.id,
      })

    if (deleteError) {
      safeError('[Leads API] Soft delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      )
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      workspace_id: user.workspace_id,
      action: 'lead.deleted',
      resource_type: 'lead',
      resource_id: leadId,
      metadata: {
        email: lead.email,
        deleted_via: 'api',
      },
    })

    return NextResponse.json({
      success: true,
      deleted: result,
      message: 'Lead deleted successfully. Will be permanently removed after 30 days.',
    })
  } catch (error) {
    safeError('[Leads API] DELETE error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/leads/[leadId]
 * Update a specific lead
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await context.params
    const body = await request.json()
    const supabase = await createClient()

    // Only allow updating certain fields
    const allowedFields = [
      'first_name',
      'last_name',
      'company_name',
      'job_title',
      'phone',
      'linkedin_url',
      'notes',
    ]

    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Verify ownership and update
    const { data: lead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .eq('workspace_id', user.workspace_id)
      .select()
      .single()

    if (error) {
      safeError('[Leads API] PATCH error:', error)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    safeError('[Leads API] PATCH error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
