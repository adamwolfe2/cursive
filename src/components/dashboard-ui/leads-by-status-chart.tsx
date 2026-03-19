'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Tag,
  MoreHorizontal,
  ArrowDownAZ,
  ArrowDown,
  ArrowUp,
} from 'lucide-react'

type SortBy = 'value_desc' | 'value_asc' | 'name_asc' | 'name_desc'

export interface StatusData {
  name: string
  value: number
  color: string
}

interface LeadsByStatusChartProps {
  data: StatusData[]
  total?: number
  totalChange?: number
  totalChangeValue?: number
  isLoading?: boolean
}

export function LeadsByStatusChart({
  data,
  total,
  totalChange,
  totalChangeValue,
  isLoading = false,
}: LeadsByStatusChartProps) {
  const [sortBy, setSortBy] = useState<SortBy>('value_desc')
  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {}
      data.forEach((item) => {
        initial[item.name] = true
      })
      return initial
    }
  )

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item) => visibleStatuses[item.name])

    switch (sortBy) {
      case 'value_desc':
        filtered = [...filtered].sort((a, b) => b.value - a.value)
        break
      case 'value_asc':
        filtered = [...filtered].sort((a, b) => a.value - b.value)
        break
      case 'name_asc':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name_desc':
        filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name))
        break
    }

    return filtered
  }, [data, sortBy, visibleStatuses])

  const maxValue = useMemo(() => {
    return Math.max(...filteredAndSortedData.map((d) => d.value), 1)
  }, [filteredAndSortedData])

  const visibleTotal = useMemo(() => {
    return filteredAndSortedData.reduce((sum, item) => sum + item.value, 0)
  }, [filteredAndSortedData])

  const toggleStatus = (statusName: string) => {
    setVisibleStatuses((prev) => ({
      ...prev,
      [statusName]: !prev[statusName],
    }))
  }

  const resetToDefault = () => {
    setSortBy('value_desc')
    const newVisibleStatuses: Record<string, boolean> = {}
    data.forEach((item) => {
      newVisibleStatuses[item.name] = true
    })
    setVisibleStatuses(newVisibleStatuses)
  }

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-sm w-full xl:w-[337px] shrink-0">
        <div className="flex flex-row items-center justify-between py-5 px-5">
          <div className="flex items-center gap-2">
            <div className="shimmer-cursive h-8 w-8 rounded" />
            <div className="shimmer-cursive h-5 w-32 rounded" />
          </div>
          <div className="shimmer-cursive h-8 w-8 rounded" />
        </div>
        <div className="px-5 pb-5 space-y-6">
          <div className="shimmer-cursive h-8 w-24 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer-cursive h-4 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-sm w-full xl:w-[337px] shrink-0">
      <div className="flex flex-row items-center justify-between py-5 px-5">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8 border-blue-200">
            <Tag className="size-4 text-blue-600" />
          </Button>
          <h3 className="font-medium text-sm sm:text-base bg-gradient-cursive bg-clip-text text-transparent">
            Leads by Status
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Chart options">
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowDownAZ className="size-4 mr-2" />
                Sort By
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setSortBy('value_desc')}>
                  <ArrowDown className="size-4 mr-2" />
                  Value (High to Low) {sortBy === 'value_desc' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('value_asc')}>
                  <ArrowUp className="size-4 mr-2" />
                  Value (Low to High) {sortBy === 'value_asc' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name_asc')}>
                  <ArrowDownAZ className="size-4 mr-2" />
                  Name (A to Z) {sortBy === 'name_asc' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name_desc')}>
                  <ArrowDownAZ className="size-4 mr-2 rotate-180" />
                  Name (Z to A) {sortBy === 'name_desc' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tag className="size-4 mr-2" />
                Show Statuses
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {data.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.name}
                    checked={visibleStatuses[item.name]}
                    onCheckedChange={() => toggleStatus(item.name)}
                  >
                    <span
                      className="size-2 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetToDefault}>
              Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="px-5 pb-5 space-y-6 sm:space-y-8">
        <div className="flex items-end gap-2">
          <span className="text-2xl sm:text-[28px] font-semibold tracking-tight bg-gradient-cursive bg-clip-text text-transparent">
            {(total || visibleTotal).toLocaleString()}
          </span>
          {totalChange !== undefined && (
            <div className="flex items-center gap-2 text-xs sm:text-sm pb-1">
              <span className="text-emerald-600 font-medium">
                +{totalChange}%
                {totalChangeValue !== undefined && ` (${totalChangeValue})`}
              </span>
              <span className="text-muted-foreground hidden sm:inline">
                vs Last Month
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          {filteredAndSortedData.map((item) => (
            <div key={item.name} className="flex items-center gap-3 sm:gap-4">
              <span className="text-xs text-muted-foreground w-16 sm:w-[62px] shrink-0 truncate">
                {item.name}
              </span>
              <div className="flex-1 h-[15px] bg-blue-50 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-300"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="text-xs font-semibold w-10 sm:w-[30px] text-right shrink-0">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
