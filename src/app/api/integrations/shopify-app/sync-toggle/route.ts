/**
 * Toggle sync flags on a Shopify install:
 *  - sync_visitors_enabled (visitors → leads → portal — always on; this is the
 *    base feature, but we expose the toggle for parity with GHL)
 *  - sync_metafields_enabled (visitors → Shopify Customer metafields)
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const BodySchema = z.object({
  install_id: z.string().uuid(),
  field: z.enum(['sync_visitors_enabled', 'sync_metafields_enabled']),
  enabled: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const { install_id, field, enabled } = BodySchema.parse(body)

    const admin = createAdminClient()

    const { error } = await admin
      .from('app_installs')
      .update({ [field]: enabled })
      .eq('id', install_id)
      .eq('workspace_id', user.workspace_id)
      .eq('source', 'shopify')

    if (error) throw error

    return NextResponse.json({ success: true, [field]: enabled })
  } catch (err) {
    return handleApiError(err)
  }
}
