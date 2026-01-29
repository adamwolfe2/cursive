/**
 * Business Signup Form (Screen 7A)
 * Collects business information with validation
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fadeInVariants, buttonVariants } from '@/lib/utils/waitlist-animations'
import { businessFormSchema, industryOptions, businessQ1Options, type BusinessFormData } from '@/lib/utils/waitlist-validation'
import { BackButton } from './back-button'
import { ProgressBar } from './progress-bar'
import type { VSLAnswers } from '@/types/waitlist.types'

interface BusinessFormProps {
  vslAnswers: VSLAnswers
  onSubmit: (data: BusinessFormData) => void
  onBack: () => void
}

export function BusinessForm({ vslAnswers, onSubmit, onBack }: BusinessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      monthlyLeadNeed: vslAnswers.q1 || '',
    },
  })

  const onFormSubmit = async (data: BusinessFormData) => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))
    onSubmit(data)
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-2xl">
        <BackButton onClick={onBack} />

        <ProgressBar current={5} total={5} label="Step 5 of 5 - Almost There!" />

        <motion.div variants={fadeInVariants} className="bg-card border border-border rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Join the First 100 Businesses</h2>
          <p className="text-sm text-muted-foreground mb-6">Get qualified leads delivered to your inbox daily</p>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1.5">
                  First name *
                </label>
                <input
                  {...register('firstName')}
                  id="firstName"
                  type="text"
                  className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="John"
                />
                {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1.5">
                  Last name *
                </label>
                <input
                  {...register('lastName')}
                  id="lastName"
                  type="text"
                  className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Smith"
                />
                {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Work email *
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="john@company.com"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1.5">
                Company name *
              </label>
              <input
                {...register('companyName')}
                id="companyName"
                type="text"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Acme Corp"
              />
              {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName.message}</p>}
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-foreground mb-1.5">
                Industry *
              </label>
              <select
                {...register('industry')}
                id="industry"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Select an industry</option>
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {errors.industry && <p className="text-xs text-destructive mt-1">{errors.industry.message}</p>}
            </div>

            {/* Target Locations */}
            <div>
              <label htmlFor="targetLocations" className="block text-sm font-medium text-foreground mb-1.5">
                Target locations <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                {...register('targetLocations')}
                id="targetLocations"
                type="text"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g., California, Northeast US, National"
              />
            </div>

            {/* Monthly Lead Need */}
            <div>
              <label htmlFor="monthlyLeadNeed" className="block text-sm font-medium text-foreground mb-1.5">
                How many leads do you need per month? *
              </label>
              <select
                {...register('monthlyLeadNeed')}
                id="monthlyLeadNeed"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Select lead volume</option>
                {businessQ1Options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.monthlyLeadNeed && <p className="text-xs text-destructive mt-1">{errors.monthlyLeadNeed.message}</p>}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isSubmitting ? 'Submitting...' : 'Get Free Leads'}
            </motion.button>

            {/* Trust Line */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              No spam. Unsubscribe anytime. Limited to first 100 businesses.
            </p>

            {/* Contact Link */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Questions?{' '}
              <a href="mailto:hello@meetcursive.com" className="text-primary hover:underline">
                hello@meetcursive.com
              </a>
            </p>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}
