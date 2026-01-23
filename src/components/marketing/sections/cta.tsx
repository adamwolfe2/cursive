'use client'

/**
 * CTA Sections
 * OpenInfo Platform Marketing Site
 *
 * Call-to-action sections with various styles.
 */

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/design-system'
import { AnimatedButton, FadeIn, AnimatedHeading } from '../ui/animated-components'

// ============================================
// MAIN CTA SECTION
// ============================================

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative bg-neutral-900 rounded-3xl overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 -right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          </div>

          <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center">
            <FadeIn>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white/80 mb-6">
                Get started today
              </span>
            </FadeIn>

            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-5xl font-bold text-white mb-6 max-w-2xl mx-auto"
            >
              Ready to transform how your team works?
            </AnimatedHeading>

            <FadeIn delay={0.2}>
              <p className="text-lg text-neutral-300 max-w-xl mx-auto mb-10">
                Join thousands of teams already using OpenInfo to manage tasks, track progress, and boost productivity.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  className="bg-white text-neutral-900 hover:bg-neutral-100"
                >
                  Start Free Trial
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </AnimatedButton>
                <AnimatedButton
                  variant="ghost"
                  size="lg"
                  className="text-white hover:text-white hover:bg-white/10"
                >
                  Talk to Sales
                </AnimatedButton>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <p className="text-sm text-neutral-400 mt-8">
                No credit card required · 14-day free trial · Cancel anytime
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SIMPLE CTA SECTION
// ============================================

export function SimpleCTASection() {
  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <AnimatedHeading
          tag="h2"
          className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-6"
        >
          Start managing your team today
        </AnimatedHeading>

        <FadeIn delay={0.2}>
          <p className="text-lg text-neutral-600 mb-10">
            Get up and running in minutes. No complex setup required.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AnimatedButton variant="primary" size="lg">
              Get Started Free
            </AnimatedButton>
            <AnimatedButton variant="outline" size="lg">
              Schedule Demo
            </AnimatedButton>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ============================================
// NEWSLETTER CTA
// ============================================

export function NewsletterCTA() {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setStatus('success')
    setEmail('')
  }

  return (
    <section className="py-16 lg:py-20 bg-neutral-50">
      <div className="max-w-xl mx-auto px-6 lg:px-8 text-center">
        <FadeIn>
          <h3 className="text-2xl font-bold text-neutral-900 mb-4">
            Stay updated
          </h3>
          <p className="text-neutral-600 mb-8">
            Get product updates, tips, and resources delivered to your inbox.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              required
            />
            <AnimatedButton
              type="submit"
              variant="primary"
              size="md"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </AnimatedButton>
          </form>

          {status === 'success' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-emerald-600 mt-4"
            >
              Thanks for subscribing! Check your inbox to confirm.
            </motion.p>
          )}
        </FadeIn>
      </div>
    </section>
  )
}

export default CTASection
