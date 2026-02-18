/**
 * Admin Impersonation API
 * POST /api/admin/impersonate - Start impersonation session
 * DELETE /api/admin/impersonate - End impersonation session
 */


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  requireAdmin,
  startImpersonation,
  endImpersonation,
  getActiveImpersonationSession,
} from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

const impersonateSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  reason: z.string().max(500, 'Reason too long').optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Verify admin (throws if not admin)
    await requireAdmin()

    const body = await request.json()
    const validation = impersonateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { workspaceId, reason } = validation.data

    const result = await startImpersonation(workspaceId, reason)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      message: 'Impersonation session started',
    })
  } catch (error) {
    safeError('Impersonate error:', error)
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Verify admin (throws if not admin)
    await requireAdmin()

    const result = await endImpersonation()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended',
    })
  } catch (error) {
    safeError('End impersonate error:', error)
    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Verify admin (throws if not admin)
    await requireAdmin()

    const session = await getActiveImpersonationSession()

    return NextResponse.json({
      isImpersonating: !!session,
      workspace: session?.workspace || null,
      sessionId: session?.sessionId || null,
    })
  } catch (error) {
    safeError('Get impersonation error:', error)
    return NextResponse.json(
      { error: 'Failed to get impersonation status' },
      { status: 500 }
    )
  }
}
