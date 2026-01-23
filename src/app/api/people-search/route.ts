// People Search API
// POST /api/people-search - Search for people

import { NextRequest, NextResponse } from 'next/server'
import { protectRoute, consumeCredits, applyProtectionHeaders, PROTECTION_PRESETS } from '@/lib/middleware/api-protection'
import { PeopleSearchService } from '@/lib/services/people-search.service'
import { PeopleSearchRepository } from '@/lib/repositories/people-search.repository'
import { handleApiError, badRequest, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const searchRequestSchema = z.object({
  filters: z.object({
    company: z.string().optional(),
    domain: z.string().optional(),
    job_title: z.string().optional(),
    seniority: z.string().optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    industry: z.string().optional(),
  }),
  save_search: z.boolean().optional(),
  search_name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Protect route with auth, rate limiting, and credit check
    const protection = await protectRoute(request, PROTECTION_PRESETS.search)

    if (!protection.success) {
      return protection.response
    }

    const { user, credits } = protection.req

    // 2. Validate input with Zod
    const body = await request.json()
    const { filters, save_search, search_name } = searchRequestSchema.parse(body)

    // Validate at least one filter is provided
    if (!filters.domain && !filters.company) {
      return badRequest('Please provide either a company domain or company name')
    }

    // 3. Search for people
    const peopleSearchService = new PeopleSearchService()
    const results = await peopleSearchService.searchPeople(filters, 50)

    // 4. Save results to database with workspace filtering
    const peopleSearchRepo = new PeopleSearchRepository()
    const savedResults = await Promise.all(
      results.map((person) =>
        peopleSearchRepo.createResult(
          user.workspace_id,
          {
            ...person,
            email_revealed: false, // Email hidden by default
          },
          filters
        )
      )
    )

    // Save search if requested
    if (save_search && search_name) {
      await peopleSearchRepo.saveSearch(
        user.workspace_id,
        search_name,
        filters
      )
    }

    // 5. Consume credits after successful search
    await consumeCredits(user, 'people_search')

    // 6. Return response with rate limit headers
    const response = success({
      results: savedResults.map((result) => ({
        ...result,
        person_data: {
          ...result.person_data,
          // Mask email for display
          email: peopleSearchService.maskEmail(
            result.person_data.email || ''
          ),
        },
      })),
      count: savedResults.length,
      credits: {
        remaining: credits?.remaining || 0,
        limit: credits?.limit || 0,
      },
    })

    return applyProtectionHeaders(response, request, PROTECTION_PRESETS.search)
  } catch (error: any) {
    return handleApiError(error)
  }
}

// GET /api/people-search - Get saved searches
export async function GET(request: NextRequest) {
  try {
    // 1. Protect route with auth and rate limiting (no credits needed for GET)
    const protection = await protectRoute(request, PROTECTION_PRESETS.authenticated)

    if (!protection.success) {
      return protection.response
    }

    const { user } = protection.req

    // 2. Fetch saved searches with workspace filtering
    const peopleSearchRepo = new PeopleSearchRepository()
    const savedSearches = await peopleSearchRepo.findSavedSearches(
      user.workspace_id
    )

    // 3. Return response with rate limit headers
    const response = success(savedSearches)
    return applyProtectionHeaders(response, request, PROTECTION_PRESETS.authenticated)
  } catch (error: any) {
    return handleApiError(error)
  }
}
