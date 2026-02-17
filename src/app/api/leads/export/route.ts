// Leads Export API
// POST /api/leads/export - Export leads to CSV

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LeadRepository } from '@/lib/repositories/lead.repository'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const exportRequestSchema = z.object({
  filters: z
    .object({
      query_id: z.string().uuid().optional(),
      enrichment_status: z.enum(['pending', 'enriching', 'enriched', 'failed']).optional(),
      delivery_status: z.enum(['pending', 'delivered', 'failed']).optional(),
      intent_score: z.enum(['hot', 'warm', 'cold']).optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const body = await request.json()
    const { filters } = exportRequestSchema.parse(body)

    // 3. Generate CSV with workspace filtering
    const leadRepo = new LeadRepository()
    const csv = await leadRepo.exportToCSV(user.workspace_id, filters || {})

    // 4. Return CSV file response
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
