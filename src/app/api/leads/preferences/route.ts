export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (session-based for read-only perf)
    const { data: { session } } = await supabase.auth.getSession()
    const authUser = session?.user ?? null
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Get preferences
    const { data: preferences, error } = await supabase
      .from('lead_preferences')
      .select('id, workspace_id, name, description, target_industries, target_regions, target_company_sizes, target_intent_signals, max_leads_per_day, max_cost_per_lead, monthly_budget, created_at, updated_at')
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: preferences })
  } catch (error: any) {
    safeError('Get lead preferences error:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      description,
      target_industries,
      target_regions,
      target_company_sizes,
      target_intent_signals,
      max_leads_per_day,
      max_cost_per_lead,
      monthly_budget,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Create preference
    const { data: preference, error } = await supabase
      .from('lead_preferences')
      .insert({
        workspace_id: user.workspace_id,
        name,
        description,
        target_industries: target_industries || [],
        target_regions: target_regions || [],
        target_company_sizes: target_company_sizes || [],
        target_intent_signals: target_intent_signals || [],
        max_leads_per_day: max_leads_per_day || 10,
        max_cost_per_lead: max_cost_per_lead ? parseFloat(max_cost_per_lead) : null,
        monthly_budget: monthly_budget ? parseFloat(monthly_budget) : null,
      })
      .select('id, workspace_id, name, description, target_industries, target_regions, target_company_sizes, target_intent_signals, max_leads_per_day, max_cost_per_lead, monthly_budget, created_at, updated_at')
      .single()

    if (error) {
      safeError('Create preference error:', error)
      return NextResponse.json({ error: 'Failed to create preference' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: preference })
  } catch (error: any) {
    safeError('Create lead preference error:', error)
    return NextResponse.json({ error: 'Failed to create preference' }, { status: 500 })
  }
}
