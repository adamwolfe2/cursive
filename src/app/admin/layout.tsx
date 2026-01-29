/**
 * Admin Layout
 * Cursive Platform
 *
 * Protected layout for admin pages with authentication.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Simple admin check - just verify email
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const isAdminUser = session?.user?.email === 'adam@meetcursive.com'

  if (!isAdminUser) {
    redirect('/login?error=unauthorized')
  }

  const adminEmail = session?.user?.email || 'Admin'

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <span className="font-semibold">Cursive Admin</span>
              </Link>

              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/admin/dashboard"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/accounts"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Accounts
                </Link>
                <Link
                  href="/admin/leads"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Leads
                </Link>
                <Link
                  href="/admin/partners"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Partners
                </Link>
                <Link
                  href="/admin/marketplace"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Marketplace
                </Link>
                <Link
                  href="/admin/payouts"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Payouts
                </Link>
                <Link
                  href="/admin/analytics"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Analytics
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400">{adminEmail}</span>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-300 hover:text-white transition-colors"
              >
                Exit Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
