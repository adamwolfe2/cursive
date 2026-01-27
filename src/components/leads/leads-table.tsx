'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table'
import type { Lead } from '@/types'
import { LeadsTableToolbar } from './leads-table-toolbar'
import { LeadDetailPanel } from './lead-detail-panel'
import { IntentBadge } from './intent-badge'
import { formatDate, cn } from '@/lib/utils'
import { TableSkeleton } from '@/components/skeletons'
import { ErrorDisplay } from '@/components/error-display'

interface LeadsTableProps {
  initialFilters?: {
    query_id?: string
    enrichment_status?: string
    delivery_status?: string
    intent_score?: string
  }
}

export function LeadsTable({ initialFilters }: LeadsTableProps) {
  const queryClient = useQueryClient()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Fetch leads with all filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'leads',
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
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

  // Bulk delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const promises = leadIds.map((id) =>
        fetch(`/api/leads/${id}`, { method: 'DELETE' })
      )
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setRowSelection({})
    },
  })

  // Define columns with sorting
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      // Selection column
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      // Company column
      {
        accessorKey: 'company_data.name',
        id: 'company',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-zinc-900"
          >
            Company
            {column.getIsSorted() && (
              <span className="text-zinc-400">
                {column.getIsSorted() === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const name = row.original.company_data?.name || 'Unknown'
          const domain = row.original.company_data?.domain
          return (
            <div className="min-w-[200px]">
              <div className="font-medium text-zinc-900 text-[13px]">{name}</div>
              {domain && (
                <div className="text-[13px] text-zinc-500">{domain}</div>
              )}
            </div>
          )
        },
        sortingFn: 'text',
      },
      // Intent column
      {
        accessorKey: 'intent_data.score',
        id: 'intent',
        header: 'Intent',
        cell: ({ row }) => {
          const score = (row.original.intent_data?.score || 'cold') as
            | 'hot'
            | 'warm'
            | 'cold'
          return <IntentBadge score={score} size="sm" />
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
        },
      },
      // Industry column
      {
        accessorKey: 'company_data.industry',
        id: 'industry',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-zinc-900"
          >
            Industry
            {column.getIsSorted() && (
              <span className="text-zinc-400">
                {column.getIsSorted() === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const industry = row.original.company_data?.industry
          return (
            <div className="text-[13px] text-zinc-900">
              {industry || 'N/A'}
            </div>
          )
        },
      },
      // Location column
      {
        accessorKey: 'company_data.location',
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const location = row.original.company_data?.location
          const locationStr = [location?.city, location?.state, location?.country]
            .filter(Boolean)
            .join(', ')
          return (
            <div className="text-[13px] text-zinc-900">
              {locationStr || 'N/A'}
            </div>
          )
        },
        enableSorting: false,
      },
      // Contact column
      {
        accessorKey: 'contact_data.primary_contact',
        id: 'contact',
        header: 'Contact',
        cell: ({ row }) => {
          const contact = row.original.contact_data?.primary_contact
          if (!contact) {
            return <div className="text-[13px] text-zinc-500">No contact</div>
          }
          return (
            <div className="min-w-[180px]">
              <div className="text-[13px] font-medium text-zinc-900">
                {contact.full_name}
              </div>
              <div className="text-[13px] text-zinc-500">{contact.title}</div>
              {contact.email && (
                <div className="text-[13px] text-emerald-600">{contact.email}</div>
              )}
            </div>
          )
        },
        enableSorting: false,
      },
      // Status column
      {
        accessorKey: 'enrichment_status',
        id: 'status',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-zinc-900"
          >
            Status
            {column.getIsSorted() && (
              <span className="text-zinc-400">
                {column.getIsSorted() === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const status = row.original.enrichment_status
          const statusConfig: Record<
            string,
            { bg: string; text: string; ring: string }
          > = {
            completed: {
              bg: 'bg-emerald-50',
              text: 'text-emerald-700',
              ring: 'ring-emerald-600/20',
            },
            pending: {
              bg: 'bg-amber-50',
              text: 'text-amber-700',
              ring: 'ring-amber-600/20',
            },
            failed: {
              bg: 'bg-red-50',
              text: 'text-red-700',
              ring: 'ring-red-600/20',
            },
          }
          const config = statusConfig[status] || statusConfig.pending
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[13px] font-medium ring-1 ring-inset',
                config.bg,
                config.text,
                config.ring
              )}
            >
              {status}
            </span>
          )
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
        },
      },
      // Created column
      {
        accessorKey: 'created_at',
        id: 'created',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-zinc-900"
          >
            Created
            {column.getIsSorted() && (
              <span className="text-zinc-400">
                {column.getIsSorted() === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-[13px] text-zinc-900">
              {formatDate(row.original.created_at)}
            </div>
          )
        },
        sortingFn: 'datetime',
      },
      // Actions column
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedLead(row.original)
              }}
              className="text-[13px] font-medium text-emerald-600 hover:text-emerald-700"
            >
              View
            </button>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  )

  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: data?.pagination?.total_pages || 0,
    enableRowSelection: true,
  })

  // Get selected lead IDs
  const selectedLeadIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => {
        const row = table.getRowModel().rows[parseInt(key)]
        return row?.original?.id
      })
      .filter(Boolean)
  }, [rowSelection, table])

  const handleBulkDelete = useCallback(async () => {
    if (
      selectedLeadIds.length === 0 ||
      !confirm(`Delete ${selectedLeadIds.length} lead(s)?`)
    ) {
      return
    }
    await deleteMutation.mutateAsync(selectedLeadIds)
  }, [selectedLeadIds, deleteMutation])

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
        <LeadsTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          onRefresh={() => refetch()}
          selectedCount={0}
          onBulkDelete={handleBulkDelete}
          isDeleting={false}
        />
        <ErrorDisplay
          error={error as Error}
          retry={() => refetch()}
          variant="card"
          title="Failed to load leads"
        />
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-lg border border-zinc-200 bg-white" />
        <TableSkeleton rows={10} columns={8} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LeadsTableToolbar
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onRefresh={() => refetch()}
        selectedCount={selectedLeadIds.length}
        selectedLeadIds={selectedLeadIds}
        onBulkDelete={handleBulkDelete}
        isDeleting={deleteMutation.isPending}
      />

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
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
            <tbody className="divide-y divide-zinc-200 bg-white">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-[13px] text-zinc-500"
                  >
                    No leads found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      row.getIsSelected() ? 'bg-emerald-50' : 'hover:bg-zinc-50'
                    )}
                    onClick={() => setSelectedLead(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-zinc-700">
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
              <span className="font-medium">{data?.pagination?.total || 0}</span>{' '}
              results
            </span>

            {/* Page size selector */}
            <select
              value={pagination.pageSize}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  pageSize: Number(e.target.value),
                  pageIndex: 0,
                }))
              }
              className="rounded-md border-zinc-300 text-[13px] focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-[13px] text-zinc-700">
              Page {pagination.pageIndex + 1} of {data?.pagination?.total_pages || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Last
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
