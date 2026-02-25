'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { EnhancedLeadsTable, type EnhancedLeadsTableHandle } from '@/components/crm/table/EnhancedLeadsTable'
import { IntegrationExportBar } from '@/components/crm/export/IntegrationExportBar'
import { EnrichAllButton } from '@/components/crm/EnrichAllButton'
import { RecordDrawer } from '@/components/crm/drawer/RecordDrawer'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { LeadTableRow } from '@/types/crm.types'

interface LeadsPageClientProps {
  initialData: LeadTableRow[]
  currentPage: number
  perPage: number
  totalCount: number
}

export function LeadsPageClient({ initialData, currentPage, perPage, totalCount }: LeadsPageClientProps) {
  const [leads] = useState<LeadTableRow[]>(initialData)
  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const tableRef = useRef<EnhancedLeadsTableHandle>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedLeadIds(ids)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedLeadIds([])
    tableRef.current?.clearSelection()
  }, [])

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    if (!params.has('per_page')) {
      params.set('per_page', String(perPage))
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleRowClick = (lead: LeadTableRow) => {
    setSelectedLead(lead.id)
    setDrawerOpen(true)
  }

  const selectedLeadData = leads.find((l) => l.id === selectedLead)

  // Collect IDs of leads that haven't been enriched yet
  const unenrichedLeadIds = leads
    .filter((l) => (l as LeadTableRow & { enrichment_status?: string }).enrichment_status !== 'enriched')
    .map((l) => l.id)

  return (
    <>
      <div className="flex h-full flex-col p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Integration Export Bar */}
          <IntegrationExportBar
            selectedLeadIds={selectedLeadIds}
            onClearSelection={handleClearSelection}
          />

          {/* Enrich All unprocessed leads */}
          {unenrichedLeadIds.length > 0 && (
            <div className="mb-4 flex justify-end">
              <EnrichAllButton
                leadIds={unenrichedLeadIds}
                onComplete={() => router.refresh()}
              />
            </div>
          )}

          {/* Enhanced square-ui inspired table */}
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 px-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Users className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No leads in your CRM yet</h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Leads you enrich from your daily feed will appear here. Set your targeting preferences to start receiving matched leads.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link href="/leads">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    View Daily Leads
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/my-leads/preferences">
                  <Button size="sm" className="gap-1.5">
                    Set Preferences
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <EnhancedLeadsTable
              ref={tableRef}
              data={leads}
              onRowClick={handleRowClick}
              onSelectionChange={handleSelectionChange}
            />
          )}

          {/* Server-side pagination across all leads */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 mt-4 rounded-lg border border-gray-200 bg-white">
              <div className="text-sm text-gray-600">
                Page <span className="font-medium text-gray-900">{currentPage}</span> of{' '}
                <span className="font-medium text-gray-900">{totalPages}</span>
                <span className="ml-2 text-gray-400">
                  ({totalCount} total leads)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 border-gray-200"
                  onClick={() => navigateToPage(1)}
                  disabled={currentPage <= 1}
                  aria-label="Go to first page"
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 border-gray-200"
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 border-gray-200"
                  onClick={() => navigateToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="Go to next page"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 border-gray-200"
                  onClick={() => navigateToPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  aria-label="Go to last page"
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Drawer */}
      <RecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          selectedLeadData
            ? [selectedLeadData.first_name, selectedLeadData.last_name].filter(Boolean).join(' ') || 'Unnamed Lead'
            : ''
        }
        subtitle={selectedLeadData?.company_name}
      >
        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Email</span>
                <a
                  href={`mailto:${selectedLeadData?.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {selectedLeadData?.email || '-'}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Phone</span>
                <a
                  href={`tel:${selectedLeadData?.phone}`}
                  className="text-sm text-foreground"
                >
                  {selectedLeadData?.phone || '-'}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Company</span>
                <span className="text-sm text-foreground">
                  {selectedLeadData?.company_name || '-'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Location</span>
                <span className="text-sm text-foreground">
                  {[selectedLeadData?.city, selectedLeadData?.state]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lead Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Status</span>
                <div className="text-sm">
                  {selectedLeadData?.status && (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {selectedLeadData.status.charAt(0).toUpperCase() +
                        selectedLeadData.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Owner</span>
                <span className="text-sm text-foreground">
                  {selectedLeadData?.assigned_user?.full_name || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Created</span>
                <span className="text-sm text-foreground">
                  {selectedLeadData &&
                    formatDistanceToNow(new Date(selectedLeadData.created_at), {
                      addSuffix: true,
                    })}
                </span>
              </div>
            </div>
          </div>

          {/* LinkedIn */}
          {selectedLeadData?.linkedin_url && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Social
              </h3>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">LinkedIn</span>
                <a
                  href={selectedLeadData.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Profile
                </a>
              </div>
            </div>
          )}
        </div>
      </RecordDrawer>
    </>
  )
}
