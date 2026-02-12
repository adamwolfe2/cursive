/**
 * Database Health Check Cron
 *
 * GET /api/cron/db-health
 *
 * Runs nightly security and performance checks:
 *   1. check_rls_regression() — detects bare auth.uid(), broad policies, PUBLIC execute grants
 *   2. audit_unused_indexes() — logs indexes with 0 scans for review
 *
 * Alerts to Slack only when state changes (dedupe via previous run comparison).
 * Results are also logged to security_events table by the DB functions.
 *
 * Schedule: Daily at 3:00 AM UTC (0 3 * * *)
 * Auth: CRON_SECRET Bearer token (Vercel Cron sends automatically).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Auth: Vercel Cron sends CRON_SECRET automatically
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const startTime = Date.now()
  const runId = crypto.randomUUID()
  const results: Record<string, unknown> = {}

  try {
    // Fetch previous run's findings for dedupe
    const { data: prevRun } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('event_type', 'rls_regression')
      .eq('event_category', 'security_audit')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const prevStatus = (prevRun?.metadata as Record<string, unknown>)?.status as string | undefined

    // 1. RLS regression check
    const { data: rlsData, error: rlsError } = await supabase.rpc(
      'check_rls_regression'
    )

    if (rlsError) {
      results.rls_regression = { error: rlsError.message }
    } else {
      results.rls_regression = rlsData

      // Alert only on state change: clean → drift, or first drift detection
      const currentStatus = rlsData?.status as string | undefined
      if (currentStatus !== 'clean' && prevStatus === 'clean') {
        await sendSlackAlert({
          type: 'system_health',
          severity: 'critical',
          message: 'RLS regression detected in nightly health check',
          metadata: {
            run_id: runId,
            bare_auth_uid: String(rlsData?.bare_auth_uid_policies ?? '?'),
            broad_policies: String(rlsData?.overly_broad_policies ?? '?'),
            public_execute: String(rlsData?.public_execute_functions ?? '?'),
            action: 'Review security_events table and run hardening migration',
          },
        })
      } else if (currentStatus === 'clean' && prevStatus !== 'clean' && prevStatus != null) {
        // Drift resolved — send recovery notification
        await sendSlackAlert({
          type: 'system_health',
          severity: 'info',
          message: 'RLS regression resolved — status is clean',
          metadata: { run_id: runId },
        })
      }
    }

    // 2. Unused index audit (14-day threshold)
    const { data: indexData, error: indexError } = await supabase.rpc(
      'audit_unused_indexes',
      { p_min_age_days: 14 }
    )

    if (indexError) {
      results.unused_indexes = { error: indexError.message }
    } else {
      results.unused_indexes = {
        count: indexData?.unused_index_count ?? 0,
        checked_at: indexData?.checked_at,
      }
    }

    const durationMs = Date.now() - startTime
    const rlsClean = (results.rls_regression as Record<string, unknown>)?.status === 'clean'
      || (results.rls_regression as Record<string, unknown>)?.error != null

    return NextResponse.json({
      success: true,
      run_id: runId,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
      rls_status: rlsClean ? 'clean' : 'drift_detected',
      ...results,
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'

    await sendSlackAlert({
      type: 'system_health',
      severity: 'error',
      message: 'Database health check cron failed',
      metadata: { run_id: runId, error: message, duration_ms: String(durationMs) },
    }).catch((error) => {
      safeError('[DB Health] Slack alert failed:', error)
    })

    return NextResponse.json(
      { error: 'Health check failed', detail: message, run_id: runId, duration_ms: durationMs },
      { status: 500 }
    )
  }
}
