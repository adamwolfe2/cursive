// Team Invite Detail API
// DELETE /api/team/invites/[id] - Cancel an invite

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, forbidden, notFound, success } from '@/lib/utils/api-error-handler'

interface RouteContext {
  params: Promise<{ id: string }>
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
      return forbidden('Only owners and admins can cancel invites')
    }

    // 3. Cancel the invite
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('team_invites')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Invite not found or already processed')
      }
      throw new Error(`Failed to cancel invite: ${error.message}`)
    }

    return success({ message: 'Invite cancelled successfully' })
  } catch (error: any) {
    return handleApiError(error)
  }
}
