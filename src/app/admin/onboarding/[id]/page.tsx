import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import type {
  OnboardingClient,
  ClientFile,
  FulfillmentChecklist,
} from '@/types/onboarding'
import ClientDetailTabs from './ClientDetailTabs'
import PortalLinkSection from './PortalLinkSection'
import PipelineStatusBanner from '@/components/admin/onboarding/PipelineStatusBanner'
import { generateStatusToken } from '@/lib/utils/status-token'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OnboardingClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()

  const [clientRes, filesRes, checklistRes] = await Promise.all([
    supabase
      .from('onboarding_clients')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('client_files')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('fulfillment_checklists')
      .select('*')
      .eq('client_id', id)
      .single(),
  ])

  if (clientRes.error || !clientRes.data) {
    notFound()
  }

  const client = clientRes.data as OnboardingClient
  const files = (filesRes.data ?? []) as ClientFile[]
  const checklist = (checklistRes.data ?? null) as FulfillmentChecklist | null
  const statusToken = generateStatusToken(id)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
  const statusUrl = `${baseUrl}/status/${statusToken}`

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/onboarding"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{client.company_name}</h1>
            {client.company_website && (
              <a
                href={client.company_website.startsWith('http') ? client.company_website : `https://${client.company_website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
              >
                {client.company_website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <a
            href={statusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink className="h-3 w-3" />
            Client Status Page
          </a>
        </div>
      </div>

      {/* Portal Link */}
      <div className="mb-6">
        <PortalLinkSection
          clientId={client.id}
          initialPortalInviteSentAt={client.portal_invite_sent_at ?? null}
          primaryContactEmail={client.primary_contact_email}
        />
      </div>

      {/* Pipeline Status — surfaces stuck runs and re-run controls so we
          don't depend on the Inngest dashboard. */}
      <PipelineStatusBanner client={client} />

      {/* Tabs Content */}
      <ClientDetailTabs client={client} files={files} checklist={checklist} />
    </div>
  )
}
