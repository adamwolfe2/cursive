
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

const createPreferenceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  target_industries: z.array(z.string()).default([]),
  target_regions: z.array(z.string()).default([]),
  target_company_sizes: z.array(z.string()).default([]),
  target_intent_signals: z.array(z.string()).default([]),
  max_leads_per_day: z.number().int().min(1).max(10000).default(10),
  max_cost_per_lead: z.number().min(0).max(10000).optional().nullable(),
  monthly_budget: z.number().min(0).max(1000000).optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const supabase = await createClient()

    // Get preferences
    const { data: preferences, error } = await supabase
      .from('lead_preferences')
      .select('id, workspace_id, name, description, target_industries, target_regions, target_company_sizes, target_intent_signals, max_leads_per_day, max_cost_per_lead, monthly_budget, created_at, updated_at')
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[Lead Preferences] Failed to fetch:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: preferences })
  } catch (error: any) {
    safeError('[Lead Preferences] Get error:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const supabase = await createClient()

    const body = await request.json()
    const validationResult = createPreferenceSchema.safeParse(body)

    if (!validationResult.success) {
      if (validationResult.error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: validationResult.error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const validated = validationResult.data

    // Create preference
    const { data: preference, error } = await supabase
      .from('lead_preferences')
      .insert({
        workspace_id: user.workspace_id,
        name: validated.name,
        description: validated.description,
        target_industries: validated.target_industries,
        target_regions: validated.target_regions,
        target_company_sizes: validated.target_company_sizes,
        target_intent_signals: validated.target_intent_signals,
        max_leads_per_day: validated.max_leads_per_day,
        max_cost_per_lead: validated.max_cost_per_lead ?? null,
        monthly_budget: validated.monthly_budget ?? null,
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
