
/**
 * User Targeting Preferences API
 *
 * Manages user-level targeting preferences for lead routing.
 * Follows repository pattern as per CLAUDE.md guidelines.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getCurrentUser } from '@/lib/auth/helpers'
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
    const userProfile = await getCurrentUser()
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get targeting preferences
    const { data: targeting, error } = await supabase
      .from('user_targeting')
      .select('*')
      .eq('user_id', userProfile.id)
      .eq('workspace_id', userProfile.workspace_id)
      .maybeSingle()

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
    const userProfile = await getCurrentUser()
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

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
      .maybeSingle()

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

    let savedData: unknown

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_targeting')
        .update(targetingData)
        .eq('id', existing.id)
        .eq('user_id', userProfile.id) // SECURITY: Double-check user_id
        .eq('workspace_id', userProfile.workspace_id) // SECURITY: Double-check workspace_id
        .select()
        .maybeSingle()

      if (error) {
        safeError('Failed to update targeting preferences:', error)
        return NextResponse.json(
          { error: 'Failed to update targeting preferences' },
          { status: 500 }
        )
      }

      savedData = data
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('user_targeting')
        .insert(targetingData)
        .select()
        .maybeSingle()

      if (error) {
        safeError('Failed to create targeting preferences:', error)
        return NextResponse.json(
          { error: 'Failed to create targeting preferences' },
          { status: 500 }
        )
      }

      savedData = data
    }

    // Sync users.industry_segment and users.location_segment so the daily
    // distribution job picks up the updated targeting immediately.
    const primaryIndustry = validatedData.target_industries[0]
    const primaryState = validatedData.target_states[0]

    if (primaryIndustry || primaryState) {
      const segmentUpdate: Record<string, string> = {}
      if (primaryIndustry) {
        segmentUpdate.industry_segment = primaryIndustry.toLowerCase().replace(/\s+/g, '_')
      }
      if (primaryState) {
        segmentUpdate.location_segment = primaryState.toLowerCase()
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update(segmentUpdate)
        .eq('id', userProfile.id)

      if (userUpdateError) {
        // Non-fatal: log but don't fail the whole request
        safeError('Failed to sync user segment fields:', userUpdateError)
      }
    }

    // Look up the matching AudienceLab segment so we can confirm coverage
    let segmentName: string | null = null
    if (primaryIndustry && primaryState) {
      const industryKey = primaryIndustry.toLowerCase().replace(/\s+/g, '_')
      const locationKey = primaryState.toLowerCase()

      const { data: segmentMapping } = await supabase
        .from('audience_lab_segments')
        .select('segment_name')
        .eq('industry', industryKey)
        .eq('location', locationKey)
        .maybeSingle()

      segmentName = segmentMapping?.segment_name ?? null
    }

    const statusCode = existing ? 200 : 201
    return NextResponse.json(
      { success: true, data: savedData, segment_name: segmentName },
      { status: statusCode }
    )
  } catch (error: any) {
    safeError('Save targeting preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to save targeting preferences' },
      { status: 500 }
    )
  }
}
