// Auth Callback Route
// Handles OAuth redirects from Supabase

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    // Create a response that we can modify with cookies
    const response = NextResponse.redirect(new URL(next, requestUrl.origin))

    // Create supabase client that can set cookies on the response
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        new URL('/login?error=auth_callback_error', requestUrl.origin)
      )
    }

    // Get user and check if they have a workspace
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const { data: user } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('auth_user_id', session.user.id)
        .single()

      // Redirect to welcome page if no user profile exists
      if (!user || !user.workspace_id) {
        // Update the redirect URL but keep the cookies
        const welcomeUrl = new URL('/welcome', requestUrl.origin)
        const welcomeResponse = NextResponse.redirect(welcomeUrl)

        // Copy all cookies to the new response
        response.cookies.getAll().forEach((cookie) => {
          welcomeResponse.cookies.set(cookie.name, cookie.value, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          })
        })

        return welcomeResponse
      }
    }

    // Return the response with session cookies set
    return response
  }

  // No code provided - redirect to next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
