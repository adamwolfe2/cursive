'use client'

/**
 * Hero Section
 * OpenInfo Platform Marketing Site
 *
 * The main hero section with animated headlines and CTA.
 */

import * as React from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  AnimatedButton,
  AnimatedHeading,
  FadeIn,
  Counter,
  Floating,
} from '../ui/animated-components'

// ============================================
// HERO SECTION
// ============================================

export function HeroSection() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Orbs */}
        <motion.div
          style={{ y }}
          className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y }}
          className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y }}
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl"
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
          aria-hidden="true"
        />
      </div>

      <motion.div
        style={{ opacity }}
        className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32"
      >
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <FadeIn delay={0}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200/60 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm text-neutral-600 font-medium">
                Now available for Enterprise teams
              </span>
            </motion.div>
          </FadeIn>

          {/* Headline */}
          <AnimatedHeading
            tag="h1"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6"
          >
            Manage your team
            <br />
            <span className="bg-gradient-to-r from-neutral-900 via-neutral-600 to-neutral-900 bg-clip-text text-transparent">
              with AI precision
            </span>
          </AnimatedHeading>

          {/* Subheadline */}
          <FadeIn delay={0.2}>
            <p className="text-lg lg:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              The all-in-one platform for teams to upload tasks, track progress, and get real-time AI-powered updates. End-of-day reports delivered automatically.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <AnimatedButton variant="primary" size="lg">
                Start Free Trial
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </AnimatedButton>
              <AnimatedButton variant="outline" size="lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </AnimatedButton>
            </div>
          </FadeIn>

          {/* Social Proof */}
          <FadeIn delay={0.4}>
            <div className="flex flex-col items-center">
              <p className="text-sm text-neutral-500 mb-4">
                Trusted by teams at
              </p>
              <div className="flex items-center gap-8 lg:gap-12 opacity-60">
                {['Google', 'Microsoft', 'Stripe', 'Notion', 'Figma'].map((company) => (
                  <span
                    key={company}
                    className="text-neutral-400 font-semibold text-lg"
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Product Preview */}
        <FadeIn delay={0.5}>
          <div className="mt-16 lg:mt-24 relative">
            {/* Browser Frame */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative mx-auto max-w-5xl"
            >
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-50" />

              {/* Browser Window */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-neutral-200/60 overflow-hidden">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-neutral-100/80 border-b border-neutral-200/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1.5 bg-white rounded-lg text-sm text-neutral-500 font-mono">
                      app.openinfo.com
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview */}
                <div className="aspect-[16/10] bg-neutral-50">
                  <DashboardPreview />
                </div>
              </div>
            </motion.div>
          </div>
        </FadeIn>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-neutral-300 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-2.5 rounded-full bg-neutral-400" />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ============================================
// DASHBOARD PREVIEW
// ============================================

function DashboardPreview() {
  return (
    <div className="w-full h-full p-6 flex gap-4">
      {/* Sidebar Preview */}
      <div className="w-52 flex-shrink-0 bg-white rounded-xl p-4 border border-neutral-200/60">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <span className="font-semibold text-sm">OpenInfo</span>
        </div>
        <div className="space-y-1">
          {['Dashboard', 'Tasks', 'Reports', 'Team', 'Settings'].map((item, i) => (
            <div
              key={item}
              className={cn(
                'px-3 py-2 rounded-lg text-sm',
                i === 0
                  ? 'bg-neutral-100 text-neutral-900 font-medium'
                  : 'text-neutral-500'
              )}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Preview */}
      <div className="flex-1 bg-white rounded-xl p-6 border border-neutral-200/60">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-neutral-900">Team Overview</h3>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-neutral-100 text-sm text-neutral-600">
              This Week
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tasks Completed', value: 847, change: '+12%' },
            { label: 'Team Members', value: 24, change: '+3' },
            { label: 'Reports Generated', value: 156, change: '+8%' },
            { label: 'AI Insights', value: 42, change: 'New' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-neutral-50 rounded-xl p-4 border border-neutral-100"
            >
              <p className="text-xs text-neutral-500 mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-neutral-900">
                  {stat.value}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Chart Placeholder */}
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
          <div className="flex items-end justify-between h-32 gap-2">
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
                className="flex-1 bg-neutral-900 rounded-t"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
