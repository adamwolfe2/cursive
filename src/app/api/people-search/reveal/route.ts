// Email Reveal API
// POST /api/people-search/reveal - Reveal email (costs 1 credit)

import { NextRequest, NextResponse } from 'next/server'
import { protectRoute, consumeCredits, applyProtectionHeaders, PROTECTION_PRESETS } from '@/lib/middleware/api-protection'
import { PeopleSearchRepository } from '@/lib/repositories/people-search.repository'
import { handleApiError, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const revealRequestSchema = z.object({
  result_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Protect route with auth, rate limiting, and credit check
    const protection = await protectRoute(request, PROTECTION_PRESETS.emailReveal)

    if (!protection.success) {
      return protection.response
    }

    const { user, credits } = protection.req

    // 2. Validate input with Zod
    const body = await request.json()
    const { result_id } = revealRequestSchema.parse(body)

    // 3. Reveal email with workspace filtering
    const peopleSearchRepo = new PeopleSearchRepository()
    const result = await peopleSearchRepo.revealEmail(
      result_id,
      user.workspace_id,
      user.id
    )

    // 4. Consume credits after successful reveal
    await consumeCredits(user, 'email_reveal')

    // 5. Return response with rate limit headers
    const response = NextResponse.json({
      success: true,
      data: {
        email: result.email,
        credits_remaining: credits?.remaining || 0,
      },
      message: `Email revealed. ${credits?.remaining || 0} credits remaining today.`,
    })

    return applyProtectionHeaders(response, request, PROTECTION_PRESETS.emailReveal)
  } catch (error: any) {
    return handleApiError(error)
  }
}
