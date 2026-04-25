/**
 * GHL embed wizard — pixel state polling endpoint.
 *
 * Used by the embed wizard page to detect when the first visitor event has
 * been received. Flips deployment_status from 'pending' → 'active' on the
 * first event and returns current state to the polling client.
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

    const { data: install } = await admin
      .from('app_installs')
      .select('id, workspace_id, source, pixel_id, pixel_install_url, pixel_deployment_status, first_event_at, external_name')
      .eq('id', install_id)
      .maybeSingle()

    if (!install || install.workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Install not found' }, { status: 404 })
    }

    // If we don't yet show 'active', check leads table for first event
    let currentStatus = install.pixel_deployment_status
    let firstEventAt = install.first_event_at

    if (currentStatus !== 'active' && install.pixel_id) {
      const { data: firstLead } = await admin
        .from('leads')
        .select('created_at')
        .eq('workspace_id', install.workspace_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (firstLead?.created_at) {
        currentStatus = 'active'
        firstEventAt = firstLead.created_at
        await admin
          .from('app_installs')
          .update({
            pixel_deployment_status: 'active',
            first_event_at: firstLead.created_at,
          })
          .eq('id', install.id)
      }
    }

    return NextResponse.json({
      install_id: install.id,
      external_name: install.external_name,
      pixel_id: install.pixel_id,
      pixel_install_url: install.pixel_install_url,
      pixel_snippet: install.pixel_install_url
        ? `<script src="${install.pixel_install_url}" defer></script>`
        : null,
      deployment_status: currentStatus,
      first_event_at: firstEventAt,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
