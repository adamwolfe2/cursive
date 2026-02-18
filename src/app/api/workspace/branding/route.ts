/**
 * Workspace Branding API
 * Get and update workspace branding (colors, logo)
 */


import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const hexColorRegex = /^#[0-9a-fA-F]{6}$/

const updateSchema = z.object({
  primary_color: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
  secondary_color: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
  accent_color: z.string().regex(hexColorRegex, 'Must be a valid hex color').nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
})

/**
 * GET /api/workspace/branding
 * Get current workspace branding
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', user.workspace_id)
      .single()

    if (error) {
      return badRequest('Failed to fetch branding')
    }

    const branding = (data?.branding as Record<string, unknown>) || {}

    return success({
      branding: {
        primary_color: branding.primary_color || '#3b82f6',
        secondary_color: branding.secondary_color || '#3b82f6',
        accent_color: branding.accent_color || null,
        logo_url: branding.logo_url || null,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/workspace/branding
 * Update workspace branding
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const supabase = await createClient()

    // Get current branding
    const { data: current, error: fetchError } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', user.workspace_id)
      .single()

    if (fetchError) {
      return badRequest('Failed to fetch current branding')
    }

    const currentBranding = (current?.branding as Record<string, unknown>) || {}

    // Merge updates into current branding
    const updatedBranding = {
      ...currentBranding,
      ...(validated.primary_color !== undefined && { primary_color: validated.primary_color }),
      ...(validated.secondary_color !== undefined && { secondary_color: validated.secondary_color }),
      ...(validated.accent_color !== undefined && { accent_color: validated.accent_color }),
      ...(validated.logo_url !== undefined && { logo_url: validated.logo_url }),
    }

    const { error: updateError } = await supabase
      .from('workspaces')
      .update({ branding: updatedBranding })
      .eq('id', user.workspace_id)

    if (updateError) {
      return badRequest('Failed to update branding')
    }

    return success({
      message: 'Branding updated successfully',
      branding: updatedBranding,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
