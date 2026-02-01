'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KanbanColumn<T> {
  id: string
  title: string
  color?: string
  count?: number
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[]
  data: Record<string, T[]>
  renderCard: (item: T) => ReactNode
  onCardClick?: (item: T) => void
  onAddCard?: (columnId: string) => void
  loading?: boolean
  className?: string
}

/**
 * Kanban board component
 * Inspired by Twenty CRM's RecordBoard
 * Note: Drag-and-drop will be added in Phase 3
 */
export function KanbanBoard<T extends { id: string }>({
  columns,
  data,
  renderCard,
  onCardClick,
  onAddCard,
  loading = false,
  className,
}: KanbanBoardProps<T>) {
  if (loading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto p-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="h-full w-80 flex-shrink-0 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex h-full gap-4 overflow-x-auto p-6', className)}>
      {columns.map((column) => {
        const columnData = data[column.id] || []

        return (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-full w-80 flex-shrink-0 flex-col rounded-xl bg-white/60 backdrop-blur-sm shadow-sm ring-1 ring-zinc-200/50"
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-zinc-200/60 bg-white/40 px-4 py-3 rounded-t-xl">
              <div className="flex items-center gap-2.5">
                {column.color && (
                  <div
                    className="h-2.5 w-2.5 rounded-full shadow-sm"
                    style={{
                      backgroundColor: column.color,
                      boxShadow: `0 0 8px ${column.color}40`
                    }}
                  />
                )}
                <h3 className="font-semibold text-zinc-900 text-sm tracking-tight">{column.title}</h3>
                {column.count !== undefined && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200/50">
                    {column.count}
                  </span>
                )}
              </div>

              {/* Add card button */}
              {onAddCard && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-7 w-7 rounded-lg hover:bg-zinc-100 transition-colors flex items-center justify-center text-zinc-600 hover:text-zinc-900"
                  onClick={() => onAddCard(column.id)}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {columnData.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onCardClick?.(item)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={cn(
                    'rounded-lg border border-zinc-200/60 bg-white/90 backdrop-blur-sm p-3 shadow-sm transition-all hover:shadow-lg hover:ring-1 hover:ring-blue-200/50',
                    onCardClick && 'cursor-pointer hover:border-blue-300/60'
                  )}
                >
                  {renderCard(item)}
                </motion.div>
              ))}

              {/* Empty state */}
              {columnData.length === 0 && (
                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-zinc-200/60 text-sm text-zinc-400 bg-zinc-50/30">
                  No items
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
