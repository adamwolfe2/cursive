
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeParseFloat } from '@/lib/utils/parse-number'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const user = await fastAuth(request)
    if (!user) return unauthorized()

    // Verify preference belongs to workspace
    const { data: existing } = await supabase
      .from('lead_preferences')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', user.workspaceId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Preference not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }

    // Only update provided fields
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.target_industries !== undefined) updateData.target_industries = body.target_industries
    if (body.target_regions !== undefined) updateData.target_regions = body.target_regions
    if (body.target_company_sizes !== undefined) updateData.target_company_sizes = body.target_company_sizes
    if (body.target_intent_signals !== undefined) updateData.target_intent_signals = body.target_intent_signals
    if (body.max_leads_per_day !== undefined) updateData.max_leads_per_day = body.max_leads_per_day
    if (body.max_cost_per_lead !== undefined) {
      updateData.max_cost_per_lead = body.max_cost_per_lead ? safeParseFloat(body.max_cost_per_lead, { min: 0 }) : null
    }
    if (body.monthly_budget !== undefined) {
      updateData.monthly_budget = body.monthly_budget ? safeParseFloat(body.monthly_budget, { min: 0 }) : null
    }

    const { data: preference, error } = await supabase
      .from('lead_preferences')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', user.workspaceId) // Defense-in-depth
      .select('id, workspace_id, name, description, is_active, target_industries, target_regions, target_company_sizes, target_intent_signals, max_leads_per_day, max_cost_per_lead, monthly_budget, created_at, updated_at')
      .maybeSingle()

    if (error) {
      safeError('[Lead Preferences] Failed to update preference:', error)
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: preference })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const user = await fastAuth(request)
    if (!user) return unauthorized()

    // Delete preference (RLS will ensure workspace ownership)
    const { error } = await supabase
      .from('lead_preferences')
      .delete()
      .eq('id', id)
      .eq('workspace_id', user.workspaceId)

    if (error) {
      safeError('[Lead Preferences] Failed to delete preference:', error)
      return NextResponse.json({ error: 'Failed to delete preference' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
