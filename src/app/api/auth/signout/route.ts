/**
 * Sign Out API Route
 * Cursive Platform
 *
 * Signs out the current user and clears session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      safeError('[Sign Out] Error:', error)
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      )
    }

    // Clear custom cookies to prevent cross-user data leakage
    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully',
      redirectUrl: '/login',
    })

    // Delete workspace cache cookie
    response.cookies.set('x-workspace-id', '', { maxAge: 0, path: '/' })

    return response
  } catch (error) {
    safeError('[Sign Out] Error:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}
