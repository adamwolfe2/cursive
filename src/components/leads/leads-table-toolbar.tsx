'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Table } from '@tanstack/react-table'
import { debounce } from '@/lib/utils'

interface LeadsTableToolbarProps {
  table: Table<any>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  onRefresh: () => void
  selectedCount: number
  onBulkDelete: () => void
  isDeleting: boolean
}

export function LeadsTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  onRefresh,
  selectedCount,
  onBulkDelete,
  isDeleting,
}: LeadsTableToolbarProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [searchValue, setSearchValue] = useState(globalFilter)
  const [showColumnPicker, setShowColumnPicker] = useState(false)

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
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export leads')
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
                    Delete Selected
                  </>
                )}
              </button>
              <button
                onClick={() => table.resetRowSelection()}
                className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
              >
                Clear selection
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
