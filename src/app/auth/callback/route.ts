// Auth Callback Route
// Handles OAuth redirects from Supabase
// Shows loading page while processing to improve UX

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

// Add HTML loading page for better UX during callback
const LOADING_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signing you in...</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 2rem;
      background: white;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: pulse 2s ease-in-out infinite;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    p {
      font-size: 1rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">C</div>
    <h1>Signing you in...</h1>
    <p>Setting up your account</p>
    <div class="spinner"></div>
  </div>
  <script>
    // Auto-redirect after showing loading (in case meta refresh fails)
    setTimeout(() => {
      window.location.href = '{{REDIRECT_URL}}';
    }, 1500);
  </script>
</body>
</html>
`

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    // Create supabase client
    const cookieStore: { name: string; value: string; options?: any }[] = []

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookieStore.push(...cookiesToSet)
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

    let redirectUrl = next
    if (session) {
      const { data: user } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('auth_user_id', session.user.id)
        .single()

      // Redirect to welcome page if no user profile exists
      if (!user || !user.workspace_id) {
        redirectUrl = '/welcome'
      }
    }

    // Show loading page with auto-redirect
    const loadingHtml = LOADING_PAGE.replace('{{REDIRECT_URL}}', redirectUrl)
    const response = new NextResponse(loadingHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Refresh': `0; url=${redirectUrl}`, // Meta refresh for instant redirect
      },
    })

    // Set cookies
    cookieStore.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    return response
  }

  // No code provided - redirect to next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
