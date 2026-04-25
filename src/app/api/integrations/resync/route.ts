/**
 * Manual re-sync trigger.
 * Resets last_visitor_sync_at on the install and fires the appropriate
 * Inngest event so the next cron tick picks it up immediately.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const BodySchema = z.object({
  install_id: z.string().uuid(),
  // Optional — for installs without recent leads, lookback further
  lookback_hours: z.number().int().min(1).max(720).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const { install_id, lookback_hours = 24 } = BodySchema.parse(body)

    const admin = createAdminClient()

    const { data: install } = await admin
      .from('app_installs')
      .select('id, workspace_id, source, status')
      .eq('id', install_id)
      .maybeSingle()

    if (!install || install.workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Install not found' }, { status: 404 })
    }

    if (install.status !== 'active') {
      return NextResponse.json({ error: 'Install is not active' }, { status: 400 })
    }

    // Roll back last_visitor_sync_at so the next 6h cron picks up the
    // wider window. This is the same effect as a "force sync" without
    // running a separate Inngest job.
    const newCutoff = new Date(Date.now() - lookback_hours * 60 * 60 * 1000)
    await admin
      .from('app_installs')
      .update({ last_visitor_sync_at: newCutoff.toISOString() })
      .eq('id', install_id)

    // Insert a tracking row so the user sees "queued" immediately
    await admin.from('marketplace_sync_log').insert({
      install_id,
      workspace_id: install.workspace_id,
      source: install.source,
      job_type: install.source === 'ghl' ? 'contact_sync' : 'metafield_writeback',
      status: 'pending',
      visitors_processed: 0,
      metadata: {
        manual_resync: true,
        lookback_hours,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Re-sync queued. Will run on the next 6h cron tick (within minutes if forced).',
      cutoff: newCutoff.toISOString(),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
