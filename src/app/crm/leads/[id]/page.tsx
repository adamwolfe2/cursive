// Lead Details Page
// Full details view for a single lead

import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LeadRepository } from '@/lib/repositories/lead.repository'
import { QueryProvider } from '@/components/providers/query-provider'
import { LeadDetailClient } from './components/LeadDetailClient'

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

  // Check authentication
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch lead data
  const leadRepo = new LeadRepository()
  const lead = await leadRepo.findById(id, user.workspace_id)

  if (!lead) {
    notFound()
  }

  return (
    <QueryProvider>
      <LeadDetailClient initialLead={lead} />
    </QueryProvider>
  )
}
