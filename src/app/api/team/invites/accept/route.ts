// Accept Team Invite API
// POST /api/team/invites/accept - Accept an invite using token

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const validationResult = acceptInviteSchema.safeParse(body)

    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0]?.message || 'Invalid request')
    }

    const { token } = validationResult.data

    // 2. Get authenticated user
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return unauthorized('Please sign in to accept this invitation')
    }

    // 3. Accept invite using database function
    const { data: user, error } = await supabase.rpc('accept_team_invite', {
      p_token: token,
      p_auth_user_id: authUser.id,
    })

    if (error) {
      if (error.message.includes('Invalid or expired')) {
        return badRequest('This invitation is invalid or has expired')
      }
      if (error.message.includes('Email mismatch')) {
        return badRequest('Please sign in with the email address that was invited')
      }
      throw new Error(`Failed to accept invite: ${error.message}`)
    }

    return success({
      message: 'Invitation accepted successfully',
      user,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
