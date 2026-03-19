// Get Current User API
// Returns the authenticated user's data

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      safeError('[API /auth/user] Auth error:', error.message)
      return NextResponse.json({ user: null, error: 'Not authenticated' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    safeError('[API /auth/user] Failed to get user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
