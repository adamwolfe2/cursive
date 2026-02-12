'use client'

import { useState, useMemo, useCallback } from 'react'
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
import { LeadMobileCardList } from './lead-mobile-card'
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

// Avatar component for person initials
function PersonAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Generate a consistent color based on name
  const colors = [
    'bg-blue-500',
    'bg-blue-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-orange-500',
  ]
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const bgColor = colors[colorIndex]

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md text-white text-xs font-semibold',
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  )
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

  // Define columns - person-centric display
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
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      // Name column (person-centric with avatar)
      {
        accessorKey: 'full_name',
        id: 'name',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-zinc-900"
          >
            Name
            {column.getIsSorted() && (
              <span className="text-zinc-400">
                {column.getIsSorted() === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const fullName = row.original.full_name ||
            `${row.original.first_name || ''} ${row.original.last_name || ''}`.trim() ||
            'Unknown'
          return (
            <div className="flex items-center gap-3 min-w-[180px]">
              <PersonAvatar name={fullName} className="h-8 w-8" />
              <span className="font-medium text-zinc-900 text-sm">{fullName}</span>
            </div>
          )
        },
        sortingFn: 'text',
      },
      // Title column
      {
        accessorKey: 'job_title',
        id: 'title',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-zinc-900"
          >
            Title
            {column.getIsSorted() && (
              <span className="text-zinc-400">
                {column.getIsSorted() === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const title = row.original.contact_title || row.original.job_title || ''
          return (
            <div className="text-sm text-zinc-600 min-w-[150px] truncate max-w-[200px]">
              {title || <span className="text-zinc-400">-</span>}
            </div>
          )
        },
        sortingFn: 'text',
      },
      // Company column
      {
        accessorKey: 'company_name',
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
          const company = row.original.company_name || ''
          return (
            <div className="text-sm text-zinc-900 min-w-[150px] truncate max-w-[200px]">
              {company || <span className="text-zinc-400">-</span>}
            </div>
          )
        },
        sortingFn: 'text',
      },
      // Email column
      {
        accessorKey: 'email',
        id: 'email',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-zinc-900"
          >
            Email
            {column.getIsSorted() && (
              <span className="text-zinc-400">
                {column.getIsSorted() === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const email = row.original.email || ''
          return (
            <div className="min-w-[180px]">
              {email ? (
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <a
                    href={`mailto:${email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate max-w-[200px]"
                  >
                    {email}
                  </a>
                </div>
              ) : (
                <span className="text-sm text-zinc-400">-</span>
              )}
            </div>
          )
        },
        sortingFn: 'text',
      },
      // Intent Topic column
      {
        accessorKey: 'intent_topic',
        id: 'intent_topic',
        header: 'Topic',
        cell: ({ row }) => {
          const topic = row.original.intent_topic || ''
          if (!topic) {
            return <span className="text-sm text-zinc-400">-</span>
          }
          return (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 truncate max-w-[150px]">
              {topic}
            </span>
          )
        },
        enableSorting: false,
      },
      // Location column (state code)
      {
        accessorKey: 'state_code',
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const stateCode = row.original.state_code || row.original.state || ''
          const city = row.original.city || ''
          const location = city ? `${city}, ${stateCode}` : stateCode
          return (
            <div className="text-sm text-zinc-600 min-w-[80px]">
              {location || <span className="text-zinc-400">-</span>}
            </div>
          )
        },
        enableSorting: false,
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
            Added
            {column.getIsSorted() && (
              <span className="text-zinc-400">
                {column.getIsSorted() === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-sm text-zinc-600">
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
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
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

  const { mutateAsync: doDelete } = deleteMutation
  const handleBulkDelete = useCallback(async () => {
    if (
      selectedLeadIds.length === 0 ||
      !confirm(`Delete ${selectedLeadIds.length} lead(s)?`)
    ) {
      return
    }
    await doDelete(selectedLeadIds)
  }, [selectedLeadIds, doDelete])

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
        <LeadsTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          onRefresh={() => { refetch() }}
          selectedCount={0}
          selectedLeadIds={[]}
          onBulkDelete={handleBulkDelete}
          isDeleting={false}
        />
        <ErrorDisplay
          error={error as Error}
          retry={() => { refetch() }}
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
        onRefresh={() => { refetch() }}
        selectedCount={selectedLeadIds.length}
        selectedLeadIds={selectedLeadIds}
        onBulkDelete={handleBulkDelete}
        isDeleting={deleteMutation.isPending}
      />

      {/* Results count */}
      <div className="text-sm text-zinc-500">
        Showing {data?.data?.length || 0} leads (of {data?.pagination?.total || 0} matching)
      </div>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden">
        {table.getRowModel().rows.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm px-6 py-12 text-center text-sm text-zinc-500">
            No leads found
          </div>
        ) : (
          <LeadMobileCardList
            leads={table.getRowModel().rows.map((row) => row.original)}
            onLeadClick={(lead) => setSelectedLead(lead)}
          />
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block rounded-lg border border-zinc-200 bg-white shadow-sm">
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
                    className="px-6 py-12 text-center text-sm text-zinc-500"
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
                      row.getIsSelected() ? 'bg-blue-50' : 'hover:bg-zinc-50'
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
            <span className="text-sm text-zinc-700">
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
              className="rounded-md border-zinc-300 text-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="rounded-md border border-zinc-300 bg-white px-3 py-2.5 min-h-[44px] text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2.5 min-h-[44px] text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-zinc-700 flex items-center">
              Page {pagination.pageIndex + 1} of {data?.pagination?.total_pages || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2.5 min-h-[44px] text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2.5 min-h-[44px] text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
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
          onRefresh={() => { refetch() }}
        />
      )}
    </div>
  )
}
