/**
 * Business VSL Introduction (Screen 2A)
 * Explains the business value proposition
 */

'use client'

import { motion } from 'framer-motion'
import { fadeInVariants, buttonVariants } from '@/lib/utils/waitlist-animations'
import { BackButton } from './back-button'
import { ProgressBar } from './progress-bar'

interface BusinessIntroProps {
  onNext: () => void
  onBack: () => void
}

export function BusinessIntro({ onNext, onBack }: BusinessIntroProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-2xl">
        <BackButton onClick={onBack} />

        <ProgressBar current={1} total={5} label="Step 1 of 5" />

        <motion.div variants={fadeInVariants} className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Cursive Captures Buyers Searching for Your Solution. Delivered Daily.
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            We identify buyers actively searching Google and AI tools for solutions in your industry, verify their
            contact data, and deliver qualified leads to your inbox daily. No hidden fees, no wasted follow-ups,
            unlimited scale.
          </p>

          <motion.button
            onClick={onNext}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-8"
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
