import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CostDashboard from './CostDashboard'
import type { ClientData } from './types'

export default async function ApiCostsPage() {
  const supabase = createAdminClient()

  // Load all clients with their automation logs for cost calculation
  const { data: clients } = await supabase
    .from('onboarding_clients')
    .select('id, company_name, created_at, status, enrichment_status, copy_generation_status, copy_approval_status, automation_log, intake_source')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/onboarding"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">API Cost Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">
          Estimated Claude API costs per client run and aggregate spend projections.
        </p>
      </div>

      <CostDashboard clients={(clients ?? []) as ClientData[]} />
    </div>
  )
}
