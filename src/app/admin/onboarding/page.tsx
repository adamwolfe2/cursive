import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import OnboardingKanban from '@/components/admin/onboarding/OnboardingKanban'
import OnboardingAnalytics from '@/components/admin/onboarding/OnboardingAnalytics'
import type { OnboardingClient } from '@/types/onboarding'
import { Users, Rocket, Settings, CheckCircle, Plus } from 'lucide-react'

export default async function OnboardingPipelinePage() {
  const supabase = createAdminClient()

  const { data: clients, error } = await supabase
    .from('onboarding_clients')
    .select('id, company_name, primary_contact_name, primary_contact_email, packages_selected, status, created_at, updated_at, setup_fee, recurring_fee, enriched_icp_brief, target_industries, target_titles, pain_points')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load onboarding clients: ${error.message}`)
  }

  const allClients = (clients ?? []) as OnboardingClient[]

  const totalCount = allClients.length
  const onboardingCount = allClients.filter((c) => c.status === 'onboarding').length
  const setupCount = allClients.filter((c) => c.status === 'setup').length
  const activeCount = allClients.filter((c) => c.status === 'active').length

  const stats = [
    { label: 'Total Clients', value: totalCount, icon: Users, color: 'text-foreground' },
    { label: 'In Onboarding', value: onboardingCount, icon: Rocket, color: 'text-orange-600' },
    { label: 'In Setup', value: setupCount, icon: Settings, color: 'text-cyan-600' },
    { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600' },
  ]

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Client Onboarding Pipeline</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/onboarding/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Client
          </Link>
          <Link
            href="/admin/onboarding/templates"
            className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/admin/onboarding/clients"
            className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            View All Clients
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} padding="sm">
              <div className="flex items-center gap-3">
                <div className={`${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <OnboardingAnalytics clients={allClients as unknown as Parameters<typeof OnboardingAnalytics>[0]['clients']} />

      <OnboardingKanban clients={allClients} />
    </div>
  )
}
