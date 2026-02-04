// Simple middleware for marketing site
// No authentication or database needed - just basic routing

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Just pass through all requests
  return NextResponse.next()
}

// Only run on specific paths if needed
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
