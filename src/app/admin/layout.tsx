/**
 * Admin Layout
 * Cursive Platform
 *
 * Protected layout for admin pages with role-based authentication.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, getUserWithRole } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check admin role from database
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login?error=unauthorized')
  }

  // Verify user has admin or owner role
  const hasAdminAccess = await isAdmin(session.user)
  if (!hasAdminAccess) {
    redirect('/dashboard?error=admin_required')
  }

  const user = await getUserWithRole(session.user)
  const adminEmail = user?.email || session.user.email || 'Admin'

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/90 text-white">
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
                  href="/admin/services/subscriptions"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Services
                </Link>
                <Link
                  href="/admin/waitlist"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Waitlist
                </Link>
                <Link
                  href="/admin/support"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Support
                </Link>
                <Link
                  href="/admin/leads"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Leads
                </Link>
                <Link
                  href="/admin/analytics"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Analytics
                </Link>
                <Link
                  href="/admin/payouts"
                  className="text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Payouts
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
