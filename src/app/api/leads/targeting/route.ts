export const runtime = 'edge'

/**
 * User Targeting Preferences API
 *
 * Manages user-level targeting preferences for lead routing.
 * Follows repository pattern as per CLAUDE.md guidelines.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'
import { createClient } from '@/lib/supabase/server'

// Zod validation schema
const targetingSchema = z.object({
  target_industries: z.array(z.string()).optional().default([]),
  target_states: z.array(z.string()).optional().default([]),
  target_cities: z.array(z.string()).max(100).optional().default([]),
  target_zips: z.array(z.string()).max(200).optional().default([]),
  daily_lead_cap: z.number().int().min(0).max(10000).nullable().optional(),
  weekly_lead_cap: z.number().int().min(0).max(50000).nullable().optional(),
  monthly_lead_cap: z.number().int().min(0).max(200000).nullable().optional(),
  email_notifications: z.boolean().optional().default(true),
  is_active: z.boolean().optional().default(true),
})

type TargetingInput = z.infer<typeof targetingSchema>

/**
 * GET /api/leads/targeting
 * Fetch current user's targeting preferences
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authUser = session?.user ?? null

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get targeting preferences
    const { data: targeting, error } = await supabase
      .from('user_targeting')
      .select('*')
      .eq('user_id', userProfile.id)
      .eq('workspace_id', userProfile.workspace_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (acceptable)
      safeError('Failed to fetch targeting preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch targeting preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: targeting })
  } catch (error: any) {
    safeError('Get targeting preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch targeting preferences' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/leads/targeting
 * Create or update user's targeting preferences
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (use getUser for write operations per Supabase docs)
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()

    let validatedData: TargetingInput
    try {
      validatedData = targetingSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationError.errors,
          },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Check if targeting record exists
    const { data: existing } = await supabase
      .from('user_targeting')
      .select('id')
      .eq('user_id', userProfile.id)
      .eq('workspace_id', userProfile.workspace_id)
      .single()

    const targetingData = {
      user_id: userProfile.id,
      workspace_id: userProfile.workspace_id,
      target_industries: validatedData.target_industries,
      target_states: validatedData.target_states,
      target_cities: validatedData.target_cities,
      target_zips: validatedData.target_zips,
      daily_lead_cap: validatedData.daily_lead_cap,
      weekly_lead_cap: validatedData.weekly_lead_cap,
      monthly_lead_cap: validatedData.monthly_lead_cap,
      email_notifications: validatedData.email_notifications,
      is_active: validatedData.is_active,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_targeting')
        .update(targetingData)
        .eq('id', existing.id)
        .eq('user_id', userProfile.id) // SECURITY: Double-check user_id
        .eq('workspace_id', userProfile.workspace_id) // SECURITY: Double-check workspace_id
        .select()
        .single()

      if (error) {
        safeError('Failed to update targeting preferences:', error)
        return NextResponse.json(
          { error: 'Failed to update targeting preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('user_targeting')
        .insert(targetingData)
        .select()
        .single()

      if (error) {
        safeError('Failed to create targeting preferences:', error)
        return NextResponse.json(
          { error: 'Failed to create targeting preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data }, { status: 201 })
    }
  } catch (error: any) {
    safeError('Save targeting preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to save targeting preferences' },
      { status: 500 }
    )
  }
}
