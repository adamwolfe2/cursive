// CRM Leads Page
// Main CRM page for viewing and managing leads

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { QueryProvider } from '@/components/providers/query-provider'
import { LeadsTableClient } from './components/LeadsTableClient'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { TableViewControls } from './components/TableViewControls'
import { MobileMenu } from '@/components/ui/mobile-menu'

export const metadata = {
  title: 'Leads - CRM',
  description: 'Manage your sales leads and contacts',
}

export default async function CRMLeadsPage() {
  // Middleware already validated auth - no need to check again
  // Just render the CRM interface

  // Sidebar content for reuse in both mobile drawer and desktop sidebar
  const sidebarContent = (
    <div className="p-6">
      <h2 className="text-xl font-semibold bg-gradient-cursive bg-clip-text text-transparent">
        CRM
      </h2>
      <nav className="mt-6 space-y-1.5">
        <div className="px-3 py-2.5 bg-gradient-cursive text-white rounded-lg font-medium shadow-sm">
          Leads
        </div>
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
        <Link
          href="/crm/deals"
          className="block px-3 py-2.5 text-muted-foreground hover:bg-gradient-cursive-subtle rounded-lg transition-all"
        >
          Deals
        </Link>
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
                      Leads
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Manage your sales leads and contacts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TableViewControls />
                  <KeyboardShortcutsHelp />
                </div>
              </div>
            </header>

            {/* Table with filters */}
            <div className="flex-1 p-6 overflow-hidden">
              <LeadsTableClient />
            </div>
          </div>
        </main>
      </div>
    </QueryProvider>
  )
}
