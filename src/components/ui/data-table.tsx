'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Button } from './button'
import { Input } from './input'
import { Skeleton } from './skeleton'
import { EmptyState } from './empty-state'

// ============================================
// TABLE COMPONENTS
// ============================================

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('border-b border-border bg-muted/50', className)}
      {...props}
    />
  )
)
TableHeader.displayName = 'TableHeader'

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
)
TableBody.displayName = 'TableBody'

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('border-t border-border bg-muted/50 font-medium', className)}
      {...props}
    />
  )
)
TableFooter.displayName = 'TableFooter'

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        selected && 'bg-muted',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sorted?: 'asc' | 'desc' | false
  onSort?: () => void
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortable, sorted, onSort, ...props }, ref) => {
    const sortLabel = sorted === 'asc' ? 'sorted ascending' : sorted === 'desc' ? 'sorted descending' : 'not sorted'

    return (
      <th
        ref={ref}
        className={cn(
          'h-11 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
          sortable && 'cursor-pointer select-none hover:text-foreground',
          className
        )}
        onClick={sortable ? onSort : undefined}
        onKeyDown={sortable ? (e) => e.key === 'Enter' && onSort?.() : undefined}
        tabIndex={sortable ? 0 : undefined}
        role={sortable ? 'columnheader' : undefined}
        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : sortable ? 'none' : undefined}
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          {sortable && (
            <>
              <svg
                className={cn(
                  'h-4 w-4 transition-transform',
                  sorted === 'asc' && 'rotate-180',
                  !sorted && 'opacity-30'
                )}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="sr-only">{sortLabel}</span>
            </>
          )}
        </div>
      </th>
    )
  }
)
TableHead.displayName = 'TableHead'

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
)
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

// ============================================
// DATA TABLE WRAPPER
// ============================================

interface Column<T> {
  id: string
  header: React.ReactNode
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  loadingRows?: number
  emptyState?: {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: { label: string; onClick?: () => void; href?: string }
  }
  onRowClick?: (row: T) => void
  selectedRows?: Set<string | number>
  onSelectRow?: (id: string | number, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  className?: string
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  loading,
  loadingRows = 5,
  emptyState,
  onRowClick,
  selectedRows,
  onSelectRow,
  onSelectAll,
  className,
}: DataTableProps<T>) {
  const selectable = !!onSelectRow

  if (loading) {
    return (
      <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.id} className={column.className}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: loadingRows }).map((_, i) => (
              <TableRow key={i}>
                {selectable && (
                  <TableCell className="w-12">
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', className)}>
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      </div>
    )
  }

  const allSelected = selectedRows && data.length > 0 && data.every((row) => selectedRows.has(row[keyField] as string | number))

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={column.className}
                sortable={column.sortable}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const rowKey = row[keyField] as string | number
            const isSelected = selectedRows?.has(rowKey)

            return (
              <TableRow
                key={rowKey}
                selected={isSelected}
                className={onRowClick ? 'cursor-pointer' : undefined}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <TableCell
                    className="w-12"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectRow?.(rowKey, e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      aria-label={`Select row ${rowKey}`}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell
                      ? column.cell(row)
                      : column.accessorKey
                        ? (row[column.accessorKey] as React.ReactNode)
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// ============================================
// TABLE TOOLBAR
// ============================================

interface TableToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  actions?: React.ReactNode
  selectedCount?: number
  bulkActions?: React.ReactNode
  className?: string
}

function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  selectedCount = 0,
  bulkActions,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-4', className)}>
      <div className="flex flex-1 items-center gap-4">
        {onSearchChange && (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        )}
        {filters}
        {selectedCount > 0 && bulkActions && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
            <span className="text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
            {bulkActions}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ============================================
// PAGINATION
// ============================================

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
  className?: string
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className,
}: PaginationProps) {
  const pages = React.useMemo(() => {
    const items: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          items.push(i)
        }
        items.push('ellipsis')
        items.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        items.push(1)
        items.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push(i)
        }
      } else {
        items.push(1)
        items.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(i)
        }
        items.push('ellipsis')
        items.push(totalPages)
      }
    }

    return items
  }, [currentPage, totalPages])

  const startItem = totalItems ? (currentPage - 1) * (itemsPerPage || 10) + 1 : undefined
  const endItem = totalItems
    ? Math.min(currentPage * (itemsPerPage || 10), totalItems)
    : undefined

  return (
    <nav
      className={cn('flex items-center justify-between py-4', className)}
      aria-label="Pagination"
      role="navigation"
    >
      <div className="text-sm text-muted-foreground" aria-live="polite">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined && (
          <>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </>
        )}
      </div>
      <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" aria-hidden="true">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </nav>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  DataTable,
  TableToolbar,
  Pagination,
}
