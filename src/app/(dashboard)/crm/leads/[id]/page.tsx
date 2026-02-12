// Lead Details Page
// Full details view for a single lead

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeadRepository } from '@/lib/repositories/lead.repository'
import { QueryProvider } from '@/components/providers/query-provider'
import { LeadDetailClient } from './components/LeadDetailClient'
import type { LeadTableRow } from '@/types/crm.types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return {
    title: `Lead Details - ${id.slice(0, 8)}`,
    description: 'View and manage lead details',
  }
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params

  // Layout already verified auth — get session for workspace lookup
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', session.user.id)
    .single()
  if (!userData?.workspace_id) redirect('/welcome')

  // Fetch lead data
  const leadRepo = new LeadRepository()
  const lead = await leadRepo.findById(id, userData.workspace_id)

  if (!lead) {
    notFound()
  }

  // Map LeadWithRelations to LeadTableRow for the client component
  const leadTableRow: LeadTableRow = {
    id: lead.id,
    workspace_id: lead.workspace_id,
    first_name: lead.first_name ?? undefined,
    last_name: lead.last_name ?? undefined,
    email: lead.email ?? undefined,
    phone: lead.phone ?? undefined,
    company_name: lead.company_name ?? undefined,
    company_industry: lead.company_industry ?? undefined,
    title: lead.contact_title ?? undefined,
    job_title: lead.job_title ?? undefined,
    city: lead.city ?? undefined,
    state: lead.state ?? undefined,
    country: lead.country ?? undefined,
    company_size: lead.company_size ?? undefined,
    company_domain: lead.company_domain ?? undefined,
    source: lead.source,
    status: lead.status,
    linkedin_url: lead.linkedin_url ?? undefined,
    created_at: lead.created_at,
    updated_at: lead.created_at, // LeadWithRelations lacks updated_at; fall back to created_at
  }

  return (
    <QueryProvider>
      <LeadDetailClient initialLead={leadTableRow} />
    </QueryProvider>
  )
}
