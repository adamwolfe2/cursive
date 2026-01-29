/**
 * Admin Bypass Waitlist API
 * Allows admin to bypass waitlist with password
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ADMIN_PASSWORD = 'cursiveadmin1!'

const bypassSchema = z.object({
  password: z.string().min(1),
})

/**
 * POST /api/admin/bypass-waitlist
 * Validate admin password and set bypass cookie
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = bypassSchema.parse(body)

    // Validate password
    if (validated.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Create response with bypass cookie
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
