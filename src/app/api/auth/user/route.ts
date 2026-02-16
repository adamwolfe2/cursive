// Get Current User API
// Returns the authenticated user's data

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('[API /auth/user] Fetching current user')
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('[API /auth/user] Supabase auth error:', error.message)
      return NextResponse.json({ user: null, error: error.message }, { status: 401 })
    }

    if (!user) {
      console.log('[API /auth/user] No user session found')
      return NextResponse.json({ user: null }, { status: 401 })
    }

    console.log('[API /auth/user] User found:', { id: user.id, email: user.email })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('[API /auth/user] Failed to get user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
