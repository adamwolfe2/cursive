// Sign Out Route Handler

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Sign out
  await supabase.auth.signOut()

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Sign out
  await supabase.auth.signOut()

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url))
}
