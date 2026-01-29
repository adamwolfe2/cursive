/**
 * Success Screen (Screens 8A/8B)
 * Shows confirmation after successful submission
 */

'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { checkmarkVariants, fadeInVariants, buttonVariants } from '@/lib/utils/waitlist-animations'
import type { UserType } from '@/types/waitlist.types'

interface SuccessScreenProps {
  userType: UserType
  email: string
}

export function SuccessScreen({ userType, email }: SuccessScreenProps) {
  const isBusinessPath = userType === 'business'

  const headline = isBusinessPath ? "You're on the waitlist!" : "You're on the partner waitlist!"

  const subhead = isBusinessPath
    ? `We'll email you at ${email} when your account is ready. You're one of the first 100 businesses to get free qualified leads.`
    : `We'll email you at ${email} with next steps for uploading your lead database. You're one of the first 100 partners earning recurring revenue with Cursive.`

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-2xl text-center">
        {/* Animated Checkmark */}
        <motion.div variants={checkmarkVariants} className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="h-10 w-10 text-success" strokeWidth={3} />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeInVariants} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {headline}
        </motion.h1>

        {/* Subhead */}
        <motion.p variants={fadeInVariants} className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          {subhead}
        </motion.p>

        {/* Optional CTAs */}
        <motion.div variants={fadeInVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.a
            href="https://www.linkedin.com/company/cursive-leads"
            target="_blank"
            rel="noopener noreferrer"
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="inline-flex items-center justify-center h-12 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Follow us on LinkedIn
          </motion.a>

          <motion.a
            href="https://meetcursive.com"
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="inline-flex items-center justify-center h-12 px-6 border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors"
          >
            Back to Homepage
          </motion.a>
        </motion.div>
      </div>
    </motion.div>
  )
}
