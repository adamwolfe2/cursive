// Leads Data Table Component
// Main table component using TanStack Table

'use client'

import { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { createLeadsTableColumns, type WorkspaceUser } from './LeadsTableColumns'
import { PaginationControls } from './PaginationControls'
import { LeadMobileCard } from './LeadMobileCard'
import { useCRMStore } from '@/lib/crm/crm-state'
import type { LeadTableRow } from '@/types/crm.types'
import { cn } from '@/lib/utils'

export interface LeadsDataTableProps {
  data: LeadTableRow[]
  totalCount: number
  pageCount: number
  availableUsers?: WorkspaceUser[]
  commonTags?: string[]
}

export function LeadsDataTable({
  data,
  totalCount,
  pageCount,
  availableUsers = [],
  commonTags = [],
}: LeadsDataTableProps) {
  const {
    selectedLeadIds,
    setSelectedLeads,
    columnVisibility: storedColumnVisibility,
    setColumnVisibility: setStoredColumnVisibility,
    density,
    filters,
  } = useCRMStore()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Convert stored column visibility to TanStack format
  const columnVisibility: VisibilityState = useMemo(() => {
    const visibility: VisibilityState = {}
    Object.entries(storedColumnVisibility).forEach(([key, value]) => {
      visibility[key] = value
    })
    return visibility
  }, [storedColumnVisibility])

  // Convert selected IDs to row selection state
  const rowSelection: RowSelectionState = useMemo(() => {
    const selection: RowSelectionState = {}
    data.forEach((row, index) => {
      if (selectedLeadIds.includes(row.id)) {
        selection[index.toString()] = true
      }
    })
    return selection
  }, [selectedLeadIds, data])

  const table = useReactTable({
    data,
    columns: createLeadsTableColumns(availableUsers, commonTags),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === 'function' ? updater(columnVisibility) : updater
      setStoredColumnVisibility(newVisibility as Record<string, boolean>)
    },
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater

      // Convert row selection back to lead IDs
      const selectedIds = Object.keys(newSelection)
        .filter((key) => newSelection[key])
        .map((index) => data[parseInt(index)]?.id)
        .filter(Boolean)

      setSelectedLeads(selectedIds)
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount,
  })

  // Row height based on density (Twenty-style: more compact)
  const rowHeightClass = density === 'compact' ? 'h-8' : 'h-10'

  return (
    <div className="w-full space-y-4" role="region" aria-label="Leads table">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No leads found
          </div>
        ) : (
          data.map((lead, index) => (
            <LeadMobileCard
              key={lead.id}
              lead={lead}
              selected={selectedLeadIds.includes(lead.id)}
              onSelect={(checked) => {
                const newSelection = checked
                  ? [...selectedLeadIds, lead.id]
                  : selectedLeadIds.filter(id => id !== lead.id)
                setSelectedLeads(newSelection)
              }}
              onView={() => {
                window.location.href = `/crm/leads/${lead.id}`
              }}
            />
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <ScrollArea className="hidden md:block h-[calc(100vh-240px)] rounded-md border-border/10">
        <Table>
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10" role="rowgroup">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(rowHeightClass, 'cursor-pointer')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <p>No leads found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Pagination controls */}
      <PaginationControls
        currentPage={filters.page}
        pageSize={filters.pageSize}
        totalCount={totalCount}
        pageCount={pageCount}
      />
    </div>
  )
}
