/**
 * Admin marketplace overview — cross-workspace install metrics.
 *
 * For Cursive ops only. Returns aggregate state of all GHL + Shopify
 * installs system-wide: counts by status, recent failures, sync volume.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin()
    const admin = createAdminClient()

    // Aggregate counts by source + status
    const [installsRes, recentFailures, recentSyncs] = await Promise.all([
      admin
        .from('app_installs')
        .select('id, source, status, pixel_deployment_status, plan_tier, sync_visitors_enabled, external_name, external_id, workspace_id, installed_at, last_visitor_sync_at, visitor_sync_count')
        .order('installed_at', { ascending: false }),
      admin
        .from('marketplace_webhook_events')
        .select('source, topic, status, error_message, created_at, install_id')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(20),
      admin
        .from('marketplace_sync_log')
        .select('id, source, job_type, status, visitors_processed, visitors_synced, visitors_failed, error_message, started_at, completed_at, install_id')
        .order('started_at', { ascending: false })
        .limit(50),
    ])

    const installs = installsRes.data ?? []

    // Compute summary metrics
    const summary = {
      ghl: {
        total: 0,
        active: 0,
        uninstalled: 0,
        pixel_active: 0,
        pixel_pending: 0,
        sync_enabled: 0,
      },
      shopify: {
        total: 0,
        active: 0,
        uninstalled: 0,
        pixel_active: 0,
        pixel_pending: 0,
        sync_enabled: 0,
      },
    }

    for (const i of installs) {
      const bucket = summary[i.source as 'ghl' | 'shopify']
      if (!bucket) continue
      bucket.total++
      if (i.status === 'active') bucket.active++
      if (i.status === 'uninstalled') bucket.uninstalled++
      if (i.pixel_deployment_status === 'active') bucket.pixel_active++
      if (i.pixel_deployment_status === 'pending') bucket.pixel_pending++
      if (i.sync_visitors_enabled) bucket.sync_enabled++
    }

    return NextResponse.json({
      summary,
      installs,
      recent_failures: recentFailures.data ?? [],
      recent_syncs: recentSyncs.data ?? [],
    })
  } catch (err) {
    return handleApiError(err)
  }
}
