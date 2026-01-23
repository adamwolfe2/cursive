'use client'

/**
 * Features Section
 * OpenInfo Platform Marketing Site
 *
 * Showcase key features with scroll animations.
 */

import * as React from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  AnimatedSection,
  AnimatedHeading,
  FadeIn,
  AnimatedCard,
  AnimatedContainer,
  AnimatedItem,
} from '../ui/animated-components'

// ============================================
// FEATURES DATA
// ============================================

const features = [
  {
    title: 'AI-Powered Insights',
    description: 'Get intelligent recommendations and insights about your team\'s productivity patterns and task completion rates.',
    icon: AIIcon,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Real-time Updates',
    description: 'Stay connected with live task updates, instant notifications, and seamless team collaboration.',
    icon: RealtimeIcon,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Automated Reports',
    description: 'End-of-day reports generated automatically, summarizing progress and highlighting key achievements.',
    icon: ReportIcon,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Team Management',
    description: 'Organize your team with workspaces, roles, and permissions. Scale from small teams to enterprise.',
    icon: TeamIcon,
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    title: 'Integrations',
    description: 'Connect with your favorite tools - Slack, GitHub, Jira, and more. Keep everything in sync.',
    icon: IntegrationIcon,
    gradient: 'from-rose-500 to-red-500',
  },
  {
    title: 'White-label Ready',
    description: 'Fully customizable platform ready for white-labeling. Add your branding and resell to clients.',
    icon: WhiteLabelIcon,
    gradient: 'from-indigo-500 to-violet-500',
  },
]

// ============================================
// FEATURES SECTION
// ============================================

export function FeaturesSection() {
  return (
    <section className="py-24 lg:py-32 bg-neutral-50/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Features
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h2"
            className="text-4xl lg:text-5xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Everything you need to
            <br />
            manage your team
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg text-neutral-600">
              Powerful features designed to help teams of all sizes track tasks, generate reports, and stay productive.
            </p>
          </FadeIn>
        </div>

        {/* Features Grid */}
        <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <AnimatedItem key={feature.title}>
              <FeatureCard feature={feature} index={index} />
            </AnimatedItem>
          ))}
        </AnimatedContainer>
      </div>
    </section>
  )
}

// ============================================
// FEATURE CARD
// ============================================

interface FeatureCardProps {
  feature: typeof features[0]
  index: number
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = feature.icon

  return (
    <AnimatedCard className="p-6 lg:p-8 h-full">
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-5',
          `bg-gradient-to-br ${feature.gradient}`
        )}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-neutral-900 mb-3">
        {feature.title}
      </h3>
      <p className="text-neutral-600 leading-relaxed">
        {feature.description}
      </p>
    </AnimatedCard>
  )
}

// ============================================
// FEATURE ICONS
// ============================================

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5m-9.25-11.396c.251.023.501.05.75.082M19 14.5l-4.5-4.5m0 0L19 5.5m-4.5 4.5l4.5 4.5m-4.5-4.5L10 14.5" />
    </svg>
  )
}

function RealtimeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}

function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

function IntegrationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  )
}

function WhiteLabelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  )
}

export default FeaturesSection
