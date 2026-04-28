// Synchronous pipeline runner — bypasses Inngest entirely.
// Runs enrichment + copy generation inline so admins can unblock a client
// even if Inngest is misconfigured or the function isn't deployed.
//
// Skips Slack / email / CRM sync (non-critical, can be retried separately).
//
// Auth: admin session OR x-automation-secret header (so server actions can
// fire-and-forget this endpoint via after()).

export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { enrichClientICP } from '@/lib/services/onboarding/claude-enrichment'
import { generateEmailSequences } from '@/lib/services/onboarding/copy-generation'
import { checkCopyQuality } from '@/lib/services/onboarding/copy-quality-check'
import { needsOutboundSetup } from '@/types/onboarding'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { PackageSlug } from '@/types/onboarding'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = request.headers.get('x-automation-secret')
  const expectedSecret = process.env.AUTOMATION_SECRET
  if (expectedSecret && secret === expectedSecret) return true

  try {
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()
    return true
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id: clientId } = await params

    const repo = new OnboardingClientRepository()
    const client = await repo.findById(clientId)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const result: { enrichment: string; copy: string; errors: string[] } = {
      enrichment: 'skipped',
      copy: 'skipped',
      errors: [],
    }

    // 1. Enrichment — only if not already complete
    let icpBrief = client.enriched_icp_brief
    if (client.enrichment_status !== 'complete' || !icpBrief) {
      await repo.update(clientId, { enrichment_status: 'processing' })
      try {
        icpBrief = await enrichClientICP(client)
        await repo.update(clientId, {
          enriched_icp_brief: icpBrief as any,
          enrichment_status: 'complete',
        })
        await repo.appendAutomationLog(clientId, {
          step: 'enrichment',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
        result.enrichment = 'complete'
      } catch (e: any) {
        const msg = e?.message || 'Unknown enrichment error'
        await repo.update(clientId, { enrichment_status: 'failed' })
        await repo.appendAutomationLog(clientId, {
          step: 'enrichment',
          status: 'failed',
          error: msg,
          timestamp: new Date().toISOString(),
        })
        result.enrichment = 'failed'
        result.errors.push(`enrichment: ${msg}`)
        return NextResponse.json(result, { status: 500 })
      }
    } else {
      result.enrichment = 'already_complete'
    }

    // 2. Copy generation — only if outbound and not already complete
    const packages = client.packages_selected as PackageSlug[]
    const needsCopy = needsOutboundSetup(packages)

    if (!needsCopy) {
      await repo.update(clientId, {
        copy_generation_status: 'not_applicable',
        copy_approval_status: 'not_applicable',
      })
      result.copy = 'not_applicable'
    } else if (client.copy_generation_status !== 'complete') {
      await repo.update(clientId, { copy_generation_status: 'processing' })
      try {
        const seqs = await generateEmailSequences(client, icpBrief, checkCopyQuality)
        await repo.update(clientId, {
          draft_sequences: seqs as any,
          copy_generation_status: 'complete',
        })
        await repo.appendAutomationLog(clientId, {
          step: 'copy_generation',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
        result.copy = 'complete'
      } catch (e: any) {
        const msg = e?.message || 'Unknown copy generation error'
        await repo.update(clientId, { copy_generation_status: 'failed' })
        await repo.appendAutomationLog(clientId, {
          step: 'copy_generation',
          status: 'failed',
          error: msg,
          timestamp: new Date().toISOString(),
        })
        result.copy = 'failed'
        result.errors.push(`copy: ${msg}`)
        return NextResponse.json(result, { status: 500 })
      }
    } else {
      result.copy = 'already_complete'
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    safeError('[run-pipeline-sync] Error:', error)
    const msg = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
