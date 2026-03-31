// Direct enrichment executor — bypasses Inngest, runs Claude enrichment + copy gen in-process
// Protected by automation secret. Use from admin when Inngest pipeline stalls.
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { enrichClientICP } from '@/lib/services/onboarding/claude-enrichment'
import { generateEmailSequences } from '@/lib/services/onboarding/copy-generation'
import { needsOutboundSetup } from '@/types/onboarding'
import type { PackageSlug } from '@/types/onboarding'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  client_id: z.string().uuid(),
})

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-automation-secret')
  return !!process.env.AUTOMATION_SECRET && secret === process.env.AUTOMATION_SECRET
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { client_id } = parsed.data
  const repo = new OnboardingClientRepository()

  const client = await repo.findById(client_id)
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  safeLog(`[Direct Enrichment] Starting for ${client.company_name} (${client_id})`)

  // ── Step 1: ICP Enrichment ────────────────────────────────────────────────
  await repo.update(client_id, { enrichment_status: 'processing' })

  let icpBrief
  try {
    icpBrief = await enrichClientICP(client)
    await repo.update(client_id, {
      enriched_icp_brief: icpBrief,
      enrichment_status: 'complete',
    })
    await repo.appendAutomationLog(client_id, {
      step: 'enrichment',
      status: 'complete',
      timestamp: new Date().toISOString(),
    })
    safeLog(`[Direct Enrichment] ICP enrichment complete for ${client_id}`)
  } catch (err: any) {
    await repo.update(client_id, { enrichment_status: 'failed' })
    await repo.appendAutomationLog(client_id, {
      step: 'enrichment',
      status: 'failed',
      error: err.message,
      timestamp: new Date().toISOString(),
    })
    safeError(`[Direct Enrichment] Enrichment failed: ${err.message}`)
    return NextResponse.json({ error: `Enrichment failed: ${err.message}` }, { status: 500 })
  }

  // ── Step 2: Copy Generation (outbound clients only) ───────────────────────
  const packages = (client.packages_selected ?? []) as PackageSlug[]
  if (!needsOutboundSetup(packages)) {
    await repo.update(client_id, { copy_generation_status: 'not_applicable' })
    return NextResponse.json({ success: true, enrichment: 'complete', copy: 'not_applicable' })
  }

  await repo.update(client_id, { copy_generation_status: 'processing' })

  try {
    const sequences = await generateEmailSequences(client, icpBrief)
    await repo.update(client_id, {
      draft_sequences: sequences,
      copy_generation_status: 'complete',
      copy_approval_status: 'pending',
    })
    await repo.appendAutomationLog(client_id, {
      step: 'copy_generation',
      status: 'complete',
      timestamp: new Date().toISOString(),
    })
    safeLog(`[Direct Enrichment] Copy generation complete for ${client_id}`)
    return NextResponse.json({ success: true, enrichment: 'complete', copy: 'complete' })
  } catch (err: any) {
    await repo.update(client_id, { copy_generation_status: 'failed' })
    await repo.appendAutomationLog(client_id, {
      step: 'copy_generation',
      status: 'failed',
      error: err.message,
      timestamp: new Date().toISOString(),
    })
    safeError(`[Direct Enrichment] Copy generation failed: ${err.message}`)
    return NextResponse.json({
      error: `Copy generation failed: ${err.message}`,
      enrichment: 'complete',
    }, { status: 500 })
  }
}
