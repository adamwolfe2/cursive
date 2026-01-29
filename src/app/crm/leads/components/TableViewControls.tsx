// Table View Controls
// Column visibility and table density controls

'use client'

import { Settings2, Columns3, Rows3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { useCRMStore } from '@/lib/crm/crm-state'
import type { TableDensity } from '@/types/crm.types'

const COLUMN_LABELS: Record<string, string> = {
  select: 'Select',
  status: 'Status',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  company_name: 'Company',
  job_title: 'Job Title',
  company_industry: 'Industry',
  state: 'State',
  company_size: 'Company Size',
  intent_score_calculated: 'Intent Score',
  freshness_score: 'Freshness',
  marketplace_price: 'Price',
  assigned_user: 'Owner',
  tags: 'Tags',
  created_at: 'Created',
  actions: 'Actions',
}

export function TableViewControls() {
  const { columnVisibility, setColumnVisibility, density, setDensity } = useCRMStore()

  const toggleColumn = (columnId: string) => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId],
    })
  }

  const handleDensityChange = (newDensity: TableDensity) => {
    setDensity(newDensity)
  }

  const visibleCount = Object.values(columnVisibility).filter(Boolean).length

  return (
    <div className="flex items-center gap-2">
      {/* Column visibility */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Columns3 className="h-4 w-4" />
            Columns
            {visibleCount > 0 && (
              <span className="ml-1 rounded-sm bg-primary/10 px-1 text-xs font-medium">
                {visibleCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(COLUMN_LABELS).map(([columnId, label]) => {
            // Don't show select and actions in toggle list
            if (columnId === 'select' || columnId === 'actions') return null

            const isVisible = columnVisibility[columnId] !== false

            return (
              <DropdownMenuCheckboxItem
                key={columnId}
                checked={isVisible}
                onCheckedChange={() => toggleColumn(columnId)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Table density */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2" aria-label="Table density">
            <Rows3 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {density === 'comfortable' ? 'Comfortable' : 'Compact'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Table density</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleDensityChange('comfortable')}
            className={density === 'comfortable' ? 'bg-accent' : ''}
          >
            Comfortable
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDensityChange('compact')}
            className={density === 'compact' ? 'bg-accent' : ''}
          >
            Compact
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
