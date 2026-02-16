'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { safeError } from '@/lib/utils/log-sanitizer'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

async function getClientIpFromHeaders(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  )
}

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

export async function loginAction(formData: FormData) {
  // Rate limit: 10 login attempts per minute per IP
  const clientIp = await getClientIpFromHeaders()
  const rateLimitResult = checkRateLimit(`auth-login:${clientIp}`, {
    windowMs: 60 * 1000,
    max: 10,
  })
  if (!rateLimitResult.allowed) {
    return { error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = sanitizeRedirectPath(formData.get('redirect') as string || '/dashboard')

  // Validate input
  const result = loginSchema.safeParse({ email, password })
  if (!result.success) {
    return { error: 'Invalid email or password format' }
  }

  // Use server client which properly sets cookies
  const supabase = await createClient()

  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (signInError) {
    safeError('❌ Server Action: Login error:', signInError)
    return { error: signInError.message }
  }

  // Redirect will trigger middleware with cookies now set
  redirect(redirectTo)
}

export async function googleLoginAction(redirectTo: string = '/dashboard') {
  // Rate limit: 10 Google login attempts per minute per IP
  const clientIp = await getClientIpFromHeaders()
  const rateLimitResult = checkRateLimit(`auth-google-login:${clientIp}`, {
    windowMs: 60 * 1000,
    max: 10,
  })
  if (!rateLimitResult.allowed) {
    return { error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` }
  }

  redirectTo = sanitizeRedirectPath(redirectTo)

  // Determine site URL: prefer env var, fall back to request origin
  const headersList = await headers()
  const origin = headersList.get('origin') || headersList.get('x-forwarded-host')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (origin ? `https://${origin.replace(/^https?:\/\//, '')}` : null)

  safeError(`[Auth] Google OAuth: siteUrl=${siteUrl} NEXT_PUBLIC_SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET'}`)

  if (!siteUrl) {
    safeError('[Auth] Google OAuth FAILED: no site URL available')
    return { error: 'Site URL not configured. Please contact support.' }
  }

  const normalizedSiteUrl = siteUrl.replace(/\/+$/, '')
  const callbackUrl = `${normalizedSiteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`
  safeError('[Auth] Google OAuth callbackUrl:', callbackUrl)

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) {
    safeError('[Auth] Google OAuth error from Supabase:', error.message)
    return { error: error.message }
  }

  if (data.url) {
    safeError('[Auth] Google OAuth redirecting to:', data.url.substring(0, 80) + '...')
    redirect(data.url)
  }

  safeError('[Auth] Google OAuth: no URL returned from Supabase')
  return { error: 'Failed to initiate Google login' }
}
