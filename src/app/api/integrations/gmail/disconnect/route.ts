/**
 * POST /api/integrations/gmail/disconnect
 *
 * Body: { account_id: string }
 *
 * Removes a connected Gmail account from the workspace. Auth-required.
 * Workspace ownership enforced via the service.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { disconnectAccount } from '@/lib/services/gmail/email-account.service'

const bodySchema = z.object({
  account_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const body = await request.json()
    const { account_id } = bodySchema.parse(body)

    await disconnectAccount(account_id, user.workspace_id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
