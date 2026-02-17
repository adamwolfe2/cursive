// Auth Callback Route
// Handles OAuth redirects from Supabase
// Shows loading page while processing to improve UX
//
// IMPORTANT: This route MUST use Node.js runtime (the default), NOT Edge.
// The middleware uses Node.js runtime for Supabase session validation.
// Edge↔Node.js cookie handling mismatch causes login redirect loops.
// See middleware.ts comments for details.

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

// Add HTML loading page for better UX during callback
const LOADING_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signing you in...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fafafa;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #18181b;
    }
    .container { text-align: center; padding: 2rem; }
    .spinner {
      width: 32px;
      height: 32px;
      margin: 0 auto 1.5rem;
      border: 3px solid #e4e4e7;
      border-top-color: #007AFF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    h1 { font-size: 1.125rem; font-weight: 500; margin-bottom: 0.25rem; }
    p { font-size: 0.875rem; color: #71717a; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Signing you in</h1>
    <p>Just a moment...</p>
  </div>
  <script>
    setTimeout(() => { window.location.href = '{{REDIRECT_URL}}'; }, 1500);
  </script>
</body>
</html>
`

function sanitizeRedirectPath(path: string): string {
  // Only allow relative paths starting with /
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return '/dashboard'
  }
  // Block javascript: and data: URIs
  if (path.toLowerCase().includes('javascript:') || path.toLowerCase().includes('data:')) {
    return '/dashboard'
  }
  return path
}

/**
 * Escape a string for safe inclusion in a JavaScript string literal.
 * Prevents XSS when injecting into: window.location.href = '...'
 */
function escapeForJsStringLiteral(str: string): string {
  return str
    .replace(/\\/g, '\\\\')   // backslashes first
    .replace(/'/g, "\\'")      // single quotes
    .replace(/"/g, '\\"')      // double quotes
    .replace(/</g, '\\x3c')   // opening angle brackets (prevents </script> breakout)
    .replace(/>/g, '\\x3e')   // closing angle brackets
    .replace(/\n/g, '\\n')    // newlines
    .replace(/\r/g, '\\r')    // carriage returns
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = sanitizeRedirectPath(requestUrl.searchParams.get('next') || '/dashboard')

  if (code) {
    // Use a Map to accumulate cookies — prevents accidental overwrites if the
    // SDK calls setAll multiple times (e.g., during exchangeCodeForSession + getUser).
    // The last value for each cookie name wins.
    const cookieMap = new Map<string, { name: string; value: string; options?: any }>()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach((cookie) => cookieMap.set(cookie.name, cookie))
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      safeError('[Auth Callback] Code exchange failed:', error.message)
      return NextResponse.redirect(
        new URL('/login?error=auth_callback_error', requestUrl.origin)
      )
    }

    // Verify we actually got session cookies from the exchange
    const hasSessionCookies = Array.from(cookieMap.keys()).some(
      name => name.includes('auth-token')
    )
    if (!hasSessionCookies) {
      safeError('[Auth Callback] No session cookies set after code exchange')
    }

    // Get user and check if they have a workspace
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    let redirectUrl = next
    if (authUser) {
      // Use admin client to bypass RLS (anon-key triggers recursive policy on users table)
      const adminClient = createAdminClient()
      const { data: user } = await adminClient
        .from('users')
        .select('workspace_id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle()

      // Redirect to welcome page if no user profile exists
      if (!user || !user.workspace_id) {
        redirectUrl = '/welcome?returning=true'
      }
    }

    // Show loading page with auto-redirect.
    // Use a short delay (1s) to ensure the browser fully processes Set-Cookie
    // headers before navigating away. An immediate redirect (Refresh: 0) can
    // cause cookie loss on some browsers, breaking the session on the next page.
    const safeRedirectUrl = escapeForJsStringLiteral(redirectUrl)
    const loadingHtml = LOADING_PAGE.replace('{{REDIRECT_URL}}', safeRedirectUrl)
    const response = new NextResponse(loadingHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Refresh': `1; url=${encodeURI(redirectUrl)}`, // 1s delay for cookie propagation
      },
    })

    // Set all accumulated cookies on the response
    cookieMap.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    return response
  }

  // No code provided - redirect to next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
