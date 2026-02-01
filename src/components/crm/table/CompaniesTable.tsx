'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Filter, ArrowUpDown, Settings2, ChevronDown, ExternalLink, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Company } from '@/types/crm.types'
import { formatDistanceToNow } from 'date-fns'

interface CompaniesTableProps {
  data: Company[]
  onRowClick?: (company: Company) => void
}

/**
 * Twenty.com style Companies Table
 * Clean, minimal design matching People view
 */
export function CompaniesTable({ data, onRowClick }: CompaniesTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [allSelected, setAllSelected] = useState(false)

  const toggleAllRows = () => {
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map((company) => company.id)))
    }
    setAllSelected(!allSelected)
  }

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRows(newSelection)
    setAllSelected(newSelection.size === data.length && data.length > 0)
  }

  // Get company favicon
  const getCompanyFavicon = (url: string | null) => {
    if (!url) return null
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  // Generate consistent color for company logo based on name
  const getLogoColor = (name: string | null) => {
    if (!name) return 'bg-gray-200 text-gray-600'
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Calculate statistics for bottom bar
  const totalWebsites = data.filter((c) => c.website).length
  const emptyIndustries = data.filter((c) => !c.industry).length
  const emptyIndustryPercentage = data.length > 0 ? Math.round((emptyIndustries / data.length) * 100) : 0

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* View Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-sm font-normal text-gray-700 hover:bg-gray-100"
              >
                All Companies
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem>All Companies</DropdownMenuItem>
              <DropdownMenuItem>Active</DropdownMenuItem>
              <DropdownMenuItem>Prospects</DropdownMenuItem>
              <DropdownMenuItem>Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Row count badge */}
          <span className="flex h-5 items-center rounded-md bg-gray-100 px-1.5 text-xs font-medium text-gray-600">
            {data.length}
          </span>
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Options
          </Button>

          {/* Separator */}
          <div className="mx-1 h-4 w-px bg-gray-300" />

          {/* New record button */}
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-gray-900 px-2.5 text-sm font-normal hover:bg-gray-800"
          >
            <Plus className="h-3.5 w-3.5" />
            New company
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="border-b border-gray-200">
              {/* Checkbox column */}
              <th className="w-12 px-3 py-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAllRows}
                  className="border-gray-300"
                />
              </th>

              {/* Name */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Name
              </th>

              {/* Domain */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Domain
              </th>

              {/* Industry */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Industry
              </th>

              {/* Employees */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Employees
              </th>

              {/* Revenue */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Revenue
              </th>

              {/* Created */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Created
              </th>

              {/* Actions column */}
              <th className="w-8 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-gray-500">No companies yet</p>
                    <p className="text-xs text-gray-400">
                      Add companies from your leads or import them
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((company) => {
                const isSelected = selectedRows.has(company.id)
                const faviconUrl = getCompanyFavicon(company.website)
                const initials = company.name?.substring(0, 2).toUpperCase() || '??'
                const logoColor = getLogoColor(company.name)

                return (
                  <tr
                    key={company.id}
                    onClick={() => onRowClick?.(company)}
                    className={cn(
                      'group cursor-pointer transition-colors hover:bg-gray-50',
                      isSelected && 'bg-blue-50/30'
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(company.id, { stopPropagation: () => {} } as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-gray-300"
                      />
                    </td>

                    {/* Name with logo */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {faviconUrl ? (
                          <img
                            src={faviconUrl}
                            alt=""
                            className="h-6 w-6 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className={cn(
                            "flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white",
                            logoColor
                          )}>
                            {initials}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {company.name}
                        </span>
                      </div>
                    </td>

                    {/* Domain */}
                    <td className="px-3 py-2.5">
                      {company.website ? (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Industry */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {company.industry || '-'}
                      </span>
                    </td>

                    {/* Employees */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {company.employees_range || '-'}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {company.revenue_range || '-'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}
                      </span>
                    </td>

                    {/* Actions - shown on hover */}
                    <td className="px-3 py-2.5">
                      <div className="opacity-0 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronDown className="h-4 w-4 rotate-90" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom statistics bar */}
      {data.length > 0 && (
        <div className="flex items-center gap-6 border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-700">With Website</span>
            <span className="font-semibold text-gray-900">{totalWebsites}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-700">Empty Industry</span>
            <span className="font-semibold text-gray-900">{emptyIndustryPercentage}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
