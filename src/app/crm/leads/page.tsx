// CRM Leads Page
// Main CRM page for viewing and managing leads

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QueryProvider } from '@/components/providers/query-provider'
import { LeadsTableClient } from './components/LeadsTableClient'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { TableViewControls } from './components/TableViewControls'

export const metadata = {
  title: 'Leads - CRM',
  description: 'Manage your sales leads and contacts',
}

export default async function CRMLeadsPage() {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's workspace
  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!userData?.workspace_id) {
    redirect('/onboarding')
  }

  return (
    <QueryProvider>
      <div className="flex h-screen">
        {/* CRM Sidebar - TODO: Build in Week 2 */}
        <aside className="w-64 border-r bg-muted/10">
          <div className="p-6">
            <h2 className="text-xl font-semibold">CRM</h2>
            <nav className="mt-6 space-y-2">
              <div className="px-3 py-2 bg-background rounded-md font-medium">
                Leads
              </div>
              <div className="px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-md cursor-pointer">
                Companies
              </div>
              <div className="px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-md cursor-pointer">
                Contacts
              </div>
              <div className="px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-md cursor-pointer">
                Deals
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Header */}
            <header className="border-b bg-background px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">Leads</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage your sales leads and contacts
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
