// Supabase Middleware Client
// Use this in Next.js middleware

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const createClient = (request: NextRequest) => {
  // Create a mutable response object
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // Update request cookies for downstream handlers
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          )
          // Recreate response with updated request
          supabaseResponse = NextResponse.next({
            request,
          })
          // CRITICAL: Set cookies on response for browser persistence
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  return {
    supabase,
    get response() {
      return supabaseResponse
    },
  }
}
