// CRM Deals Page
// Manage deals and opportunities in the CRM

import Link from 'next/link'
import { TrendingUp, Plus } from 'lucide-react'
import { QueryProvider } from '@/components/providers/query-provider'
import { MobileMenu } from '@/components/ui/mobile-menu'

export const metadata = {
  title: 'Deals - CRM',
  description: 'Manage your deals and sales pipeline',
}

export default async function CRMDealsPage() {
  // Sidebar content for reuse in both mobile drawer and desktop sidebar
  const sidebarContent = (
    <div className="p-6">
      <h2 className="text-xl font-semibold bg-gradient-cursive bg-clip-text text-transparent">
        CRM
      </h2>
      <nav className="mt-6 space-y-1.5">
        <Link
          href="/crm/leads"
          className="block px-3 py-2.5 text-muted-foreground hover:bg-gradient-cursive-subtle rounded-lg transition-all"
        >
          Leads
        </Link>
        <Link
          href="/crm/companies"
          className="block px-3 py-2.5 text-muted-foreground hover:bg-gradient-cursive-subtle rounded-lg transition-all"
        >
          Companies
        </Link>
        <Link
          href="/crm/contacts"
          className="block px-3 py-2.5 text-muted-foreground hover:bg-gradient-cursive-subtle rounded-lg transition-all"
        >
          Contacts
        </Link>
        <div className="px-3 py-2.5 bg-gradient-cursive text-white rounded-lg font-medium shadow-sm">
          Deals
        </div>
      </nav>
    </div>
  )

  return (
    <QueryProvider>
      <div className="flex h-screen bg-gradient-cursive-soft">
        {/* CRM Sidebar - Desktop Only */}
        <aside className="hidden lg:block lg:w-64 border-r border-blue-100/50 bg-white/80 backdrop-blur-sm">
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Header with Gradient */}
            <header className="border-b border-blue-100/50 bg-white/80 backdrop-blur-sm px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile Menu - Only visible on mobile */}
                  <div className="lg:hidden">
                    <MobileMenu triggerClassName="h-11 w-11">
                      {sidebarContent}
                    </MobileMenu>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-cursive bg-clip-text text-transparent">
                      Deals
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Track your sales pipeline and opportunities
                    </p>
                  </div>
                </div>
                <button className="btn-gradient-cursive px-4 py-2 rounded-lg flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Deal
                </button>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full rounded-lg border border-blue-100/50 bg-white/80 backdrop-blur-sm p-8">
                {/* Empty state with shimmer skeletons */}
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-gradient-cursive-soft flex items-center justify-center mb-6">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No deals yet
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                    Start tracking your sales opportunities. Create deals, set stages, and close
                    more business with organized pipeline management.
                  </p>
                  <button className="btn-gradient-cursive px-6 py-2.5 rounded-lg flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Deal
                  </button>

                  {/* Loading skeleton preview */}
                  <div className="mt-12 w-full max-w-3xl space-y-3">
                    <div className="text-xs text-muted-foreground mb-3">Preview (Loading State)</div>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 rounded-lg border border-blue-100/50 bg-gradient-cursive-subtle/30 p-4 flex items-center gap-4"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="shimmer-cursive h-4 w-64 rounded" />
                          <div className="flex items-center gap-3">
                            <div className="shimmer-cursive h-3 w-32 rounded" />
                            <div className="shimmer-cursive h-5 w-20 rounded-full" />
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="shimmer-cursive h-5 w-24 rounded ml-auto" />
                          <div className="shimmer-cursive h-3 w-20 rounded ml-auto" />
                        </div>
                        <div className="shimmer-cursive h-8 w-8 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </QueryProvider>
  )
}
