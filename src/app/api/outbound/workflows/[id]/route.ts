/**
 * GET    /api/outbound/workflows/[id] — fetch a single workflow
 * PATCH  /api/outbound/workflows/[id] — update name/icp/persona/product/filters/tone
 * DELETE /api/outbound/workflows/[id] — soft-disable (sets outbound_enabled=false)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, NotFoundError } from '@/lib/utils/api-error-handler'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import type { OutboundFilters } from '@/types/outbound'

const filterSchema = z.object({
  industries: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  zips: z.array(z.string()).optional(),
  seniority_levels: z
    .array(
      z.enum([
        'C-Suite',
        'VP',
        'Director',
        'Manager',
        'Individual Contributor',
        'Entry Level',
      ])
    )
    .optional(),
  job_titles: z.array(z.string()).optional(),
  departments: z.array(z.string()).optional(),
  company_sizes: z.array(z.string()).optional(),
  employee_count: z
    .object({ min: z.number().optional(), max: z.number().optional() })
    .optional(),
  company_revenue: z
    .object({ min: z.number().optional(), max: z.number().optional() })
    .optional(),
  sic: z.array(z.string()).optional(),
  naics: z.array(z.string()).optional(),
  cap_per_run: z.number().int().min(1).max(100).optional(),
}).strict()

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  icp_text: z.string().max(8000).nullable().optional(),
  persona_text: z.string().max(8000).nullable().optional(),
  product_text: z.string().max(8000).nullable().optional(),
  tone: z.enum(['casual', 'professional', 'friendly', 'formal']).optional(),
  outbound_filters: filterSchema.optional(),
  outbound_auto_approve: z.boolean().optional(),
})

const agentRepo = new AgentRepository()

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const agent = await agentRepo.findOutboundById(id, user.workspace_id)
    if (!agent) throw new NotFoundError('Workflow not found')

    return NextResponse.json({ data: agent })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.parse(body)

    const updated = await agentRepo.updateOutboundConfig(id, user.workspace_id, {
      ...(parsed.name !== undefined && { name: parsed.name }),
      ...(parsed.tone !== undefined && { tone: parsed.tone }),
      ...(parsed.icp_text !== undefined && { icp_text: parsed.icp_text }),
      ...(parsed.persona_text !== undefined && { persona_text: parsed.persona_text }),
      ...(parsed.product_text !== undefined && { product_text: parsed.product_text }),
      ...(parsed.outbound_filters !== undefined && {
        outbound_filters: parsed.outbound_filters as OutboundFilters,
      }),
      ...(parsed.outbound_auto_approve !== undefined && {
        outbound_auto_approve: parsed.outbound_auto_approve,
      }),
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    // Soft-disable rather than delete — preserves history (runs, drafts, replies)
    await agentRepo.updateOutboundConfig(id, user.workspace_id, {
      outbound_enabled: false,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
