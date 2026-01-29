/**
 * Partner Signup Form (Screen 7B)
 * Collects partner information with validation
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fadeInVariants, buttonVariants } from '@/lib/utils/waitlist-animations'
import { partnerFormSchema, partnerTypeOptions, partnerQ1Options, type PartnerFormData } from '@/lib/utils/waitlist-validation'
import { BackButton } from './back-button'
import { ProgressBar } from './progress-bar'
import type { VSLAnswers } from '@/types/waitlist.types'

interface PartnerFormProps {
  vslAnswers: VSLAnswers
  onSubmit: (data: PartnerFormData) => void
  onBack: () => void
}

export function PartnerForm({ vslAnswers, onSubmit, onBack }: PartnerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      databaseSize: vslAnswers.q1 || '',
    },
  })

  const onFormSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true)
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Join the First 100 Partners</h2>
          <p className="text-sm text-muted-foreground mb-6">Start earning recurring revenue with Cursive</p>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
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

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Work email *
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="john@agency.com"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1.5">
                Company/Agency name *
              </label>
              <input
                {...register('companyName')}
                id="companyName"
                type="text"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Acme Lead Gen"
              />
              {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName.message}</p>}
            </div>

            <div>
              <label htmlFor="partnerType" className="block text-sm font-medium text-foreground mb-1.5">
                Partner type *
              </label>
              <select
                {...register('partnerType')}
                id="partnerType"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Select partner type</option>
                {partnerTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.partnerType && <p className="text-xs text-destructive mt-1">{errors.partnerType.message}</p>}
            </div>

            <div>
              <label htmlFor="primaryVerticals" className="block text-sm font-medium text-foreground mb-1.5">
                Primary verticals you serve *
              </label>
              <input
                {...register('primaryVerticals')}
                id="primaryVerticals"
                type="text"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g., Solar, HVAC, Insurance"
              />
              {errors.primaryVerticals && <p className="text-xs text-destructive mt-1">{errors.primaryVerticals.message}</p>}
            </div>

            <div>
              <label htmlFor="databaseSize" className="block text-sm font-medium text-foreground mb-1.5">
                Current database size *
              </label>
              <select
                {...register('databaseSize')}
                id="databaseSize"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Select database size</option>
                {partnerQ1Options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.databaseSize && <p className="text-xs text-destructive mt-1">{errors.databaseSize.message}</p>}
            </div>

            <div>
              <label htmlFor="enrichmentMethods" className="block text-sm font-medium text-foreground mb-1.5">
                Lead enrichment methods <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                {...register('enrichmentMethods')}
                id="enrichmentMethods"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                placeholder="How do you verify/enrich? (e.g., manual research, intent tools, scraped data)"
              />
            </div>

            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-foreground mb-1.5">
                LinkedIn *
              </label>
              <input
                {...register('linkedin')}
                id="linkedin"
                type="text"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="https://linkedin.com/in/yourprofile"
              />
              {errors.linkedin && <p className="text-xs text-destructive mt-1">{errors.linkedin.message}</p>}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-foreground mb-1.5">
                Website <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                {...register('website')}
                id="website"
                type="text"
                className="w-full h-10 px-3 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="https://yourcompany.com"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isSubmitting ? 'Submitting...' : 'Join Partner Network'}
            </motion.button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Your leads stay tagged to you. Transparent attribution. Fair revenue share on every placement.
            </p>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Partner questions?{' '}
              <a href="mailto:partners@meetcursive.com" className="text-primary hover:underline">
                partners@meetcursive.com
              </a>
            </p>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}
