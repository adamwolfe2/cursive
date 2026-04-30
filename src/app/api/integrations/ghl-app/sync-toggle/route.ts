/**
 * Toggle sync_visitors_enabled on a GHL install.
 * Called from the Settings UI.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const BodySchema = z.object({
  install_id: z.string().uuid(),
  enabled: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const { install_id, enabled } = BodySchema.parse(body)

    const admin = createAdminClient()

    const { error } = await admin
      .from('app_installs')
      .update({ sync_visitors_enabled: enabled })
      .eq('id', install_id)
      .eq('workspace_id', user.workspace_id)
      .eq('source', 'ghl')

    if (error) throw error

    return NextResponse.json({ success: true, enabled })
  } catch (err) {
    return handleApiError(err)
  }
}
