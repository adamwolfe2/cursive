// Sign Out Route Handler

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

// Use edge runtime for instant response
export const runtime = 'edge'

async function handleSignOut(request: NextRequest) {
  const cookieStore: { name: string; value: string; options?: any }[] = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookieStore.push(...cookiesToSet)
        },
      },
    }
  )

  // Sign out
  await supabase.auth.signOut()

  // Redirect to login page
  const response = NextResponse.redirect(new URL('/login', request.url))

  // Set cookies
  cookieStore.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}

export async function POST(request: NextRequest) {
  return handleSignOut(request)
}

// Support GET for <Link> and router.push navigation
export async function GET(request: NextRequest) {
  return handleSignOut(request)
}
