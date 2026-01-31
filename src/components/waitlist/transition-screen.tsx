/**
 * Transition Screen (Reusable for 6A/6B)
 * Shows transition message and auto-advances
 */

'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { staggerContainerVariants, headingVariants, staggerItemVariants, logoVariants } from '@/lib/utils/waitlist-animations'
import { BackButton } from './back-button'
import { ProgressBar } from './progress-bar'

interface TransitionScreenProps {
  message: string
  onNext: () => void
  onBack: () => void
  autoAdvanceDelay?: number
}

export function TransitionScreen({ message, onNext, onBack, autoAdvanceDelay = 1500 }: TransitionScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext()
    }, autoAdvanceDelay)

    return () => clearTimeout(timer)
  }, [onNext, autoAdvanceDelay])

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-2xl">
        <BackButton onClick={onBack} />

        <ProgressBar current={4} total={5} label="Step 4 of 5" />

        <motion.div variants={staggerContainerVariants} className="space-y-8">
          {/* Large Centered Logo */}
          <motion.div variants={logoVariants} className="flex justify-center">
            <Link href="https://meetcursive.com" className="hover:opacity-80 transition-opacity">
              <Image
                src="/cursive-logo.png"
                alt="Cursive"
                width={120}
                height={120}
                className="w-24 h-24 md:w-28 md:h-28"
              />
            </Link>
          </motion.div>

          <motion.h1 variants={headingVariants} className="text-3xl md:text-4xl font-bold text-foreground text-center">
            {message}
          </motion.h1>

          <motion.div variants={staggerItemVariants} className="flex justify-center">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
