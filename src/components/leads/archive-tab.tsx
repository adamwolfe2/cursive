'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/design-system'
import { LeadCard, type Lead, exportToCSV } from './lead-card'

const ENRICHMENT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Enriched', value: 'enriched' },
  { label: 'Pending', value: 'pending' },
]

export function ArchiveTab({
  onEnrich,
  onView,
  creditsRemaining,
}: {
  workspaceId?: string
  onEnrich: (lead: Lead) => void
  onView: (id: string) => void
  creditsRemaining: number
}) {
  const [page, setPage] = useState(1)
  const [enrichFilter, setEnrichFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search to avoid firing on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['leads-archive', page, enrichFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '24' })
      if (enrichFilter) params.set('enrichment_status', enrichFilter)
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      const res = await fetch(`/api/leads?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
    staleTime: 60_000,
  })

  const leads: Lead[] = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {ENRICHMENT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setEnrichFilter(f.value); setPage(1) }}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                enrichFilter === f.value ? 'bg-primary text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportToCSV(data?.data ?? [], `cursive-leads-archive-p${page}.csv`)}
          disabled={!data?.data?.length}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-36" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No archived leads found</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Archived leads will appear here. Try adjusting your filters or check your active leads.
          </p>
          <a
            href="/leads"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Active Leads
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {leads.map((l) => (
              <LeadCard key={l.id} lead={l} onEnrich={onEnrich} onView={onView} creditsRemaining={creditsRemaining} />
            ))}
          </div>
          {data?.pagination && data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-500">Page {page} of {data.pagination.total_pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
