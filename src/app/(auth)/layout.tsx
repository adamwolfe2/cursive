// Auth Layout - Simple layout for auth pages
import type { Metadata } from 'next'

// Force dynamic rendering for all auth pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign In | Cursive',
  description: 'Sign in to your Cursive account to manage leads, enrichment, and campaigns.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
