// Marketing site middleware with security headers
// No authentication or database needed - just security and routing

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  const headers = {
    // Content Security Policy - allows GA4, Cal.com, and necessary scripts
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cal.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://cal.com https://va.vercel-scripts.com https://vitals.vercel-analytics.com",
      "frame-src 'self' https://cal.com",
      "frame-ancestors 'self'",
      "form-action 'self' https://cal.com",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; '),

    // Force HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Prevent clickjacking
    'X-Frame-Options': 'SAMEORIGIN',

    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
    ].join(', '),
  }

  // Apply all security headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// Only run on specific paths if needed
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images)
     * - SEO files (robots.txt, sitemap.xml, llms.txt)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml)$).*)',
  ],
}
