// Template Stats API Route
// Get template performance statistics

import { type NextRequest } from 'next/server'
import { TemplateRepository } from '@/lib/repositories/template.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success } from '@/lib/utils/api-error-handler'

/**
 * GET - Get template performance stats by taxonomy
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new TemplateRepository()

    // Get performance by taxonomy
    const performanceStats = await repo.getPerformanceByTaxonomy(user.workspace_id)

    // Get top performing templates
    const topPerforming = await repo.getTopPerforming(user.workspace_id, 10)

    // Get counts by source
    const countsBySource = await repo.countBySource(user.workspace_id)

    return success({
      performance: performanceStats,
      topPerforming,
      countsBySource,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
