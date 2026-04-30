/**
 * Business Signup Form
 * Collects business info + creates account via email or Google OAuth
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  staggerContainerVariants,
  headingVariants,
  textRevealVariants,
  staggerItemVariants,
  logoVariants,
} from '@/lib/utils/waitlist-animations'
import { businessFormSchema, industryOptions, businessQ1Options, type BusinessFormData } from '@/lib/utils/waitlist-validation'
import { BackButton } from '@/components/waitlist/back-button'
import { ProgressBar } from '@/components/waitlist/progress-bar'
import type { VSLAnswers } from '@/types/waitlist.types'

interface BusinessSignupFormProps {
  vslAnswers: VSLAnswers
  onSubmit: (data: BusinessFormData, authMethod: 'email' | 'google', password?: string) => Promise<void>
  onBack: () => void
  error: string | null
  onClearError?: () => void
  isSubmitting?: boolean
  /** True when we are waiting for a Google OAuth redirect */
  oauthPending?: boolean
  /** Pre-fill the email field (from ?email= on post-call recap link) */
  prefilledEmail?: string
  /** Pre-fill the company name (derived from ?domain= on post-call recap link) */
  prefilledCompanyName?: string
}

export function BusinessSignupForm({
  vslAnswers,
  onSubmit,
  onBack,
  error,
  onClearError,
  isSubmitting: parentSubmitting,
  oauthPending,
  prefilledEmail = '',
  prefilledCompanyName = '',
}: BusinessSignupFormProps) {
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const isSubmitting = localSubmitting || !!parentSubmitting
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      monthlyLeadNeed: vslAnswers.q1 || '',
      email: prefilledEmail || '',
      companyName: prefilledCompanyName || '',
    },
  })

  const onEmailSubmit = async (data: BusinessFormData) => {
    setPasswordError(null)

    // Validate password matches server requirements
    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain a lowercase letter')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain an uppercase letter')
      return
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain a number')
      return
    }
    setLocalSubmitting(true)
    try {
      await onSubmit(data, 'email', password)
    } finally {
      setLocalSubmitting(false)
    }
  }

  const onGoogleSubmit = async () => {
    // Trigger form validation first to ensure we have the data
    const isValid = await new Promise<boolean>((resolve) => {
      handleSubmit(
        () => resolve(true),
        () => resolve(false)
      )()
    })

    if (!isValid) return

    setLocalSubmitting(true)
    const data = getValues()
    try {
      await onSubmit(data, 'google')
    } finally {
      // Reset local flag — parent controls isSubmitting during the OAuth redirect window
      setLocalSubmitting(false)
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-2xl">
        <BackButton onClick={onBack} />
        <ProgressBar current={5} total={5} label="Step 5 of 5 - Create Your Account" />

        <motion.div variants={staggerContainerVariants} className="space-y-6">
          <motion.div variants={logoVariants} className="flex justify-center">
            <Link href="https://meetcursive.com" className="hover:opacity-80 transition-opacity">
              <Image src="/cursive-logo.png" alt="Cursive" width={96} height={96} className="w-20 h-20 md:w-24 md:h-24" />
            </Link>
          </motion.div>

          <motion.div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <motion.h2 variants={headingVariants} className="text-2xl font-bold text-foreground mb-2 text-center">
              Create Your Account
            </motion.h2>
            <motion.p variants={textRevealVariants} className="text-sm text-muted-foreground mb-6 text-center">
              Get qualified leads delivered to your inbox daily
            </motion.p>

            {oauthPending && !error && (
              <div className="rounded-lg bg-muted border border-border p-3 mb-4 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Redirecting to Google sign-in&hellip;</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-4">
                <p className="text-sm text-destructive font-medium">{error}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => { onClearError?.(); onGoogleSubmit() }}
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    Try Google again
                  </button>
                  <span className="text-xs text-muted-foreground">or</span>
                  <button
                    type="button"
                    onClick={onClearError}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Continue with email instead
                  </button>
                </div>
              </div>
            )}

            {/* Google OAuth Button */}
            <motion.div variants={staggerItemVariants} className="mb-6">
              <button
                type="button"
                onClick={onGoogleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-input rounded-lg text-sm font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </button>
            </motion.div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or sign up with email</span>
              </div>
            </div>

            <motion.form variants={staggerItemVariants} onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1.5">First name *</label>
                  <input {...register('firstName')} id="firstName" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="John" aria-required="true" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'firstName-error' : undefined} />
                  {errors.firstName && <p id="firstName-error" className="text-xs text-destructive mt-1" role="alert">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1.5">Last name *</label>
                  <input {...register('lastName')} id="lastName" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Smith" aria-required="true" aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'lastName-error' : undefined} />
                  {errors.lastName && <p id="lastName-error" className="text-xs text-destructive mt-1" role="alert">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Work email *</label>
                <input {...register('email')} id="email" type="email" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="john@company.com" aria-required="true" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
                {errors.email && <p id="email-error" className="text-xs text-destructive mt-1" role="alert">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password *</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Min. 8 characters" aria-required="true" aria-invalid={!!passwordError} aria-describedby={passwordError ? 'password-error' : undefined} />
                {passwordError && <p id="password-error" className="text-xs text-destructive mt-1" role="alert">{passwordError}</p>}
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1.5">Company name *</label>
                <input {...register('companyName')} id="companyName" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Your company name" aria-required="true" aria-invalid={!!errors.companyName} aria-describedby={errors.companyName ? 'companyName-error' : undefined} />
                {errors.companyName && <p id="companyName-error" className="text-xs text-destructive mt-1" role="alert">{errors.companyName.message}</p>}
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-foreground mb-1.5">Industry *</label>
                <select
                  {...register('industry')}
                  id="industry"
                  className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  aria-required="true"
                  aria-invalid={!!errors.industry}
                  aria-describedby={errors.industry ? 'industry-error' : undefined}
                  onChange={(e) => {
                    // react-hook-form onChange must still fire
                    register('industry').onChange(e)
                    setShowWaitlist(e.target.value === 'Other (waitlist)')
                  }}
                >
                  <option value="">Select an industry</option>
                  {industryOptions.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {errors.industry && <p id="industry-error" className="text-xs text-destructive mt-1" role="alert">{errors.industry.message}</p>}
                {/* When user picks "Other (waitlist)", show an inline waitlist form
                    instead of creating an empty workspace with no leads. */}
                {showWaitlist && !waitlistDone && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      We&apos;re not live in your industry yet
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Our lead network covers home services, real estate, roofing, HVAC, plumbing, security, contractor, and logistics.
                      We&apos;re expanding — enter your email and we&apos;ll notify you when your industry goes live.
                    </p>
                    <form
                      className="mt-3 flex flex-col gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault()
                        const fd = new FormData(e.currentTarget)
                        const wlEmail = String(fd.get('wl_email') || '').trim()
                        const wlIndustry = String(fd.get('wl_industry') || '').trim()
                        const formValues = getValues()
                        if (!wlEmail) return
                        setWaitlistSubmitting(true)
                        setWaitlistError(null)
                        try {
                          const res = await fetch('/api/waitlist', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: wlEmail,
                              first_name: formValues.firstName || 'Unknown',
                              last_name: formValues.lastName || 'User',
                              industry: wlIndustry || 'Other',
                              source: 'unsupported_industry',
                            }),
                          })
                          if (!res.ok && res.status !== 409) {
                            const body = await res.json().catch(() => ({}))
                            throw new Error(body.error || 'Failed to join waitlist')
                          }
                          setWaitlistDone(true)
                        } catch (err: unknown) {
                          setWaitlistError(err instanceof Error ? err.message : 'Something went wrong')
                        } finally {
                          setWaitlistSubmitting(false)
                        }
                      }}
                    >
                      <input
                        name="wl_email"
                        type="email"
                        required
                        defaultValue={getValues('email') || prefilledEmail}
                        placeholder="your@email.com"
                        className="w-full h-10 px-3 text-sm border border-amber-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        name="wl_industry"
                        type="text"
                        placeholder="Your industry (e.g. SaaS, E-commerce, Healthcare)"
                        className="w-full h-10 px-3 text-sm border border-amber-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      {waitlistError && (
                        <p className="text-xs text-red-600">{waitlistError}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={waitlistSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                          {waitlistSubmitting ? 'Joining...' : 'Notify me when live'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowWaitlist(false)}
                          className="text-sm text-amber-700 hover:underline"
                        >
                          Pick a supported industry
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                {showWaitlist && waitlistDone && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-semibold text-green-900">You&apos;re on the waitlist!</p>
                    <p className="text-sm text-green-700 mt-1">
                      We&apos;ll email you the moment we launch for your industry.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowWaitlist(false)}
                      className="mt-2 text-sm text-green-700 hover:underline"
                    >
                      Pick a supported industry to get leads now
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="targetLocations" className="block text-sm font-medium text-foreground mb-1.5">
                  Target locations <span className="text-muted-foreground">(optional)</span>
                </label>
                <input {...register('targetLocations')} id="targetLocations" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="e.g., California, Northeast US, National" aria-required="false" />
              </div>

              <div>
                <label htmlFor="monthlyLeadNeed" className="block text-sm font-medium text-foreground mb-1.5">How many leads do you need per month? *</label>
                <select {...register('monthlyLeadNeed')} id="monthlyLeadNeed" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" aria-required="true" aria-invalid={!!errors.monthlyLeadNeed} aria-describedby={errors.monthlyLeadNeed ? 'monthlyLeadNeed-error' : undefined}>
                  <option value="">Select lead volume</option>
                  {businessQ1Options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.monthlyLeadNeed && <p id="monthlyLeadNeed-error" className="text-xs text-destructive mt-1" role="alert">{errors.monthlyLeadNeed.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account & Get Free Leads'}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>

              <p className="text-xs text-muted-foreground text-center">
                Questions?{' '}
                <a href="mailto:hello@meetcursive.com" className="text-primary hover:underline">hello@meetcursive.com</a>
              </p>
            </motion.form>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
