'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  CLIENT_STATUSES,
  STATUS_LABELS,
  PACKAGES,
} from '@/types/onboarding'
import type { OnboardingClient, ClientStatus, PackageSlug } from '@/types/onboarding'
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'

const STATUS_BADGE_VARIANT: Record<ClientStatus, 'muted' | 'info' | 'default' | 'warning' | 'success' | 'destructive'> = {
  lead: 'muted',
  booked: 'info',
  discovery: 'default',
  closed: 'warning',
  onboarding: 'warning',
  setup: 'info',
  active: 'success',
  reporting: 'default',
  churned: 'destructive',
}

const ENRICHMENT_VARIANT: Record<string, 'muted' | 'info' | 'success' | 'destructive' | 'warning'> = {
  pending: 'warning',
  processing: 'info',
  complete: 'success',
  failed: 'destructive',
}

const COPY_VARIANT: Record<string, 'muted' | 'info' | 'success' | 'destructive' | 'warning'> = {
  pending: 'warning',
  processing: 'info',
  complete: 'success',
  failed: 'destructive',
  not_applicable: 'muted',
}

const PACKAGE_COLORS: Record<PackageSlug, string> = {
  super_pixel: 'bg-violet-100 text-violet-700',
  audience: 'bg-blue-100 text-blue-700',
  outbound: 'bg-orange-100 text-orange-700',
  bundle: 'bg-emerald-100 text-emerald-700',
  affiliate: 'bg-pink-100 text-pink-700',
  enrichment: 'bg-cyan-100 text-cyan-700',
  paid_ads: 'bg-amber-100 text-amber-700',
  data_delivery: 'bg-slate-100 text-slate-700',
}

interface ClientsTableProps {
  clients: OnboardingClient[]
  totalPages: number
  currentPage: number
  search: string
  statusFilter: ClientStatus | ''
}

export default function ClientsTable({
  clients,
  totalPages,
  currentPage,
  search,
  statusFilter,
}: ClientsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      // Reset page when filters change
      if ('search' in updates || 'status' in updates) {
        params.delete('page')
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...CLIENT_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ]

  function handleExportCSV() {
    const headers = [
      'Company',
      'Contact Name',
      'Email',
      'Phone',
      'Packages',
      'Status',
      'Setup Fee',
      'Billing Cadence',
      'Outbound Tier',
      'Enrichment',
      'Copy Status',
      'Created',
    ]
    const escape = (v: string | number | null | undefined): string => {
      const s = v === null || v === undefined ? '' : String(v)
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    const rows = clients.map((c) =>
      [
        escape(c.company_name),
        escape(c.primary_contact_name),
        escape(c.primary_contact_email),
        escape(c.primary_contact_phone),
        escape(c.packages_selected.map((p) => PACKAGES[p]?.label ?? p).join('; ')),
        escape(STATUS_LABELS[c.status]),
        escape(c.setup_fee ?? ''),
        escape(c.billing_cadence ?? ''),
        escape(c.outbound_tier ?? ''),
        escape(c.enrichment_status),
        escape(c.copy_generation_status),
        escape(new Date(c.created_at).toISOString().slice(0, 10)),
      ].join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `onboarding-clients-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by company name..."
            defaultValue={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(e) => {
              const value = (e.target as HTMLInputElement).value
              // Debounce-like: update on enter or blur would be better,
              // but for simplicity update immediately
              updateParams({ search: value })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParams({ search: (e.target as HTMLInputElement).value })
              }
            }}
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="w-full sm:w-[200px]"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleExportCSV}
          disabled={clients.length === 0}
          className="sm:w-auto"
          title="Export current page as CSV"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Packages</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrichment</TableHead>
              <TableHead>Copy</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/admin/onboarding/${client.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {client.company_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{client.primary_contact_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{client.primary_contact_email}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {client.packages_selected.slice(0, 2).map((pkg) => (
                        <span
                          key={pkg}
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${PACKAGE_COLORS[pkg]}`}
                        >
                          {PACKAGES[pkg]?.label ?? pkg}
                        </span>
                      ))}
                      {client.packages_selected.length > 2 && (
                        <Badge size="sm" variant="muted">
                          +{client.packages_selected.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[client.status]} size="sm" dot>
                      {STATUS_LABELS[client.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ENRICHMENT_VARIANT[client.enrichment_status] ?? 'muted'} size="sm">
                      {client.enrichment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={COPY_VARIANT[client.copy_generation_status] ?? 'muted'} size="sm">
                      {client.copy_generation_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PortalStatusCell
                      sentAt={client.portal_invite_sent_at ?? null}
                      visitedAt={client.portal_last_visited_at ?? null}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(client.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => updateParams({ page: String(currentPage - 1) })}
              leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => updateParams({ page: String(currentPage + 1) })}
              rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface PortalStatusCellProps {
  sentAt: string | null
  visitedAt: string | null
}

function PortalStatusCell({ sentAt, visitedAt }: PortalStatusCellProps) {
  if (!sentAt) {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-orange-100 text-orange-700 whitespace-nowrap">
        Not sent
      </span>
    )
  }

  const sentDate = new Date(sentAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  if (visitedAt) {
    const visitedDate = new Date(visitedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-green-100 text-green-700 whitespace-nowrap">
        Viewed {visitedDate}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
      Sent {sentDate}
    </span>
  )
}
