'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'

function OnboardingSuccessContent() {
  const searchParams = useSearchParams()
  const companyName = searchParams.get('company') ?? 'there'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="mx-auto max-w-lg text-center">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Image
            src="/cursive-logo.png"
            alt="Cursive"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>

        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-green-600">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold tracking-tight text-[#0F172A]"
        >
          Thank you, {companyName}!
        </motion.h1>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 space-y-4"
        >
          <p className="text-lg text-muted-foreground">
            Your onboarding is complete. Our team will begin setup within 24-48 hours.
          </p>

          <p className="text-sm text-muted-foreground">
            You will receive a confirmation email shortly with a summary of your selections.
          </p>

          <div className="mt-8 rounded-xl border border-border bg-slate-50 p-6">
            <h3 className="font-semibold text-[#0F172A]">What happens next?</h3>
            <ol className="mt-3 space-y-2 text-left text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">1</span>
                <span>We review your ICP and brand assets within 24 hours</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">2</span>
                <span>Our team configures your campaigns, domains, and audiences</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">3</span>
                <span>You receive email drafts for approval before anything goes live</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">4</span>
                <span>Campaigns launch and leads start flowing into your pipeline</span>
              </li>
            </ol>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          Questions? Reach out to{' '}
          <a href="mailto:hello@meetcursive.com" className="font-medium text-blue-600 hover:text-blue-700">
            hello@meetcursive.com
          </a>
        </motion.p>
      </div>
    </div>
  )
}

export default function OnboardingSuccessPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    }>
      <OnboardingSuccessContent />
    </React.Suspense>
  )
}
