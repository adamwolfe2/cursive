// Next.js Middleware
// Handles authentication and multi-tenant routing

import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const { pathname } = req.nextUrl

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Middleware env check:', {
      pathname,
      supabaseUrlSet: !!supabaseUrl,
      supabaseKeySet: !!supabaseKey,
      supabaseUrlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
    })

    if (!supabaseUrl || !supabaseKey) {
      console.error('Middleware: Missing Supabase environment variables')
      throw new Error('Missing Supabase environment variables')
    }

    // Create Supabase client with explicit env vars
    const supabase = createMiddlewareClient<Database>({ req, res })
    console.log('Middleware: Supabase client created successfully')

    // Extract subdomain for multi-tenant routing
    const hostname = req.headers.get('host') || ''
    const host = hostname.split(':')[0] // Remove port if present
    const subdomain = getSubdomain(hostname)

    // Check if this is the leads.meetcursive.com domain (waitlist mode)
    const isWaitlistDomain = host === 'leads.meetcursive.com'

    // Check for admin bypass cookie
    const hasAdminBypass = req.cookies.get('admin_bypass_waitlist')?.value === 'true'

    // Admin-only routes
    const isAdminRoute = pathname.startsWith('/admin')

    // Partner-only routes
    const isPartnerRoute = pathname.startsWith('/partner')

    // Public routes that don't require authentication
    const isPublicRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/accept-invite') ||
      pathname === '/' ||
      pathname === '/waitlist' || // Waitlist page is public
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/webhooks') || // Webhooks are authenticated differently
      pathname.startsWith('/api/waitlist') || // Waitlist API is public
      pathname === '/api/health' || // Health check endpoint for monitoring
      pathname.startsWith('/api/inngest') // Inngest routes

    // API routes (except webhooks and waitlist) require authentication
    const isApiRoute = pathname.startsWith('/api') &&
      !pathname.startsWith('/api/webhooks') &&
      !pathname.startsWith('/api/waitlist')

    // Auth routes (login, signup) - redirect to dashboard if already authenticated
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

    // Use getSession() to read session from cookies with proper middleware client
    // This ensures cookies are passed correctly and headers are updated for token refresh
    let session = null
    let user = null
    try {
      const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Middleware: getSession error', sessionError)
      } else {
        console.log('Middleware: Session retrieved successfully', { hasSession: !!authSession })
      }

      session = authSession
      if (session?.user) {
        user = session.user
        // Log session presence (redact token for security)
        console.log('Middleware session check:', {
          pathname,
          hasSession: !!session,
          hasUser: !!user,
          userEmail: user.email,
          tokenPresent: !!session.access_token,
          tokenPrefix: session.access_token?.substring(0, 10) + '...'
        })
      } else {
        console.log('Middleware: No session found for', pathname)
      }
    } catch (e) {
      // If session read fails, treat as not authenticated
      console.error('Middleware: Failed to read session', e)
    }

    // Check if user is admin (adam@meetcursive.com) - they bypass waitlist
    const isAdminEmail = user?.email === 'adam@meetcursive.com'

    // Helper to create redirect with cookies preserved
    const redirectWithCookies = (url: URL) => {
      const redirectResponse = NextResponse.redirect(url)
      // Copy cookies from response to redirect response
      res.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    // Waitlist enforcement (after checking admin status)
    // If on waitlist domain without admin bypass cookie, redirect to waitlist
    if (isWaitlistDomain && !hasAdminBypass && !isAdminEmail) {
      const isWaitlistPath =
        pathname === '/waitlist' ||
        pathname.startsWith('/api/waitlist') ||
        pathname.startsWith('/api/admin/bypass-waitlist') ||
        pathname.startsWith('/api/health') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/auth/callback') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth')

      if (!isWaitlistPath) {
        return NextResponse.redirect(new URL('/waitlist', req.url))
      }
    }

    // Auth routes (login, signup) - allow access even if authenticated
    // Users may want to re-login or access these pages directly

    // Protected routes require authentication
    if (!isPublicRoute && !user) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return redirectWithCookies(redirectUrl)
    }

    // API routes require authentication
    if (isApiRoute && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin routes require admin email
    if (isAdminRoute && !isAdminEmail) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // DISABLED FOR NOW - Admin can access everything without workspace checks
    // If authenticated, verify workspace access (skip for admin and partner routes)
    // if (user && !isPublicRoute && !pathname.startsWith('/onboarding') && !isAdminEmail && !isPartnerRoute) {
    //   ... workspace validation code removed for admin ...
    // }

    // If user is admin on waitlist domain, set the bypass cookie
    if (isWaitlistDomain && isAdminEmail && !hasAdminBypass) {
      res.cookies.set('admin_bypass_waitlist', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      })
    }

    // Add custom headers for subdomain information
    if (subdomain) {
      res.headers.set('x-subdomain', subdomain)
    }

    return res
  } catch (error) {
    console.error('Middleware invocation failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      pathname: req.nextUrl.pathname,
    })

    // Return 500 error for API routes, redirect to error page for others
    const pathname = req.nextUrl.pathname
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // For non-API routes, allow the request to continue (fail open for better UX)
    return NextResponse.next()
  }
}

/**
 * Extract subdomain from hostname
 * Returns null for main domain or localhost
 */
function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0]

  // Localhost or IP address
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null
  }

  // Main application domains - not subdomains
  const mainDomains = [
    'leads.meetcursive.com',
    'leadme.vercel.app',
    'localhost',
  ]

  if (mainDomains.some(domain => host === domain || host.endsWith('.vercel.app'))) {
    return null
  }

  const parts = host.split('.')

  // Main domain (e.g., meetcursive.com)
  if (parts.length <= 2) {
    return null
  }

  // Extract subdomain (first part)
  const subdomain = parts[0]

  // Ignore www and app subdomains (these are the main app, not tenant subdomains)
  const appSubdomains = ['www', 'leads', 'app', 'dashboard']
  if (appSubdomains.includes(subdomain)) {
    return null
  }

  return subdomain
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
