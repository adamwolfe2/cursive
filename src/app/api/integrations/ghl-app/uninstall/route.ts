/**
 * GHL Marketplace App — manual uninstall trigger.
 *
 * GHL primarily delivers uninstalls via the AppUninstall webhook (handled
 * separately at /api/webhooks/ghl-app). This endpoint exists for:
 *  - manual disconnect from the Cursive portal Settings UI
 *  - admin support actions
 *
 * Marks the install as 'uninstalled', clears tokens, and revokes the
 * corresponding API key so the install can no longer reach our APIs.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

const BodySchema = z.object({
  install_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const { install_id } = BodySchema.parse(body)

    const admin = createAdminClient()

    // Confirm the install belongs to the user's workspace
    const { data: install } = await admin
      .from('app_installs')
      .select('id, workspace_id, source, status, external_id')
      .eq('id', install_id)
      .maybeSingle()

    if (!install || install.workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Install not found' }, { status: 404 })
    }

    if (install.source !== 'ghl') {
      return NextResponse.json({ error: 'Wrong source for this endpoint' }, { status: 400 })
    }

    // Mark uninstalled + clear tokens (defense in depth — even if they re-auth,
    // the old tokens shouldn't be reusable from a stale row)
    await admin
      .from('app_installs')
      .update({
        status: 'uninstalled',
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        uninstalled_at: new Date().toISOString(),
      })
      .eq('id', install.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    safeError('[ghl-app uninstall]', err)
    return handleApiError(err)
  }
}
