/**
 * Admin Layout
 * Cursive Platform
 *
 * Protected layout for admin pages with role-based authentication.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUserWithRole } from '@/lib/auth/roles'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use getSession() (local cookie read) instead of getUser() (network call that hangs)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login?error=unauthorized')
  }

  // Get user with role in single DB query (isAdmin was making a redundant call)
  const userWithRole = await getUserWithRole(session.user)
  if (!userWithRole || (userWithRole.role !== 'owner' && userWithRole.role !== 'admin')) {
    redirect('/dashboard?error=admin_required')
  }

  const adminEmail = userWithRole.email || session.user.email || 'Admin'

  let needsApprovalCount = 0
  try {
    const adminClient = createAdminClient()
    const { count } = await adminClient
      .from('email_replies')
      .select('id', { count: 'exact', head: true })
      .eq('draft_status', 'needs_approval')
    needsApprovalCount = count || 0
  } catch { /* non-fatal */ }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="flex items-center gap-2 flex-shrink-0">
                <div className="relative h-7 w-7 overflow-hidden rounded-lg flex-shrink-0">
                  <Image src="/cursive-logo.png" alt="Cursive" fill className="object-contain" priority />
                </div>
                <span className="text-sm font-semibold text-zinc-900">Cursive Admin</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {[
                  { href: '/admin/dashboard', label: 'Dashboard' },
                  { href: '/admin/accounts', label: 'Accounts' },
                  { href: '/admin/services/subscriptions', label: 'Services' },
                  { href: '/admin/waitlist', label: 'Waitlist' },
                  { href: '/admin/support', label: 'Support' },
                  { href: '/admin/requests', label: 'Feedback' },
                  { href: '/admin/premium-requests', label: 'Upgrades' },
                  { href: '/admin/leads', label: 'Leads' },
                  { href: '/admin/analytics', label: 'Analytics' },
                  { href: '/admin/payouts', label: 'Payouts' },
                  { href: '/admin/api', label: 'API Costs' },
                  { href: '/admin/monitoring/dedup-enrichment', label: 'Dedup' },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors whitespace-nowrap"
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/admin/sdr"
                  className="px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors flex items-center"
                >
                  AI SDR
                  {needsApprovalCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {needsApprovalCount > 9 ? '9+' : needsApprovalCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 hidden lg:block">{adminEmail}</span>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
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
