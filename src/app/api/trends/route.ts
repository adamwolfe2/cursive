// Trends API
// GET /api/trends - Get trending topics (gainers and losers)

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { TopicSearchService } from '@/lib/services/topic-search.service'
import { handleApiError, unauthorized, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const trendsQuerySchema = z.object({
  type: z.enum(['gainers', 'losers', 'all']).optional(),
  limit: z.string().optional(),
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
      type: searchParams.get('type') || 'all',
      limit: searchParams.get('limit') || '20',
    }

    const validated = trendsQuerySchema.parse(params)
    const limit = parseInt(validated.limit || '20', 10)

    // 3. Fetch trending topics
    const topicSearchService = new TopicSearchService()

    let gainers: any[] = []
    let losers: any[] = []

    if (validated.type === 'gainers' || validated.type === 'all') {
      gainers = await topicSearchService.getTrendingGainers(limit)
    }

    if (validated.type === 'losers' || validated.type === 'all') {
      losers = await topicSearchService.getTrendingLosers(limit)
    }

    // 4. Return response
    return success({
      gainers,
      losers,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
