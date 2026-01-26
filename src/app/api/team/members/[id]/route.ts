// Team Member Detail API
// PATCH /api/team/members/[id] - Update member role
// DELETE /api/team/members/[id] - Remove member from workspace

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, forbidden, success, badRequest } from '@/lib/utils/api-error-handler'

interface RouteContext {
  params: Promise<{ id: string }>
}

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
})

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Check if user has permission (owner or admin)
    if (user.role !== 'owner' && user.role !== 'admin') {
      return forbidden('Only owners and admins can update member roles')
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validationResult = updateRoleSchema.safeParse(body)

    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0]?.message || 'Invalid request')
    }

    const { role } = validationResult.data

    // 4. Update user role using database function
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('update_user_role', {
      p_user_id: id,
      p_new_role: role,
      p_updated_by: user.id,
    })

    if (error) {
      if (error.message.includes('Insufficient permissions')) {
        return forbidden('Insufficient permissions')
      }
      if (error.message.includes('Cannot change owner role')) {
        return forbidden('Cannot change owner role')
      }
      if (error.message.includes('Only owners can promote')) {
        return forbidden('Only owners can promote to admin')
      }
      throw new Error(`Failed to update role: ${error.message}`)
    }

    return success({ message: 'Role updated successfully', user: data })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Check if user has permission (owner or admin)
    if (user.role !== 'owner' && user.role !== 'admin') {
      return forbidden('Only owners and admins can remove members')
    }

    // 3. Remove user from workspace using database function
    const supabase = await createClient()
    const { error } = await supabase.rpc('remove_user_from_workspace', {
      p_user_id: id,
      p_removed_by: user.id,
    })

    if (error) {
      if (error.message.includes('Insufficient permissions')) {
        return forbidden('Insufficient permissions')
      }
      if (error.message.includes('Cannot remove workspace owner')) {
        return forbidden('Cannot remove workspace owner')
      }
      if (error.message.includes('Cannot remove yourself')) {
        return forbidden('Cannot remove yourself')
      }
      if (error.message.includes('Admins cannot remove other admins')) {
        return forbidden('Admins cannot remove other admins')
      }
      throw new Error(`Failed to remove member: ${error.message}`)
    }

    return success({ message: 'Member removed successfully' })
  } catch (error: any) {
    return handleApiError(error)
  }
}
