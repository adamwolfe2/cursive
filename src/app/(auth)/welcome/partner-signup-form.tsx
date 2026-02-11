/**
 * Partner Signup Form
 * Collects partner info + creates account via email or Google OAuth
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
import { partnerFormSchema, partnerTypeOptions, partnerQ1Options, type PartnerFormData } from '@/lib/utils/waitlist-validation'
import { BackButton } from '@/components/waitlist/back-button'
import { ProgressBar } from '@/components/waitlist/progress-bar'
import type { VSLAnswers } from '@/types/waitlist.types'

interface PartnerSignupFormProps {
  vslAnswers: VSLAnswers
  onSubmit: (data: PartnerFormData, authMethod: 'email' | 'google', password?: string) => Promise<void>
  onBack: () => void
  error: string | null
}

export function PartnerSignupForm({ vslAnswers, onSubmit, onBack, error }: PartnerSignupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      databaseSize: vslAnswers.q1 || '',
    },
  })

  const onEmailSubmit = async (data: PartnerFormData) => {
    setPasswordError(null)
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(data, 'email', password)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onGoogleSubmit = async () => {
    const isValid = await new Promise<boolean>((resolve) => {
      handleSubmit(
        () => resolve(true),
        () => resolve(false)
      )()
    })

    if (!isValid) return

    setIsSubmitting(true)
    const data = getValues()
    await onSubmit(data, 'google')
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
              Create Your Partner Account
            </motion.h2>
            <motion.p variants={textRevealVariants} className="text-sm text-muted-foreground mb-6 text-center">
              Start earning recurring revenue with Cursive
            </motion.p>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-4">
                <p className="text-sm text-destructive">{error}</p>
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

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or sign up with email</span>
              </div>
            </div>

            <motion.form variants={staggerItemVariants} onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1.5">First name *</label>
                  <input {...register('firstName')} id="firstName" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="John" />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1.5">Last name *</label>
                  <input {...register('lastName')} id="lastName" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Smith" />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Work email *</label>
                <input {...register('email')} id="email" type="email" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="john@agency.com" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password *</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Min. 6 characters" />
                {passwordError && <p className="text-xs text-destructive mt-1">{passwordError}</p>}
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1.5">Company/Agency name *</label>
                <input {...register('companyName')} id="companyName" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Acme Lead Gen" />
                {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName.message}</p>}
              </div>

              <div>
                <label htmlFor="partnerType" className="block text-sm font-medium text-foreground mb-1.5">Partner type *</label>
                <select {...register('partnerType')} id="partnerType" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                  <option value="">Select partner type</option>
                  {partnerTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.partnerType && <p className="text-xs text-destructive mt-1">{errors.partnerType.message}</p>}
              </div>

              <div>
                <label htmlFor="primaryVerticals" className="block text-sm font-medium text-foreground mb-1.5">Primary verticals you serve *</label>
                <input {...register('primaryVerticals')} id="primaryVerticals" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="e.g., Solar, HVAC, Insurance" />
                {errors.primaryVerticals && <p className="text-xs text-destructive mt-1">{errors.primaryVerticals.message}</p>}
              </div>

              <div>
                <label htmlFor="databaseSize" className="block text-sm font-medium text-foreground mb-1.5">Current database size *</label>
                <select {...register('databaseSize')} id="databaseSize" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                  <option value="">Select database size</option>
                  {partnerQ1Options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.databaseSize && <p className="text-xs text-destructive mt-1">{errors.databaseSize.message}</p>}
              </div>

              <div>
                <label htmlFor="enrichmentMethods" className="block text-sm font-medium text-foreground mb-1.5">
                  Lead enrichment methods <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea {...register('enrichmentMethods')} id="enrichmentMethods" rows={3} className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none" placeholder="How do you verify/enrich? (e.g., manual research, intent tools, scraped data)" />
              </div>

              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-foreground mb-1.5">LinkedIn *</label>
                <input {...register('linkedin')} id="linkedin" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="https://linkedin.com/in/yourprofile" />
                {errors.linkedin && <p className="text-xs text-destructive mt-1">{errors.linkedin.message}</p>}
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-foreground mb-1.5">
                  Website <span className="text-muted-foreground">(optional)</span>
                </label>
                <input {...register('website')} id="website" type="text" className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="https://yourcompany.com" />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account & Join Partner Network'}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>

              <p className="text-xs text-muted-foreground text-center">
                Partner questions?{' '}
                <a href="mailto:hey@meetcursive.com" className="text-primary hover:underline">hey@meetcursive.com</a>
              </p>
            </motion.form>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
