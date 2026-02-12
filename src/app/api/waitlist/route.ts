// Waitlist API Route
// Public endpoint for waitlist email signups (no auth required)

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { WaitlistRepository } from '@/lib/repositories/waitlist.repository'
import { handleApiError, success, created } from '@/lib/utils/api-error-handler'
import { withRateLimit } from '@/lib/middleware/rate-limiter'

// Validation schema for waitlist signup
const waitlistSignupSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long'),
  industry: z
    .string()
    .max(100, 'Industry is too long')
    .optional()
    .nullable(),
  linkedin_url: z
    .string()
    .url('Please enter a valid LinkedIn URL')
    .refine(
      (url) => url.includes('linkedin.com'),
      'URL must be a LinkedIn profile URL'
    )
    .optional()
    .nullable()
    .or(z.literal('')),
  source: z.string().max(50).optional(),
})

/**
 * POST /api/waitlist
 * Create a new waitlist signup (public, no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, 'public-form')
    if (rateLimited) return rateLimited

    // Parse and validate request body
    const body = await request.json()
    const validatedData = waitlistSignupSchema.parse(body)

    // Clean up empty strings
    const cleanedData = {
      email: validatedData.email.toLowerCase().trim(),
      first_name: validatedData.first_name.trim(),
      last_name: validatedData.last_name.trim(),
      industry: validatedData.industry?.trim() || null,
      linkedin_url: validatedData.linkedin_url?.trim() || null,
      source: validatedData.source || 'website',
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                  request.headers.get('x-real-ip') ||
                  null,
      user_agent: request.headers.get('user-agent') || null,
    }

    // Create the waitlist signup
    const repo = new WaitlistRepository()
    const signup = await repo.create(cleanedData)

    return created({
      message: 'Successfully joined the waitlist!',
      email: signup.email,
    })
  } catch (error: unknown) {
    // Handle duplicate email error specifically
    if (error instanceof Error && error.message.includes('already registered')) {
      return NextResponse.json(
        {
          error: 'This email is already on the waitlist',
          code: 'DUPLICATE_EMAIL'
        },
        { status: 409 }
      )
    }
    return handleApiError(error)
  }
}

/**
 * GET /api/waitlist
 * Get waitlist count (public endpoint for showing social proof)
 */
export async function GET() {
  try {
    const repo = new WaitlistRepository()
    const count = await repo.getCount()

    return success({ count })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
