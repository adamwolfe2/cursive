'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Table } from '@tanstack/react-table'
import { debounce } from '@/lib/utils'
import Link from 'next/link'
import { useToast } from '@/lib/hooks/use-toast'

interface Tag {
  id: string
  name: string
  color: string
  lead_count?: number
}

interface LeadsTableToolbarProps {
  table: Table<any>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  onRefresh: () => void
  selectedCount: number
  selectedLeadIds: string[]
  onBulkDelete: () => void
  isDeleting: boolean
}

export function LeadsTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  onRefresh,
  selectedCount,
  selectedLeadIds,
  onBulkDelete,
  isDeleting,
}: LeadsTableToolbarProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [searchValue, setSearchValue] = useState(globalFilter)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  // Fetch available tags
  const { data: tagsData } = useQuery({
    queryKey: ['lead-tags'],
    queryFn: async () => {
      const res = await fetch('/api/leads/tags')
      if (!res.ok) throw new Error('Failed to fetch tags')
      return res.json()
    },
    staleTime: 60000, // 1 minute
  })

  const tags: Tag[] = tagsData?.tags || []

  // Bulk add tags mutation
  const addTagsMutation = useMutation({
    mutationFn: async (tagIds: string[]) => {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_tags',
          leadIds: selectedLeadIds,
          tagIds,
        }),
      })
      if (!res.ok) throw new Error('Failed to add tags')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-tags'] })
      table.resetRowSelection()
      setShowTagMenu(false)
    },
  })

  // Bulk remove tags mutation
  const removeTagsMutation = useMutation({
    mutationFn: async (tagIds: string[]) => {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_tags',
          leadIds: selectedLeadIds,
          tagIds,
        }),
      })
      if (!res.ok) throw new Error('Failed to remove tags')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-tags'] })
      table.resetRowSelection()
      setShowTagMenu(false)
    },
  })

  // Bulk update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          leadIds: selectedLeadIds,
          status,
        }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      table.resetRowSelection()
      setShowStatusMenu(false)
    },
  })

  const statuses = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
    { value: 'contacted', label: 'Contacted', color: 'bg-amber-100 text-amber-700' },
    { value: 'qualified', label: 'Qualified', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'proposal', label: 'Proposal', color: 'bg-violet-100 text-violet-700' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-700' },
    { value: 'won', label: 'Won', color: 'bg-green-100 text-green-700' },
    { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
  ]

  // Debounced search
  const debouncedSetGlobalFilter = useCallback(
    debounce((value: string) => {
      setGlobalFilter(value)
    }, 300),
    [setGlobalFilter]
  )

  useEffect(() => {
    debouncedSetGlobalFilter(searchValue)
  }, [searchValue, debouncedSetGlobalFilter])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Get current filters
      const filters: any = {}
      table.getState().columnFilters.forEach((filter) => {
        filters[filter.id] = filter.value
      })

      if (globalFilter) {
        filters.search = globalFilter
      }

      const response = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      })

      if (!response.ok) throw new Error('Export failed')

      // Download CSV
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: 'Export successful',
        message: 'Leads exported successfully',
        type: 'success',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        message: 'Failed to export leads. Please try again.',
        type: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const hasActiveFilters =
    table.getState().columnFilters.length > 0 || globalFilter

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-emerald-900">
              {selectedCount} lead{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              {/* Tag Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowTagMenu(!showTagMenu)}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tags
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTagMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTagMenu(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-zinc-200 bg-white shadow-lg">
                      <div className="p-2">
                        <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 uppercase">
                          Add Tags
                        </div>
                        {tags.length === 0 ? (
                          <p className="px-2 py-3 text-sm text-zinc-500">No tags available</p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto">
                            {tags.map((tag) => (
                              <button
                                key={tag.id}
                                onClick={() => addTagsMutation.mutate([tag.id])}
                                disabled={addTagsMutation.isPending}
                                className="w-full flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-50 text-left"
                              >
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tag.color || '#6b7280' }}
                                />
                                <span className="text-[13px] text-zinc-700 flex-1">{tag.name}</span>
                                {tag.lead_count !== undefined && (
                                  <span className="text-xs text-zinc-400">{tag.lead_count}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="border-t border-zinc-100 mt-2 pt-2">
                          <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 uppercase">
                            Remove Tags
                          </div>
                          {tags.length === 0 ? (
                            <p className="px-2 py-3 text-sm text-zinc-500">No tags to remove</p>
                          ) : (
                            <div className="max-h-48 overflow-y-auto">
                              {tags.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => removeTagsMutation.mutate([tag.id])}
                                  disabled={removeTagsMutation.isPending}
                                  className="w-full flex items-center gap-2 rounded px-2 py-1.5 hover:bg-red-50 text-left"
                                >
                                  <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="text-[13px] text-zinc-700">{tag.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Status Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-zinc-200 bg-white shadow-lg">
                      <div className="p-2">
                        <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 uppercase">
                          Set Status
                        </div>
                        {statuses.map((status) => (
                          <button
                            key={status.value}
                            onClick={() => updateStatusMutation.mutate(status.value)}
                            disabled={updateStatusMutation.isPending}
                            className="w-full flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-50 text-left"
                          >
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${status.color}`}>
                              {status.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={onBulkDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </>
                )}
              </button>
              <button
                onClick={() => table.resetRowSelection()}
                className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search companies, domains..."
              className="block w-full rounded-md border-zinc-300 pl-10 pr-4 py-2 text-[13px] shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Intent Filter */}
          <select
            value={
              (table.getColumn('intent')?.getFilterValue() as string) || ''
            }
            onChange={(e) =>
              table.getColumn('intent')?.setFilterValue(e.target.value || undefined)
            }
            className="rounded-md border-zinc-300 px-3 py-2 text-[13px] shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">All Intent</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>

          {/* Status Filter */}
          <select
            value={
              (table.getColumn('status')?.getFilterValue() as string) || ''
            }
            onChange={(e) =>
              table.getColumn('status')?.setFilterValue(e.target.value || undefined)
            }
            className="rounded-md border-zinc-300 px-3 py-2 text-[13px] shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                table.resetColumnFilters()
                setGlobalFilter('')
                setSearchValue('')
              }}
              className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Columns
            </button>

            {showColumnPicker && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowColumnPicker(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-zinc-200 bg-white shadow-lg">
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 uppercase">
                      Toggle Columns
                    </div>
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <label
                          key={column.id}
                          className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-[13px] text-zinc-700 capitalize">
                            {column.id}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
