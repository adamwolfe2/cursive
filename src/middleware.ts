// Next.js Middleware
// Handles authentication and multi-tenant routing

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(req: NextRequest) {
  const client = createClient(req)
  const { supabase } = client

  const { pathname } = req.nextUrl

  // Extract subdomain for multi-tenant routing
  const hostname = req.headers.get('host') || ''
  const subdomain = getSubdomain(hostname)

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
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') || // Webhooks are authenticated differently
    pathname === '/api/health' // Health check endpoint for monitoring

  // API routes (except webhooks) require authentication
  const isApiRoute = pathname.startsWith('/api') && !pathname.startsWith('/api/webhooks')

  // Auth routes (login, signup) - redirect to dashboard if already authenticated
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

  // Try to get session - this also refreshes the session if needed
  let session = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data?.session
  } catch (e) {
    // If Supabase fails, treat as not authenticated
    console.error('Middleware: Failed to get session', e)
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

  if (isAuthRoute && session) {
    // Check for redirect param
    const redirectTo = req.nextUrl.searchParams.get('redirect')
    const destination = redirectTo || '/dashboard'
    return redirectWithCookies(new URL(destination, req.url))
  }

  // Protected routes require authentication
  if (!isPublicRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return redirectWithCookies(redirectUrl)
  }

  // API routes require authentication
  if (isApiRoute && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // If authenticated, verify workspace access
  if (session && !isPublicRoute && !pathname.startsWith('/onboarding')) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('*, workspaces(*)')
        .eq('auth_user_id', session.user.id)
        .single()

      // User doesn't have a workspace - redirect to onboarding
      if (!user || !(user as any).workspace_id) {
        if (pathname !== '/onboarding') {
          return redirectWithCookies(new URL('/onboarding', req.url))
        }
      }

      // Validate subdomain matches user's workspace (if subdomain is present)
      if (user && subdomain && subdomain !== 'www') {
        const workspace = (user as any).workspaces

        if (
          workspace?.subdomain !== subdomain &&
          workspace?.custom_domain !== hostname
        ) {
          // User is accessing wrong subdomain
          return NextResponse.json(
            { error: 'Access denied to this workspace' },
            { status: 403 }
          )
        }
      }
    } catch (e) {
      // If database query fails, redirect to onboarding
      console.error('Middleware: Failed to query user', e)
      if (pathname !== '/onboarding') {
        return redirectWithCookies(new URL('/onboarding', req.url))
      }
    }
  }

  // Get the response with updated cookies
  const response = client.response

  // Add custom headers for subdomain information
  if (subdomain) {
    response.headers.set('x-subdomain', subdomain)
  }

  return response
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
