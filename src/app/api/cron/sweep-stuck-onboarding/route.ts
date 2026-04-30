/**
 * Sweep Stuck Onboarding Pipelines (Vercel Cron)
 *
 * Runs every 10 minutes. Finds onboarding clients whose intake pipeline
 * stalled (after() never fired, function died mid-run, etc.) and re-fires
 * the inline runner. The runner is idempotent — already-complete stages
 * are skipped so cost is bounded.
 *
 * Cost safety:
 *  - Max 5 clients processed per run (rate limit)
 *  - Max 3 retries per client tracked via automation_log; after that the
 *    client is marked failed and requires manual intervention
 *  - Skip clients older than 24h (likely abandoned)
 *  - Cron itself is ~free; the cost concern is Claude API calls in the
 *    pipeline. The retry cap puts a hard ceiling on total spend.
 *
 * Auth: CRON_SECRET Bearer (Vercel sends automatically).
 */

export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { AutomationLogEntry } from '@/types/onboarding'

const MAX_CLIENTS_PER_RUN = 5
const MAX_RETRIES_PER_CLIENT = 3
// Threshold must be larger than the runner's 5-min concurrency-guard window
// AND larger than the runner's maxDuration (300s = 5 min). 10 min gives a
// comfortable buffer so the sweeper never grabs a pipeline that's mid-run.
const STUCK_THRESHOLD_MINUTES = 10
const MAX_AGE_HOURS = 24
const SWEEP_LOG_STEP = 'pipeline_sweep_retry'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const repo = new OnboardingClientRepository()
    const stuckThreshold = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString()
    const maxAgeThreshold = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()

    // Find candidates: enrichment OR copy_generation stuck in pending/processing,
    // updated_at older than threshold, created within last 24h, not permanently failed.
    const { data: candidates, error } = await supabase
      .from('onboarding_clients')
      .select('id, company_name, enrichment_status, copy_generation_status, automation_log, updated_at')
      .or('enrichment_status.in.(pending,processing),copy_generation_status.in.(pending,processing)')
      .lt('updated_at', stuckThreshold)
      .gte('created_at', maxAgeThreshold)
      .order('updated_at', { ascending: true })
      .limit(MAX_CLIENTS_PER_RUN * 2) // over-fetch, may filter some out

    if (error) {
      safeError('[Sweep] Query failed:', error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

    if (!baseUrl) {
      return NextResponse.json({ error: 'No base URL configured' }, { status: 500 })
    }

    const results: Array<{ id: string; company: string; action: string; retries: number }> = []
    let processed = 0

    for (const client of candidates ?? []) {
      if (processed >= MAX_CLIENTS_PER_RUN) break

      const log = (client.automation_log as AutomationLogEntry[] | null) ?? []
      const retryCount = log.filter((e) => e.step === SWEEP_LOG_STEP).length

      // Hard cap — give up and mark failed so we never retry again
      if (retryCount >= MAX_RETRIES_PER_CLIENT) {
        const updates: Record<string, string> = {
          updated_at: new Date().toISOString(),
        }
        if (client.enrichment_status === 'pending' || client.enrichment_status === 'processing') {
          updates.enrichment_status = 'failed'
        }
        if (client.copy_generation_status === 'pending' || client.copy_generation_status === 'processing') {
          updates.copy_generation_status = 'failed'
        }
        await supabase.from('onboarding_clients').update(updates).eq('id', client.id)
        await repo.appendAutomationLog(client.id, {
          step: SWEEP_LOG_STEP,
          status: 'failed',
          error: `Gave up after ${MAX_RETRIES_PER_CLIENT} retries — manual intervention required`,
          timestamp: new Date().toISOString(),
        })
        results.push({ id: client.id, company: client.company_name, action: 'gave_up', retries: retryCount })
        continue
      }

      // Log the retry attempt BEFORE firing so even if the runner crashes the
      // counter still increments — prevents infinite loops.
      await repo.appendAutomationLog(client.id, {
        step: SWEEP_LOG_STEP,
        status: 'complete',
        timestamp: new Date().toISOString(),
      })

      // Fire-and-forget the runner. Don't await — let it run in its own function.
      fetch(`${baseUrl}/api/admin/onboarding/${client.id}/run-pipeline-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-automation-secret': process.env.AUTOMATION_SECRET || '',
        },
      }).catch((e) => {
        safeError(`[Sweep] Failed to dispatch runner for ${client.id}:`, e)
      })

      results.push({
        id: client.id,
        company: client.company_name,
        action: 'retried',
        retries: retryCount + 1,
      })
      processed += 1
    }

    return NextResponse.json({
      ok: true,
      processed,
      candidates_found: candidates?.length ?? 0,
      results,
    })
  } catch (error) {
    safeError('[Sweep] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
