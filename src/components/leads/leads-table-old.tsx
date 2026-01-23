'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import type { Lead } from '@/types'
import { LeadsTableToolbar } from './leads-table-toolbar'
import { LeadDetailPanel } from './lead-detail-panel'

interface LeadsTableProps {
  initialFilters?: {
    query_id?: string
    enrichment_status?: string
    delivery_status?: string
    intent_score?: string
  }
}

export function LeadsTable({ initialFilters }: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Fetch leads
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'leads',
      pagination.pageIndex,
      pagination.pageSize,
      columnFilters,
      globalFilter,
      initialFilters,
    ],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(pagination.pageIndex + 1))
      params.append('per_page', String(pagination.pageSize))

      // Apply column filters
      columnFilters.forEach((filter) => {
        params.append(filter.id, String(filter.value))
      })

      // Apply global search
      if (globalFilter) {
        params.append('search', globalFilter)
      }

      // Apply initial filters
      if (initialFilters) {
        Object.entries(initialFilters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })
      }

      const response = await fetch(`/api/leads?${params}`)
      if (!response.ok) throw new Error('Failed to fetch leads')
      return response.json()
    },
  })

  // Define columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'company_data.name',
      header: 'Company',
      cell: ({ row }) => {
        const name = row.original.company_data?.name || 'Unknown'
        const domain = row.original.company_data?.domain
        return (
          <div className="min-w-[200px]">
            <div className="font-medium text-gray-900">{name}</div>
            {domain && (
              <div className="text-sm text-gray-500">{domain}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'intent_data.score',
      header: 'Intent',
      cell: ({ row }) => {
        const score = row.original.intent_data?.score || 'cold'
        const badges: Record<string, { bg: string; text: string; emoji: string }> = {
          hot: { bg: 'bg-red-100', text: 'text-red-800', emoji: '🔥' },
          warm: { bg: 'bg-orange-100', text: 'text-orange-800', emoji: '⚡' },
          cold: { bg: 'bg-blue-100', text: 'text-blue-800', emoji: '❄️' },
        }
        const badge = badges[score] || badges.cold
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
          >
            {badge.emoji} {score.toUpperCase()}
          </span>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'company_data.industry',
      header: 'Industry',
      cell: ({ row }) => {
        const industry = row.original.company_data?.industry
        return (
          <div className="text-sm text-gray-900">
            {industry || 'N/A'}
          </div>
        )
      },
    },
    {
      accessorKey: 'contact_data.primary_contact',
      header: 'Contact',
      cell: ({ row }) => {
        const contact = row.original.contact_data?.primary_contact
        if (!contact) {
          return <div className="text-sm text-gray-500">No contact</div>
        }
        return (
          <div className="min-w-[180px]">
            <div className="text-sm font-medium text-gray-900">
              {contact.full_name}
            </div>
            <div className="text-xs text-gray-500">{contact.title}</div>
            {contact.email && (
              <div className="text-xs text-blue-600">{contact.email}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'enrichment_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.enrichment_status
        const statusConfig: Record<string, { bg: string; text: string }> = {
          completed: { bg: 'bg-green-100', text: 'text-green-800' },
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
          failed: { bg: 'bg-red-100', text: 'text-red-800' },
        }
        const config = statusConfig[status] || statusConfig.pending
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}
          >
            {status}
          </span>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.original.created_at)
        return (
          <div className="text-sm text-gray-900">
            {date.toLocaleDateString()}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return (
          <button
            onClick={() => setSelectedLead(row.original)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View
          </button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: data?.pagination?.total_pages || 0,
  })

  return (
    <div className="space-y-4">
      <LeadsTableToolbar
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onRefresh={() => refetch()}
      />

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Loading leads...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No leads found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedLead(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {pagination.pageIndex * pagination.pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  data?.pagination?.total || 0
                )}
              </span>{' '}
              of{' '}
              <span className="font-medium">
                {data?.pagination?.total || 0}
              </span>{' '}
              results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  )
}
