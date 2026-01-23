'use client'

import { useState } from 'react'
import type { Table } from '@tanstack/react-table'

interface LeadsTableToolbarProps {
  table: Table<any>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  onRefresh: () => void
}

export function LeadsTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  onRefresh,
}: LeadsTableToolbarProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Get current filters
      const filters: any = {}
      table.getState().columnFilters.forEach((filter) => {
        filters[filter.id] = filter.value
      })

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

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Search */}
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search companies..."
          className="block w-full max-w-sm rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />

        {/* Intent Score Filter */}
        <select
          value={
            (table.getColumn('intent_data.score')?.getFilterValue() as string) ||
            ''
          }
          onChange={(e) =>
            table
              .getColumn('intent_data.score')
              ?.setFilterValue(e.target.value || undefined)
          }
          className="block rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Intent Scores</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">⚡ Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>

        {/* Enrichment Status Filter */}
        <select
          value={
            (table
              .getColumn('enrichment_status')
              ?.getFilterValue() as string) || ''
          }
          onChange={(e) =>
            table
              .getColumn('enrichment_status')
              ?.setFilterValue(e.target.value || undefined)
          }
          className="block rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        {/* Clear Filters */}
        {(table.getState().columnFilters.length > 0 || globalFilter) && (
          <button
            onClick={() => {
              table.resetColumnFilters()
              setGlobalFilter('')
            }}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onRefresh}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="-ml-1 mr-2 h-4 w-4"
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
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
    </div>
  )
}
