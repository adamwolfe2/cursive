// Next.js Middleware
// Handles authentication, multi-tenant routing, and rate limiting

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'
// import { logger } from '@/lib/monitoring/logger'  // TEMP: Disabled for Edge Runtime debugging
import { safeError } from '@/lib/utils/log-sanitizer'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'

// ─── Rate Limiting (distributed via Upstash Redis) ────────────────────────
// checkRateLimit() uses Upstash Redis REST API when UPSTASH_REDIS_REST_URL
// and UPSTASH_REDIS_REST_TOKEN are set, giving durable cross-replica limits.
// Falls back to per-instance in-memory when those env vars are absent.
//
// Tiers: auth=10/min, write=30/min, read=60/min
// See src/lib/middleware/rate-limiter.ts for full documentation.

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')?.trim()
    || 'unknown'
}

/**
 * Set cursive_ref cookie on first visit with ?ref= param.
 * First-touch only — never overwrites an existing cookie.
 * httpOnly: false so client JS can read it for attribution.
 */
function applyAffiliateCookie(req: NextRequest, res: NextResponse): void {
  const refCode = req.nextUrl.searchParams.get('ref')
  if (!refCode) return
  const existing = req.cookies.get('cursive_ref')?.value
  if (existing) return // first-touch — never overwrite
  res.cookies.set('cursive_ref', refCode.toUpperCase(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

export async function middleware(req: NextRequest) {
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
      pathname.startsWith('/api/inngest')
    ) {
      return NextResponse.next({
        request: req,
      })
    }

    // Fully-public API routes that never need auth — skip Supabase client
    // creation entirely. Creating GoTrueClient triggers _recoverAndRefresh()
    // async in the background which can generate unhandled rejections and 504s.
    const FULLY_PUBLIC_API_ROUTES = [
      '/api/affiliate/apply',
      '/api/affiliate/track-click',
      '/api/enrich/website',
      '/api/ext/',
      '/api/lead-capture',
      '/api/onboarding/icp-suggestions',
      '/api/pixel/provision-demo',
      '/api/public/segment-search',
      // Automation endpoint — uses x-automation-secret, no user session needed
      '/api/admin/run-enrichment',
    ]
    if (FULLY_PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
      // For OPTIONS (CORS preflight) — pass through immediately, no rate limit needed
      if (req.method === 'OPTIONS') {
        return NextResponse.next({ request: req })
      }
      // Rate limit POST/GET on these routes (lightweight, no Supabase client)
      const ip = getClientIp(req)
      const rl = await checkRateLimit(ip, 'write')
      if (!rl.success) {
        const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
        return NextResponse.json(
          { error: 'Too many requests', retryAfter },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        )
      }
      return NextResponse.next({ request: req })
    }

    // ─── Rate Limiting for API routes ───────────────────────────────
    if (pathname.startsWith('/api')) {
      const ip = getClientIp(req)
      const tier =
        pathname.startsWith('/api/auth') ? 'auth' as const
        : req.method !== 'GET' ? 'write' as const
        : 'read' as const
      const rl = await checkRateLimit(ip, tier)
      if (!rl.success) {
        const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
        return NextResponse.json(
          { error: 'Too many requests', retryAfter },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }
    }

    // Create Supabase client using SSR pattern
    const client = createClient(req)
    const { supabase } = client

    // Extract subdomain for multi-tenant routing
    const hostname = req.headers.get('host') || ''
    const _host = hostname.split(':')[0] // Remove port if present
    const subdomain = getSubdomain(hostname)

    // Admin-only routes
    const isAdminRoute = pathname.startsWith('/admin')

    // Partner-only routes (page routes and API routes)
    const isPartnerRoute = pathname.startsWith('/partner') || pathname.startsWith('/api/partner')

    // Affiliate portal routes (public marketing + portal)
    const isAffiliateRoute = pathname.startsWith('/affiliate')

    // Public routes that don't require authentication (single source of truth)
    const isPublicRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/welcome') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/status/') ||
      pathname.startsWith('/developers') ||
      pathname.startsWith('/client-onboarding') ||
      pathname.startsWith('/role-selection') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/accept-invite') ||
      pathname.startsWith('/auth/signout') ||
      pathname.startsWith('/mfa-challenge') ||
      pathname.startsWith('/superpixel') ||
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/affiliates') ||
      pathname.startsWith('/api/affiliate/apply') ||
      pathname.startsWith('/api/affiliate/track-click') ||
      pathname.startsWith('/api/lead-capture') ||
      pathname.startsWith('/api/similarweb') ||
      pathname.startsWith('/api/pixel/provision-demo') ||
      pathname.startsWith('/api/public/segment-search') ||
      pathname.startsWith('/audience-intelligence') ||
      // Client portal — token-based auth, no user session required
      pathname.startsWith('/portal/') ||
      pathname.startsWith('/api/portal/') ||
      pathname === '/' ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/api/cron') ||
      pathname.startsWith('/api/inngest')

    // API routes (except webhooks and cron) require authentication
    const isApiRoute = pathname.startsWith('/api') &&
      !pathname.startsWith('/api/webhooks') &&
      !pathname.startsWith('/api/cron')

    // Skip auth check entirely for public routes to prevent redirect loops
    let authenticatedUser: { id: string; email?: string } | null = null
    if (!isPublicRoute) {
      try {
        // SECURITY: getUser() verifies the JWT server-side, preventing forged tokens.
        // Slightly slower than getSession() but required for secure auth.
        const { data: { user: authUser } } = await supabase.auth.getUser()
        authenticatedUser = authUser ? {
          id: authUser.id,
          email: authUser.email,
        } : null
      } catch (e) {
        safeError('[Middleware] Auth session check failed:', e)
        authenticatedUser = null
      }
    }

    const user = authenticatedUser

    // Enforce MFA for enrolled users on page routes only (not API routes)
    if (user && !isPublicRoute && !isApiRoute) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel !== 'aal2') {
        const mfaChallengePath = '/mfa-challenge'
        return NextResponse.redirect(new URL(`${mfaChallengePath}?redirect=${pathname}`, req.url))
      }
    }

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
    // If no valid session, redirect to login. Do NOT clear cookies here —
    // aggressive cookie clearing can worsen redirect loops. Let the fresh
    // login flow overwrite any stale cookies naturally.
    if (!isPublicRoute && !user) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return redirectWithCookies(redirectUrl)
    }

    // Admin routes require admin/owner role (user is guaranteed non-null here —
    // the auth check above already redirects unauthenticated users)
    if (isAdminRoute && user) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!userRecord || (userRecord.role !== 'admin' && userRecord.role !== 'owner')) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json(
            { error: 'Admin role required' },
            { status: 403 }
          )
        }
        const dashboardUrl = new URL('/dashboard', req.url)
        return redirectWithCookies(dashboardUrl)
      }
    }

    // Partner routes require partner/admin/owner role
    if (isPartnerRoute && user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

      if (!userData || !['partner', 'admin', 'owner'].includes(userData.role)) {
        if (isApiRoute) {
          return NextResponse.json({ error: 'Partner access required' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Workspace check: verify authenticated users have a workspace for dashboard routes.
    // Caches workspace_id in a cookie to avoid DB query on every request (~50-100ms savings).
    // Exclude /api/auth/* — needed during onboarding before workspace exists.
    if (user && !isPublicRoute && !isAdminRoute && !isPartnerRoute && !isAffiliateRoute && !pathname.startsWith('/portal') && !pathname.startsWith('/onboarding') && !pathname.startsWith('/client-onboarding') && !pathname.startsWith('/welcome') && !pathname.startsWith('/api/onboarding') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/affiliate')) {
      // Check cookie cache first to avoid DB roundtrip on every request
      const cachedWorkspaceId = req.cookies.get('x-workspace-id')?.value

      if (!cachedWorkspaceId) {
        // Use Edge-compatible client (RLS policies allow users to query their own record)
        const { data: userRecord } = await supabase
          .from('users')
          .select('workspace_id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (!userRecord?.workspace_id) {
          // No workspace — API routes get JSON error, page routes redirect to onboarding.
          // Admin routes are excluded above, so /admin/* is still accessible.
          if (isApiRoute) {
            return NextResponse.json(
              { error: 'No workspace. Complete onboarding first.', code: 'NO_WORKSPACE' },
              { status: 403 }
            )
          }
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

    // Set affiliate ref cookie on first visit with ?ref= param
    applyAffiliateCookie(req, client.response)

    // Add X-Robots-Tag: noindex for all non-marketing routes.
    // The app domain (leads.meetcursive.com) should never be indexed.
    // Marketing paths (/ and static assets) are already excluded by the
    // quick-return at the top of the function.
    const isAppRoute =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/welcome') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/client-onboarding') ||
      pathname.startsWith('/role-selection') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/partner') ||
      pathname.startsWith('/affiliate') ||
      pathname.startsWith('/affiliates') ||
      pathname.startsWith('/superpixel') ||
      pathname.startsWith('/portal')
    if (isAppRoute) {
      client.response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    }

    // Add custom headers for subdomain information
    if (subdomain) {
      client.response.headers.set('x-subdomain', subdomain)
    }

    // Log request completion
    const duration = Date.now() - startTime
    if (duration > 1000) {
      // Only log slow requests
      // logger.info('Slow middleware request', {  // TEMP: Disabled for Edge Runtime debugging
      //   method: req.method,
      //   pathname,
      //   duration,
      //   ip: req.headers.get('x-forwarded-for') || 'unknown',
      // })
      safeError('[Middleware] Slow request:', {
        method: req.method,
        pathname,
        duration,
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
  // ⚠️ CRITICAL - DO NOT REMOVE ⚠️
  // Use Node.js runtime instead of Edge Runtime
  //
  // Edge Runtime has compatibility issues with Supabase auth session validation
  // causing 503 errors and infinite login redirect loops.
  //
  // See commits: 2ec386e, 5946bb5, 39c9ed7
  // Issue: getSession() fails in Edge Runtime → auth cookies not validated → redirect loop
  // Solution: Force Node.js runtime for full Supabase compatibility
  //
  // ⚠️ REMOVING THIS WILL BREAK LOGIN - DO NOT CHANGE TO 'edge' ⚠️
  runtime: 'nodejs',
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
