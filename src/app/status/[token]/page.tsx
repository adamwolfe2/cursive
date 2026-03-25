import { createAdminClient } from '@/lib/supabase/server'
import { verifyStatusToken } from '@/lib/utils/status-token'
import Image from 'next/image'
import { CheckCircle, Clock, Loader2 } from 'lucide-react'

interface MilestoneItem {
  label: string
  status: 'complete' | 'in_progress' | 'upcoming'
}

export default async function ClientStatusPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const clientId = verifyStatusToken(token)

  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-sm text-gray-500">This status page link is invalid or expired.</p>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()
  const { data: client } = await supabase
    .from('onboarding_clients')
    .select('company_name, status, enrichment_status, copy_generation_status, copy_approval_status, start_timeline, created_at, onboarding_complete, confirmation_email_sent, stripe_invoice_status, rabbitsign_status')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Not Found</h1>
          <p className="text-sm text-gray-500">This client record was not found.</p>
        </div>
      </div>
    )
  }

  // Build milestones
  const milestones: MilestoneItem[] = [
    {
      label: 'Onboarding form received',
      status: client.onboarding_complete ? 'complete' : 'in_progress',
    },
    {
      label: 'ICP analysis',
      status: client.enrichment_status === 'complete' ? 'complete'
        : client.enrichment_status === 'processing' ? 'in_progress'
        : 'upcoming',
    },
    {
      label: 'Email copy drafted',
      status: client.copy_generation_status === 'complete' ? 'complete'
        : client.copy_generation_status === 'processing' ? 'in_progress'
        : client.copy_generation_status === 'not_applicable' ? 'complete'
        : 'upcoming',
    },
    {
      label: 'Infrastructure setup (domains, inboxes)',
      status: client.status === 'active' || client.status === 'reporting' ? 'complete'
        : client.status === 'setup' ? 'in_progress'
        : 'upcoming',
    },
    {
      label: 'Campaign launch',
      status: client.status === 'active' || client.status === 'reporting' ? 'complete' : 'upcoming',
    },
  ]

  const completedCount = milestones.filter((m) => m.status === 'complete').length
  const progressPercent = Math.round((completedCount / milestones.length) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-lg px-4 py-4 flex items-center justify-between">
          <Image src="/cursive-logo.png" alt="Cursive" width={100} height={32} className="h-7 w-auto" />
          <span className="text-xs text-gray-400">Client Status</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Your Cursive setup is underway</h1>
            {client.company_name && (
              <p className="text-sm text-gray-500">{client.company_name}</p>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">{progressPercent}% complete</span>
              <span className="text-xs text-gray-400">{completedCount}/{milestones.length} steps</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            {milestones.map((milestone, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {milestone.status === 'complete' ? (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  ) : milestone.status === 'in_progress' ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <span className={`text-sm ${
                  milestone.status === 'complete' ? 'text-gray-900'
                    : milestone.status === 'in_progress' ? 'text-blue-700 font-medium'
                    : 'text-gray-400'
                }`}>
                  {milestone.label}
                </span>
              </div>
            ))}
          </div>

          {client.start_timeline && (
            <div className="mt-6 rounded-md bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-xs text-blue-700">
                Estimated launch timeline: <span className="font-medium">{client.start_timeline}</span>
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Questions? Contact <a href="mailto:support@meetcursive.com" className="text-blue-600 hover:text-blue-700">support@meetcursive.com</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
