// Leads API
// GET /api/leads - List leads with filters

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LeadRepository } from '@/lib/repositories/lead.repository'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const leadFiltersSchema = z.object({
  query_id: z.string().uuid().optional(),
  enrichment_status: z.enum(['pending', 'completed', 'failed']).optional(),
  delivery_status: z.enum(['pending', 'delivered', 'failed']).optional(),
  intent_score: z.enum(['hot', 'warm', 'cold']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const searchParams = request.nextUrl.searchParams
    const params = {
      query_id: searchParams.get('query_id') || undefined,
      enrichment_status: searchParams.get('enrichment_status') || undefined,
      delivery_status: searchParams.get('delivery_status') || undefined,
      intent_score: searchParams.get('intent_score') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      per_page: searchParams.get('per_page') || '50',
    }

    const validated = leadFiltersSchema.parse(params)

    // Parse pagination
    const page = parseInt(validated.page || '1', 10)
    const perPage = parseInt(validated.per_page || '50', 10)

    // 3. Fetch leads with workspace filtering
    const leadRepo = new LeadRepository()
    const result = await leadRepo.findByWorkspace(
      user.workspace_id,
      {
        query_id: validated.query_id,
        enrichment_status: validated.enrichment_status,
        delivery_status: validated.delivery_status,
        intent_score: validated.intent_score,
        date_from: validated.date_from,
        date_to: validated.date_to,
        search: validated.search,
      },
      page,
      perPage
    )

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: result.leads,
      pagination: {
        total: result.total,
        page: result.page,
        per_page: result.per_page,
        total_pages: Math.ceil(result.total / result.per_page),
      },
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
