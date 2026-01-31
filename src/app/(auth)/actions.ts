'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string || '/dashboard'

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
    console.error('❌ Server Action: Login error:', signInError)
    return { error: signInError.message }
  }

  // Redirect will trigger middleware with cookies now set
  redirect(redirectTo)
}

export async function googleLoginAction(redirectTo: string = '/dashboard') {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${redirectTo}`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { error: 'Failed to initiate Google login' }
}
