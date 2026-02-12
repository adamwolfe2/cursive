/**
 * Logout API Endpoint
 * POST /api/auth/logout - Sign out current user
 */

export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export async function POST() {
  try {
    const supabase = await createClient()

    // Sign out the user
    await supabase.auth.signOut()

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    safeError('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
