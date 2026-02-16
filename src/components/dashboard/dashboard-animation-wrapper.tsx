'use client'

import { motion } from 'framer-motion'
import { SLIDE_UP, STAGGER_CHILDREN } from '@/lib/animations'

interface DashboardAnimationWrapperProps {
  children: React.ReactNode
}

export function DashboardAnimationWrapper({ children }: DashboardAnimationWrapperProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: STAGGER_CHILDREN,
        },
      }}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedSectionProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function AnimatedSection({ children, delay = 0, className }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedCardProps {
  children: React.ReactNode
  delay?: number
  href?: string
  onClick?: () => void
}

export function AnimatedCard({ children, delay = 0, href, onClick }: AnimatedCardProps) {
  const MotionWrapper = href ? motion.a : motion.div

  return (
    <MotionWrapper
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.3,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...(href ? { href } : {})}
      {...(onClick ? { onClick } : {})}
      style={{ display: 'block' }}
    >
      {children}
    </MotionWrapper>
  )
}
