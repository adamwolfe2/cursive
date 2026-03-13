// Auth Layout - Simple layout for auth pages
import type { Metadata } from 'next'

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
