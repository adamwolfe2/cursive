/**
 * Per-install sync history viewer.
 * Returns the last 50 marketplace_sync_log rows for a given install.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const QuerySchema = z.object({
  install_id: z.string().uuid(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { install_id } = QuerySchema.parse({
      install_id: req.nextUrl.searchParams.get('install_id'),
    })

    const admin = createAdminClient()

    // Confirm ownership
    const { data: install } = await admin
      .from('app_installs')
      .select('id, workspace_id')
      .eq('id', install_id)
      .maybeSingle()

    if (!install || install.workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Install not found' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('marketplace_sync_log')
      .select('id, source, job_type, status, visitors_processed, visitors_synced, visitors_failed, error_message, metadata, started_at, completed_at')
      .eq('install_id', install_id)
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ logs: data ?? [] })
  } catch (err) {
    return handleApiError(err)
  }
}
