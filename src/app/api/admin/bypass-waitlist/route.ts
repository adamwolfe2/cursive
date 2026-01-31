/**
 * Admin Bypass Waitlist API
 * Allows admin to bypass waitlist with password
 *
 * SECURITY: Uses environment variable for password and implements rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Store in environment variable for security
// Default passcode: Cursive2026!
const ADMIN_BYPASS_PASSWORD = process.env.ADMIN_BYPASS_PASSWORD || 'Cursive2026!'

// Simple in-memory rate limiting (resets on server restart)
const rateLimitMap = new Map<string, { attempts: number; resetAt: number }>()
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
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown'

    // Check rate limit
    const now = Date.now()
    const rateLimit = rateLimitMap.get(clientIp)

    if (rateLimit) {
      if (now < rateLimit.resetAt) {
        if (rateLimit.attempts >= MAX_ATTEMPTS) {
          return NextResponse.json(
            {
              error: 'Too many attempts. Please try again later.',
              retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000)
            },
            { status: 429 }
          )
        }
      } else {
        // Reset window expired
        rateLimitMap.delete(clientIp)
      }
    }

    const body = await req.json()
    const validated = bypassSchema.parse(body)

    // Validate password
    if (validated.password !== ADMIN_BYPASS_PASSWORD) {
      // Increment failed attempts
      const current = rateLimitMap.get(clientIp) || { attempts: 0, resetAt: now + RATE_LIMIT_WINDOW }
      rateLimitMap.set(clientIp, {
        attempts: current.attempts + 1,
        resetAt: current.resetAt
      })

      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Success - clear rate limit and create response
    rateLimitMap.delete(clientIp)
    const response = NextResponse.json({ success: true })

    // Set secure httpOnly cookie that expires in 7 days
    response.cookies.set('admin_bypass_waitlist', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Audit log (console for now, could be database later)
    console.log('[Admin Bypass] Successful bypass from IP:', clientIp, 'at', new Date().toISOString())

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
