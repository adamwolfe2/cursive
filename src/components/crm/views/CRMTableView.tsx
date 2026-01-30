'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'

interface Column<T> {
  key: string
  header: string
  width?: string
  render: (item: T) => ReactNode
}

interface CRMTableViewProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  loading?: boolean
  className?: string
}

/**
 * CRM table view component
 * Inspired by Twenty CRM's RecordTable
 */
export function CRMTableView<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  loading = false,
  className,
}: CRMTableViewProps<T>) {
  const shouldAnimate = useSafeAnimation()

  if (loading) {
    return (
      <div className="h-full w-full animate-pulse">
        <div className="h-12 bg-gray-100" />
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-100 bg-white" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('h-full w-full overflow-auto bg-white', className)}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => (
            <motion.tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'transition-colors hover:bg-gray-50',
                onRowClick && 'cursor-pointer'
              )}
              whileHover={shouldAnimate && onRowClick ? { scale: 1.005 } : undefined}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-sm text-gray-900"
                >
                  {column.render(item)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
