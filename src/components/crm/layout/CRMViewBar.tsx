'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LayoutGrid, LayoutList, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ViewType = 'table' | 'board' | 'calendar'

interface CRMViewBarProps {
  title: string
  icon?: ReactNode
  viewType: ViewType
  onViewTypeChange: (type: ViewType) => void
  filterButton?: ReactNode
  sortButton?: ReactNode
  actions?: ReactNode
  showViewSwitcher?: boolean
}

/**
 * Top bar for CRM pages with view switching, filters, and actions
 * Inspired by Twenty CRM's ViewBar component
 */
export function CRMViewBar({
  title,
  icon,
  viewType,
  onViewTypeChange,
  filterButton,
  sortButton,
  actions,
  showViewSwitcher = true,
}: CRMViewBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex h-16 items-center justify-between border-b border-zinc-200/60 bg-white/80 backdrop-blur-md px-6 shadow-sm"
    >
      {/* Left: Title and icon */}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 shadow-sm">
            {icon}
          </div>
        )}
        <h1 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h1>
      </div>

      {/* Right: View switcher, filters, sort, actions */}
      <div className="flex items-center gap-2">
        {/* View type switcher */}
        {showViewSwitcher && (
          <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200/60 bg-zinc-50/50 p-0.5 shadow-sm backdrop-blur-sm">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex h-8 items-center justify-center rounded-md px-3 text-zinc-600 transition-all duration-200',
                viewType === 'table' &&
                  'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200/50'
              )}
              onClick={() => onViewTypeChange('table')}
            >
              <LayoutList className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex h-8 items-center justify-center rounded-md px-3 text-zinc-600 transition-all duration-200',
                viewType === 'board' &&
                  'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200/50'
              )}
              onClick={() => onViewTypeChange('board')}
            >
              <LayoutGrid className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex h-8 items-center justify-center rounded-md px-3 text-zinc-400 transition-all duration-200 cursor-not-allowed opacity-50'
              )}
              disabled
            >
              <Calendar className="h-4 w-4" />
            </motion.button>
          </div>
        )}

        {/* Filter button */}
        {filterButton}

        {/* Sort button */}
        {sortButton}

        {/* Custom actions */}
        {actions}
      </div>
    </motion.div>
  )
}
