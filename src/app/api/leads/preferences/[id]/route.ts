import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Verify preference belongs to workspace
    const { data: existing } = await supabase
      .from('lead_preferences')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .single()

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
      updateData.max_cost_per_lead = body.max_cost_per_lead ? parseFloat(body.max_cost_per_lead) : null
    }
    if (body.monthly_budget !== undefined) {
      updateData.monthly_budget = body.monthly_budget ? parseFloat(body.monthly_budget) : null
    }

    const { data: preference, error } = await supabase
      .from('lead_preferences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: preference })
  } catch (error: any) {
    console.error('Update lead preference error:', error)
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Delete preference (RLS will ensure workspace ownership)
    const { error } = await supabase
      .from('lead_preferences')
      .delete()
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete preference' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete lead preference error:', error)
    return NextResponse.json({ error: 'Failed to delete preference' }, { status: 500 })
  }
}
