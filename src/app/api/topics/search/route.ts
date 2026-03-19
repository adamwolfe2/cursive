// Topic Search API Route


import { NextResponse, type NextRequest } from 'next/server'
import { TopicSearchService } from '@/lib/services/topic-search.service'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, badRequest, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  limit: z.string().optional().default('20'),
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
    const params = searchQuerySchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit') || '20',
    })

    const limit = parseInt(params.limit, 10)

    // 3. Search topics
    const topicSearchService = new TopicSearchService()
    const results = await topicSearchService.searchTopics(params.q, limit)

    // 4. Return response
    return success(results)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
