import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import type { OnboardingClient, ClientStatus } from '@/types/onboarding'
import ClientsTable from './ClientsTable'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

const PAGE_SIZE = 20

export default async function OnboardingClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const statusFilter = params.status ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const supabase = createAdminClient()

  let query = supabase
    .from('onboarding_clients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('company_name', `%${search}%`)
  }

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    throw new Error(`Failed to load clients: ${error.message}`)
  }

  const clients = (data ?? []) as OnboardingClient[]
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Link
        href="/admin/onboarding"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pipeline
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">All Onboarding Clients</h1>

      <ClientsTable
        clients={clients}
        totalPages={totalPages}
        currentPage={page}
        search={search}
        statusFilter={statusFilter as ClientStatus | ''}
      />
    </div>
  )
}
