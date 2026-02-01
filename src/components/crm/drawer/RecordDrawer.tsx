'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { animationVariants } from '@/lib/animations/variants'
import { useAnimationProps } from '@/hooks/use-reduced-motion'

interface RecordDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Right drawer for record details
 * Inspired by Twenty CRM's right drawer
 */
export function RecordDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
}: RecordDrawerProps) {
  const overlayAnimation = useAnimationProps(animationVariants.fadeInFast)
  const drawerAnimation = useAnimationProps(animationVariants.drawerSlideRight)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            {...overlayAnimation}
          />

          {/* Drawer */}
          <motion.aside
            className={cn(
              'fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-zinc-200/60 bg-white/95 backdrop-blur-xl shadow-2xl',
              className
            )}
            {...drawerAnimation}
          >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200/60 bg-gradient-to-b from-white/80 to-white/60 px-6 py-5 backdrop-blur-sm">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-8 w-8 rounded-lg hover:bg-zinc-100 transition-colors flex items-center justify-center text-zinc-500 hover:text-zinc-900"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="border-t border-zinc-200/60 bg-white/80 backdrop-blur-sm p-4 shadow-lg">{footer}</div>
        )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
