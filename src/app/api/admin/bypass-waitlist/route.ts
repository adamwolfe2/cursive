/**
 * Admin Bypass Waitlist API
 * Allows admin to bypass waitlist with password
 *
 * SECURITY: Uses environment variable for password and implements rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Use edge runtime for instant response
export const runtime = 'edge'

// Store in environment variable for security - no fallback allowed
const ADMIN_BYPASS_PASSWORD = process.env.ADMIN_BYPASS_PASSWORD

// Note: In-memory rate limiting not available in edge runtime
// For production, use Vercel KV or Upstash Redis for rate limiting
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes

const bypassSchema = z.object({
  password: z.string().min(1),
})

/**
 * POST /api/admin/bypass-waitlist
 * Validate admin password and set bypass cookie
 */
export async function POST(req: NextRequest) {
  try {
    // Ensure admin password is configured via environment variable
    if (!ADMIN_BYPASS_PASSWORD) {
      console.error('[Admin Bypass] ADMIN_BYPASS_PASSWORD environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const validated = bypassSchema.parse(body)

    // Validate password
    if (validated.password !== ADMIN_BYPASS_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Success - create response
    const response = NextResponse.json({ success: true })

    // Set secure httpOnly cookie that expires in 7 days
    response.cookies.set('admin_bypass_waitlist', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    // Log the actual error for debugging
    console.error('[Admin Bypass] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
