'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Wraps page content with fade transition animation
 * Use this at the layout or page level for smooth page transitions
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const safeAnimation = useSafeAnimation()

  if (!safeAnimation) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.2,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
