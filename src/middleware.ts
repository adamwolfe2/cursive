// Next.js Middleware
// Handles authentication and multi-tenant routing

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateRequiredEnvVars } from '@/lib/env-validation'
import { logger } from '@/lib/monitoring/logger'

export async function middleware(req: NextRequest) {
  // Validate critical environment variables on first request
  validateRequiredEnvVars()

  const startTime = Date.now()

  try {
    const { pathname } = req.nextUrl

    // Quick check for static files and test endpoints - skip all middleware
    if (
      pathname.startsWith('/_next/static') ||
      pathname.startsWith('/_next/image') ||
      pathname.match(/\.(ico|png|jpg|jpeg|gif|webp|svg)$/)
    ) {
      return NextResponse.next()
    }

    // Webhook and Inngest paths handle their own auth — return immediately
    // without creating a Supabase client (which can hang on serverless functions)
    if (
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/api/cron') ||
      pathname.startsWith('/api/inngest') ||
      pathname === '/api/health'
    ) {
      return NextResponse.next({
        request: req,
      })
    }

    // Create Supabase client using SSR pattern
    const client = createClient(req)
    const { supabase } = client

    // Check if this is a truly public route that doesn't need auth
    const isTrulyPublicRoute =
      pathname.startsWith('/api/waitlist') ||
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/api/cron') ||
      pathname.startsWith('/api/admin/bypass-waitlist') ||
      pathname === '/api/health' ||
      pathname.startsWith('/api/inngest')

    // Skip auth check for truly public routes to improve performance
    let authenticatedUser: { id: string; email?: string } | null = null
    if (!isTrulyPublicRoute) {
      try {
        // Use getUser() instead of getSession() — getUser() validates against
        // the Supabase auth server and properly refreshes expired tokens.
        // getSession() only reads the JWT cookie and returns null when expired.
        const userPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        )

        const result = await Promise.race([userPromise, timeoutPromise]) as
          | { data: { user: { id: string; email?: string } | null } }
          | undefined
        authenticatedUser = result?.data?.user || null
      } catch (e) {
        console.error('[Middleware] Failed to check auth:', e)
        // SECURITY: Do NOT fail open. Redirect to login when auth check fails.
        // This prevents unauthenticated access when the auth check times out.
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('redirect', pathname)
        loginUrl.searchParams.set('reason', 'auth_error')
        return NextResponse.redirect(loginUrl)
      }
    }

    // Extract subdomain for multi-tenant routing
    const hostname = req.headers.get('host') || ''
    const host = hostname.split(':')[0] // Remove port if present
    const subdomain = getSubdomain(hostname)

    // Admin-only routes
    const isAdminRoute = pathname.startsWith('/admin')

    // Partner-only routes
    const isPartnerRoute = pathname.startsWith('/partner')

    // Public routes that don't require authentication
    const isPublicRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/welcome') || // Welcome/setup page
      pathname.startsWith('/setup-admin') || // TEMPORARY: Admin bootstrap - DELETE AFTER USE
      pathname.startsWith('/onboarding') || // Legacy onboarding pages
      pathname.startsWith('/role-selection') || // Legacy role selection
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/accept-invite') ||
      pathname === '/' ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/webhooks') || // Webhooks are authenticated differently
      pathname.startsWith('/api/cron') || // Cron routes use CRON_SECRET auth
      pathname.startsWith('/api/waitlist') || // Waitlist API is public (admin management)
      pathname.startsWith('/api/admin/bypass-waitlist') || // Admin bypass endpoint
      pathname === '/api/health' || // Health check endpoint for monitoring
      pathname.startsWith('/api/inngest') // Inngest routes

    // API routes (except webhooks, waitlist, and bypass) require authentication
    const isApiRoute = pathname.startsWith('/api') &&
      !pathname.startsWith('/api/webhooks') &&
      !pathname.startsWith('/api/cron') &&
      !pathname.startsWith('/api/waitlist') &&
      !pathname.startsWith('/api/admin/bypass-waitlist') &&
      pathname !== '/api/health'

    // Auth routes (login, signup) - redirect to dashboard if already authenticated
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

    // Use the authenticated user we already fetched above (don't fetch again)
    const user = authenticatedUser

    // Helper to create redirect with cookies preserved
    const redirectWithCookies = (url: URL) => {
      const redirectResponse = NextResponse.redirect(url)
      // Copy cookies from supabase response to redirect response
      client.response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    // Waitlist page is still accessible but no longer force-redirects users
    // Users can visit /waitlist directly if needed

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

    // Admin routes require authentication
    if (isAdminRoute && !user) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Workspace isolation: verify authenticated users have a valid workspace
    // Admins (in platform_admins table) bypass workspace checks
    if (user && !isPublicRoute && !isAdminRoute && !isPartnerRoute && !pathname.startsWith('/onboarding') && !pathname.startsWith('/welcome') && !pathname.startsWith('/api/onboarding')) {
      // Look up the user's workspace_id using admin client to bypass RLS
      // (the anon-key client triggers recursive RLS on the users table)
      const adminSupabaseForUser = createAdminClient()
      const { data: userRecord } = await adminSupabaseForUser
        .from('users')
        .select('workspace_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!userRecord?.workspace_id) {
        // Check if user is a platform admin (admins may not have a workspace)
        // Use admin client to bypass RLS on platform_admins table
        const adminSupabase = createAdminClient()
        const { data: adminRecord } = await adminSupabase
          .from('platform_admins')
          .select('id')
          .eq('email', user.email)
          .eq('is_active', true)
          .single()

        if (!adminRecord) {
          // Not an admin and no workspace -- redirect to onboarding
          const onboardingUrl = new URL('/welcome', req.url)
          return redirectWithCookies(onboardingUrl)
        }
        // Admin without workspace -- allow through
      } else {
        // Verify the workspace exists and is not suspended
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id, is_suspended')
          .eq('id', userRecord.workspace_id)
          .single()

        if (!workspace) {
          // Workspace not found -- redirect to onboarding
          const onboardingUrl = new URL('/welcome', req.url)
          return redirectWithCookies(onboardingUrl)
        }

        if (workspace.is_suspended) {
          // Workspace is suspended -- redirect to a suspended page or login
          const suspendedUrl = new URL('/login', req.url)
          suspendedUrl.searchParams.set('reason', 'workspace_suspended')
          return redirectWithCookies(suspendedUrl)
        }
      }
    }

    // Add custom headers for subdomain information
    if (subdomain) {
      client.response.headers.set('x-subdomain', subdomain)
    }

    // Log request completion
    const duration = Date.now() - startTime
    if (duration > 1000) {
      // Only log slow requests
      logger.info('Slow middleware request', {
        method: req.method,
        pathname,
        duration,
        ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      })
    }

    return client.response
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
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }

    // SECURITY: Do NOT fail open. Redirect to login when middleware encounters an error.
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('reason', 'middleware_error')
    return NextResponse.redirect(loginUrl)
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
