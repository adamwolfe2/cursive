/**
 * CRM Leads API - List and Create endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'
import type { LeadFilters } from '@/types/crm.types'

// Use edge runtime

export async function GET(req: NextRequest) {
  try {
    const user = await fastAuth(req)
    if (!user) return unauthorized()

    const { searchParams } = new URL(req.url)

    const filters: LeadFilters = {
      page: Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10) || 50)),
      search: searchParams.get('search') || undefined,
      orderBy: searchParams.get('orderBy') || 'created_at',
      orderDirection: (searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc',
    }

    const status = searchParams.get('status')
    if (status) filters.status = status.split(',')

    const sources = searchParams.get('sources')
    if (sources) filters.sources = sources.split(',')

    const industries = searchParams.get('industries')
    if (industries) filters.industries = industries.split(',')

    const states = searchParams.get('states')
    if (states) filters.states = states.split(',')

    const companySizes = searchParams.get('companySizes')
    if (companySizes) filters.companySizes = companySizes.split(',')

    const tags = searchParams.get('tags')
    if (tags) filters.tags = tags.split(',')

    if (searchParams.get('hasPhone') === 'true') filters.hasPhone = true
    if (searchParams.get('hasVerifiedEmail') === 'true') filters.hasVerifiedEmail = true

    const intentScoreMin = searchParams.get('intentScoreMin')
    if (intentScoreMin) filters.intentScoreMin = Number(intentScoreMin)
    const intentScoreMax = searchParams.get('intentScoreMax')
    if (intentScoreMax) filters.intentScoreMax = Number(intentScoreMax)
    const freshnessMin = searchParams.get('freshnessMin')
    if (freshnessMin) filters.freshnessMin = Number(freshnessMin)

    const assignedUserId = searchParams.get('assignedUserId')
    if (assignedUserId) filters.assignedUserId = assignedUserId

    const leadRepo = new CRMLeadRepository()
    const { leads, total } = await leadRepo.findByWorkspace(user.workspaceId, filters)

    return NextResponse.json({
      leads,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      pageCount: Math.ceil(total / filters.pageSize!),
    })
  } catch (error) {
    safeError('[GET /api/crm/leads] Error:', error)
    return handleApiError(error)
  }
}

const createLeadSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  company_industry: z.string().optional(),
  business_type: z.string().optional(),
  title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  source: z.string().default('manual'),
  status: z.string().default('new'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await fastAuth(req)
    if (!user) {
      return unauthorized()
    }

    const body = await req.json()
    const validated = createLeadSchema.parse(body)

    const leadRepo = new CRMLeadRepository()
    const lead = await leadRepo.create({
      workspace_id: user.workspaceId,
      email: validated.email,
      first_name: validated.first_name,
      last_name: validated.last_name,
      phone: validated.phone || undefined,
      company_name: validated.company_name || undefined,
      company_industry: validated.company_industry || undefined,
      business_type: validated.business_type || undefined,
      title: validated.title || undefined,
      city: validated.city || undefined,
      state: validated.state || undefined,
      source: validated.source,
      status: validated.status as import('@/types/crm.types').LeadStatus,
      created_at: new Date().toISOString(),
    })

    inngest.send({
      name: 'lead/created' as const,
      data: { lead_id: lead.id, workspace_id: user.workspaceId, source: validated.source },
    }).catch((err) => safeError('[Create Lead] Inngest send failed:', err))

    return NextResponse.json({ success: true, data: lead })
  } catch (error) {
    safeError('[Create Lead] Error:', error)
    return handleApiError(error)
  }
}
