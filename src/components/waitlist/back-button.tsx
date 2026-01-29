/**
 * Back Button Component
 * Navigates to previous screen
 */

'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/lib/utils/waitlist-animations'

interface BackButtonProps {
  onClick: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </motion.button>
  )
}
