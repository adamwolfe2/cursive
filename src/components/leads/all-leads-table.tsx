'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/design-system'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface AllLeadsTableProps {
  workspaceId: string
}

interface LeadRow {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  company_name: string | null
  source: string | null
  status: string | null
  created_at: string | null
}

const PAGE_SIZE = 25

export function AllLeadsTable({ workspaceId }: AllLeadsTableProps) {
  const router = useRouter()
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all-leads', workspaceId, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        per_page: String(PAGE_SIZE),
        page: String(page + 1),
      })
      const res = await fetch(`/api/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json()
    },
    staleTime: 30_000,
  })

  const leads: LeadRow[] = data?.data ?? []
  const total: number = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function displayName(lead: LeadRow): string {
    if (lead.full_name) return lead.full_name
    const parts = [lead.first_name, lead.last_name].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : '-'
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        Failed to load leads. Please try again.
      </div>
    )
  }

  if (leads.length === 0 && page === 0) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        No leads in this workspace yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Email</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Company</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Source</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => router.push(`/crm/leads/${lead.id}`)}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-foreground">{displayName(lead)}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{lead.email ?? '-'}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.company_name ?? '-'}</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{lead.source ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    lead.status === 'new' && 'bg-blue-100 text-blue-700',
                    lead.status === 'contacted' && 'bg-amber-100 text-amber-700',
                    lead.status === 'qualified' && 'bg-green-100 text-green-700',
                    lead.status === 'converted' && 'bg-purple-100 text-purple-700',
                    lead.status === 'lost' && 'bg-red-100 text-red-700',
                    !lead.status && 'bg-zinc-100 text-zinc-600',
                  )}>
                    {lead.status ?? 'new'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{formatDate(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
