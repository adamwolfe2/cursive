import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OnboardingChecklist } from '@/components/onboarding/checklist'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    redirect('/login')
  }

  // Get user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*, workspaces(*)')
    .eq('auth_user_id', session.user.id)
    .single()

  // Type the user data
  const user = userData as {
    id: string
    auth_user_id: string
    workspace_id: string
    email: string
    full_name: string | null
    plan: string | null
    role: string
    workspaces: {
      id: string
      name: string
      industry_vertical: string | null
    } | null
  } | null

  // If no user profile exists, redirect to onboarding
  if (userError || !user || !user.workspace_id) {
    redirect('/onboarding')
  }

  // Get leads count (safe query)
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', user.workspace_id)

  // Get recent leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', user.workspace_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const workspace = user.workspaces as any

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">{workspace?.name || 'Your Workspace'}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Link
              href="/auth/signout"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Onboarding Checklist */}
        <div className="mb-8">
          <OnboardingChecklist />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Leads</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">{leadsCount || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Industry</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">{workspace?.industry_vertical || 'Not set'}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Plan</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1 capitalize">{user.plan || 'Free'}</p>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Leads</h2>
            <Link href="/leads" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {recentLeads && recentLeads.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentLeads.map((lead: any) => (
                <div key={lead.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{lead.company_name || lead.contact_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{lead.contact_email || lead.industry || 'No details'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                    lead.status === 'qualified' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lead.status || 'new'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No leads yet</p>
              <p className="text-sm text-gray-400">Leads will appear here once they are added to your workspace</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/leads" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors">
            <h3 className="font-semibold text-gray-900">View Leads</h3>
            <p className="text-sm text-gray-500 mt-1">Browse and manage your leads</p>
          </Link>
          <Link href="/settings" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors">
            <h3 className="font-semibold text-gray-900">Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Manage your account and workspace</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
