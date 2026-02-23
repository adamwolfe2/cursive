/**
 * Onboarding Success Screen
 * Shows account creation confirmation and redirects to dashboard
 * Includes resend confirmation email with cooldown and auto-detect confirmation
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  checkmarkVariants,
  staggerContainerVariants,
  headingVariants,
  textRevealVariants,
  staggerItemVariants,
} from '@/lib/utils/waitlist-animations'
import type { UserType } from '@/types/waitlist.types'

const MAX_RESENDS = 3
const COOLDOWN_SECONDS = 60
const POLL_INTERVAL_MS = 5000
const MAX_POLL_CHECKS = 120

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

  // Resend state
  const [resendCount, setResendCount] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // Confirmation polling state
  const [confirmed, setConfirmed] = useState(false)
  const [pollExpired, setPollExpired] = useState(false)

  // Redirect when no confirmation needed
  useEffect(() => {
    if (!needsConfirmation) {
      const timer = setTimeout(() => {
        router.push(isMarketplace ? '/marketplace' : '/dashboard')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [needsConfirmation, isMarketplace, router])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Poll for email confirmation
  useEffect(() => {
    if (!needsConfirmation || confirmed) return
    const supabase = createClient()
    let checks = 0
    const interval = setInterval(async () => {
      checks++
      if (checks > MAX_POLL_CHECKS) {
        clearInterval(interval)
        setPollExpired(true)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setConfirmed(true)
        clearInterval(interval)
        setTimeout(() => {
          router.push(isMarketplace ? '/marketplace' : '/dashboard')
        }, 2000)
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [needsConfirmation, confirmed, isMarketplace, router])

  // Resend handler
  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resendCount >= MAX_RESENDS || resendStatus === 'sending') return
    setResendStatus('sending')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setResendStatus('error')
      setTimeout(() => setResendStatus('idle'), 3000)
    } else {
      setResendStatus('sent')
      setResendCount((c) => c + 1)
      setCooldown(COOLDOWN_SECONDS)
      setTimeout(() => setResendStatus('idle'), 3000)
    }
  }, [cooldown, resendCount, resendStatus, email])

  // Confirmed state
  if (confirmed) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
      >
        <motion.div variants={staggerContainerVariants} className="w-full max-w-2xl text-center">
          <motion.div
            variants={checkmarkVariants}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-10 w-10 text-success" strokeWidth={3} />
            </div>
          </motion.div>

          <motion.h1
            variants={headingVariants}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Email Confirmed!
          </motion.h1>

          <motion.p
            variants={textRevealVariants}
            className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed"
          >
            {isBusinessPath
              ? 'Your account is ready. Redirecting you to your dashboard...'
              : 'Your partner account is ready. Redirecting you to your dashboard...'}
          </motion.p>

          <motion.div variants={staggerItemVariants} className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

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
        {/* Animated mail icon for confirmation state, checkmark for immediate success */}
        <motion.div variants={checkmarkVariants} className="flex justify-center mb-8">
          {needsConfirmation ? (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Mail className="h-10 w-10 text-primary" strokeWidth={2} />
              </motion.div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-10 w-10 text-success" strokeWidth={3} />
            </div>
          )}
        </motion.div>

        <motion.h1 variants={headingVariants} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {headline}
        </motion.h1>

        <motion.p variants={textRevealVariants} className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          {subhead}
        </motion.p>

        {needsConfirmation && (
          <motion.div variants={staggerItemVariants} className="space-y-6">
            {/* Step-by-step instructions */}
            <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>
                <span>Open your email inbox</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>
                <span>Click the confirmation link</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">3</span>
                <span>You&apos;ll be redirected automatically</span>
              </div>
            </div>

            {/* Resend button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={cooldown > 0 || resendCount >= MAX_RESENDS || resendStatus === 'sending'}
                loading={resendStatus === 'sending'}
                leftIcon={resendStatus !== 'sending' ? <RefreshCw className="h-3.5 w-3.5" /> : undefined}
              >
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : resendCount >= MAX_RESENDS
                    ? 'Max resends reached'
                    : 'Resend confirmation email'}
              </Button>

              {/* Inline status messages */}
              <AnimatePresence mode="wait">
                {resendStatus === 'sent' && (
                  <motion.p
                    key="sent"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="text-sm text-success"
                  >
                    Confirmation email resent!
                  </motion.p>
                )}
                {resendStatus === 'error' && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="text-sm text-destructive"
                  >
                    Failed to resend. Please try again.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Spam folder tip */}
            <p className="text-xs text-muted-foreground/70">
              Don&apos;t see it? Check your spam or junk folder, or{' '}
              <a href="mailto:hello@meetcursive.com" className="text-primary hover:underline">
                contact support
              </a>
            </p>

            {/* Poll expired guidance */}
            {pollExpired && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                <strong>Still waiting?</strong> If you&apos;ve confirmed your email, try{' '}
                <a href="/login" className="font-medium underline hover:text-amber-900">
                  signing in
                </a>{' '}
                directly, or{' '}
                <a href="mailto:hello@meetcursive.com" className="font-medium underline hover:text-amber-900">
                  contact support
                </a>{' '}
                if you need help.
              </motion.div>
            )}
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
