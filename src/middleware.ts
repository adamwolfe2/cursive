// Next.js Middleware
// Handles authentication and multi-tenant routing

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateRequiredEnvVars } from '@/lib/env-validation'
import { logger } from '@/lib/monitoring/logger'
import { safeError } from '@/lib/utils/log-sanitizer'

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

    // Extract subdomain for multi-tenant routing
    const hostname = req.headers.get('host') || ''
    const host = hostname.split(':')[0] // Remove port if present
    const subdomain = getSubdomain(hostname)

    // Admin-only routes
    const isAdminRoute = pathname.startsWith('/admin')

    // Partner-only routes
    const isPartnerRoute = pathname.startsWith('/partner')

    // Public routes that don't require authentication (single source of truth)
    const isPublicRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/welcome') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/role-selection') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/accept-invite') ||
      pathname === '/' ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/api/cron') ||
      pathname === '/api/health' ||
      pathname.startsWith('/api/inngest')

    // API routes (except webhooks and health) require authentication
    const isApiRoute = pathname.startsWith('/api') &&
      !pathname.startsWith('/api/webhooks') &&
      !pathname.startsWith('/api/cron') &&
      pathname !== '/api/health'

    // Skip auth check entirely for public routes to prevent redirect loops
    let authenticatedUser: { id: string; email?: string } | null = null
    if (!isPublicRoute) {
      try {
        // getSession() reads the session from cookies and refreshes if expired.
        // This is a local JWT check that only makes a network call when
        // the token needs refreshing.
        const { data: { session } } = await supabase.auth.getSession()
        authenticatedUser = session?.user ? {
          id: session.user.id,
          email: session.user.email,
        } : null
      } catch (e) {
        safeError('[Middleware] Auth session check failed:', e)
        authenticatedUser = null
      }
    }

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

    // Protected routes require authentication.
    // If getSession() returned null but auth cookies exist in the request,
    // let the request through — the page-level layout will re-attempt auth.
    // This prevents redirect loops when token refresh intermittently fails
    // in the middleware Edge runtime.
    if (!isPublicRoute && !user) {
      const hasAuthCookies = req.cookies.getAll().some(
        c => c.name.startsWith('sb-') && c.name.includes('auth-token')
      )
      if (!hasAuthCookies) {
        // No auth cookies at all — user is definitely not logged in
        if (isApiRoute) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return redirectWithCookies(redirectUrl)
      }
      // Auth cookies exist but getSession() failed — let page-level handle it.
      // The dashboard layout has its own getSession() check and will redirect
      // to /login if the session is truly invalid.
    }

    // API routes require authentication (no auth cookies = definitely unauthorized)
    if (isApiRoute && !user) {
      const hasAuthCookies = req.cookies.getAll().some(
        c => c.name.startsWith('sb-') && c.name.includes('auth-token')
      )
      if (!hasAuthCookies) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Admin routes require admin check (handled downstream if cookies present)
    if (isAdminRoute && !user) {
      const hasAuthCookies = req.cookies.getAll().some(
        c => c.name.startsWith('sb-') && c.name.includes('auth-token')
      )
      if (!hasAuthCookies) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    // Workspace check: verify authenticated users have a workspace for dashboard routes.
    // Caches workspace_id in a cookie to avoid DB query on every request (~50-100ms savings).
    if (user && !isPublicRoute && !isAdminRoute && !isPartnerRoute && !pathname.startsWith('/onboarding') && !pathname.startsWith('/welcome') && !pathname.startsWith('/api/onboarding')) {
      // Check cookie cache first to avoid DB roundtrip on every request
      const cachedWorkspaceId = req.cookies.get('x-workspace-id')?.value

      if (!cachedWorkspaceId) {
        const adminSupabase = createAdminClient()
        const { data: userRecord } = await adminSupabase
          .from('users')
          .select('workspace_id')
          .eq('auth_user_id', user.id)
          .single()

        if (!userRecord?.workspace_id) {
          // No workspace — redirect to onboarding. Admin routes are excluded above,
          // so /admin/* is still accessible for admins without workspaces.
          const onboardingUrl = new URL('/welcome', req.url)
          return redirectWithCookies(onboardingUrl)
        }

        // Cache workspace_id in a cookie (httpOnly, same-site, 1 hour TTL)
        client.response.cookies.set('x-workspace-id', userRecord.workspace_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600, // 1 hour
          path: '/',
        })
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
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      })
    }

    return client.response
  } catch (error) {
    safeError('Middleware invocation failed:', error)
    safeError('Error details:', {
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

    // For public routes (login, signup, welcome, etc.), don't redirect — just pass through
    // to prevent infinite redirect loops when middleware errors on /login itself.
    const isPublicOnError =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/welcome') ||
      pathname.startsWith('/auth/callback') ||
      pathname === '/'
    if (isPublicOnError) {
      return NextResponse.next({ request: req })
    }

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
