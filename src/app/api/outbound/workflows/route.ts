/**
 * GET  /api/outbound/workflows  — list outbound-enabled agents for the workspace
 * POST /api/outbound/workflows  — create a new outbound workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
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

const createSchema = z.object({
  name: z.string().min(1).max(120),
  icp_text: z.string().max(8000).optional().nullable(),
  persona_text: z.string().max(8000).optional().nullable(),
  product_text: z.string().max(8000).optional().nullable(),
  tone: z.enum(['casual', 'professional', 'friendly', 'formal']).default('professional'),
  outbound_filters: filterSchema.default({}),
  outbound_auto_approve: z.boolean().default(false),
})

const agentRepo = new AgentRepository()

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const workflows = await agentRepo.findOutboundEnabled(user.workspace_id)
    return NextResponse.json({ data: workflows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const body = await request.json()
    const parsed = createSchema.parse(body)

    const created = await agentRepo.create({
      workspace_id: user.workspace_id,
      name: parsed.name,
      tone: parsed.tone,
      // The agents table requires ai_provider/ai_model — supply harmless defaults.
      // Outbound flow uses Anthropic globally; these fields are vestigial but not nullable.
      ai_provider: 'anthropic',
      ai_model: 'claude-haiku-4-5-20251001',
    } as any)

    // Now update with outbound-specific fields
    const updated = await agentRepo.updateOutboundConfig(created.id, user.workspace_id, {
      outbound_enabled: true,
      outbound_auto_approve: parsed.outbound_auto_approve,
      icp_text: parsed.icp_text ?? null,
      persona_text: parsed.persona_text ?? null,
      product_text: parsed.product_text ?? null,
      outbound_filters: parsed.outbound_filters as OutboundFilters,
    })

    return NextResponse.json({ data: updated }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
