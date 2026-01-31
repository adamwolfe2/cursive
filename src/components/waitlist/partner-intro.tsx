/**
 * Partner VSL Introduction (Screen 2B)
 * Explains the partner value proposition
 */

'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  staggerContainerVariants,
  headingVariants,
  textRevealVariants,
  staggerItemVariants,
  buttonVariants,
  logoVariants,
} from '@/lib/utils/waitlist-animations'
import { BackButton } from './back-button'
import { ProgressBar } from './progress-bar'

interface PartnerIntroProps {
  onNext: () => void
  onBack: () => void
}

export function PartnerIntro({ onNext, onBack }: PartnerIntroProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-2xl">
        <BackButton onClick={onBack} />

        <ProgressBar current={1} total={5} label="Step 1 of 5" />

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
            Get Paid Every Time Your Leads Convert. Forever.
          </motion.h1>

          <motion.p variants={textRevealVariants} className="text-lg text-muted-foreground leading-relaxed text-center">
            Your enriched databases + our routing engine = ongoing revenue share. We route your verified leads to
            matched businesses and track every conversion back to you - with full transparency and attribution locked to
            your account.
          </motion.p>

          <motion.button
            onClick={onNext}
            variants={staggerItemVariants}
            whileHover="hover"
            whileTap="tap"
            custom={buttonVariants}
            className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
