/**
 * Onboarding Success Screen
 * Shows account creation confirmation and redirects to dashboard
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import {
  checkmarkVariants,
  staggerContainerVariants,
  headingVariants,
  textRevealVariants,
  staggerItemVariants,
} from '@/lib/utils/waitlist-animations'
import type { UserType } from '@/types/waitlist.types'

interface OnboardingSuccessProps {
  userType: UserType
  email: string
  isMarketplace: boolean
}

export function OnboardingSuccess({ userType, email, isMarketplace }: OnboardingSuccessProps) {
  const router = useRouter()
  const isBusinessPath = userType === 'business'

  // Check if email confirmation is needed (no auto-session means confirmation required)
  const needsConfirmation = !!email

  useEffect(() => {
    if (!needsConfirmation) {
      // If session was created immediately, redirect after brief pause
      const timer = setTimeout(() => {
        router.push(isMarketplace ? '/marketplace' : '/dashboard')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [needsConfirmation, isMarketplace, router])

  const headline = needsConfirmation
    ? 'Check Your Email'
    : 'Welcome to Cursive!'

  const subhead = needsConfirmation
    ? `We've sent a confirmation link to ${email}. Click the link to activate your account and start getting leads.`
    : isBusinessPath
      ? 'Your account is ready. Redirecting you to your dashboard...'
      : 'Your partner account is ready. Redirecting you to your dashboard...'

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
    >
      <motion.div variants={staggerContainerVariants} className="w-full max-w-2xl text-center">
        <motion.div variants={checkmarkVariants} className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="h-10 w-10 text-success" strokeWidth={3} />
          </div>
        </motion.div>

        <motion.h1 variants={headingVariants} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {headline}
        </motion.h1>

        <motion.p variants={textRevealVariants} className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          {subhead}
        </motion.p>

        {needsConfirmation && (
          <motion.div variants={staggerItemVariants} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{' '}
              <a href="mailto:hey@meetcursive.com" className="text-primary hover:underline">
                contact support
              </a>
            </p>
          </motion.div>
        )}

        {!needsConfirmation && (
          <motion.div variants={staggerItemVariants} className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
