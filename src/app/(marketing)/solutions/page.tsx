'use client'

/**
 * Solutions Page
 * OpenInfo Platform Marketing Site
 *
 * Use cases and industry solutions.
 */

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  FadeIn,
  AnimatedHeading,
  AnimatedCard,
  AnimatedContainer,
  AnimatedItem,
  AnimatedButton,
  NewsletterCTA,
} from '@/components/marketing'

// ============================================
// SOLUTIONS DATA
// ============================================

const useCases = [
  {
    id: 'engineering',
    title: 'Engineering Teams',
    description: 'Track sprints, manage technical debt, and keep stakeholders informed with automated status reports.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    benefits: [
      'Sprint progress tracking',
      'Technical debt visibility',
      'Automated standup reports',
      'GitHub/GitLab integration',
    ],
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'marketing',
    title: 'Marketing Teams',
    description: 'Coordinate campaigns, track deliverables, and measure team productivity across channels.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    benefits: [
      'Campaign milestone tracking',
      'Content calendar integration',
      'Cross-team collaboration',
      'Performance analytics',
    ],
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'sales',
    title: 'Sales Teams',
    description: 'Monitor deal progress, track activities, and generate pipeline reports automatically.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    benefits: [
      'Pipeline visibility',
      'Activity tracking',
      'CRM integration',
      'Deal velocity insights',
    ],
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'operations',
    title: 'Operations Teams',
    description: 'Streamline workflows, track SLAs, and maintain visibility across all operational activities.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    benefits: [
      'SLA tracking',
      'Process automation',
      'Resource allocation',
      'Compliance reporting',
    ],
    color: 'from-amber-500 to-amber-600',
  },
  {
    id: 'hr',
    title: 'HR & People Teams',
    description: 'Manage onboarding, track team initiatives, and maintain visibility into workforce activities.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    benefits: [
      'Onboarding workflows',
      'Training tracking',
      'Team pulse insights',
      'Performance visibility',
    ],
    color: 'from-pink-500 to-pink-600',
  },
  {
    id: 'agencies',
    title: 'Agencies',
    description: 'Manage multiple client projects, track billable hours, and generate client-ready reports.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    benefits: [
      'Multi-client workspaces',
      'White-label reports',
      'Time tracking',
      'Client dashboards',
    ],
    color: 'from-indigo-500 to-indigo-600',
  },
]

const industries = [
  {
    name: 'Technology',
    description: 'Software companies, startups, and tech enterprises',
    icon: '💻',
  },
  {
    name: 'Financial Services',
    description: 'Banks, fintech, and investment firms',
    icon: '🏦',
  },
  {
    name: 'Healthcare',
    description: 'Hospitals, clinics, and health tech',
    icon: '🏥',
  },
  {
    name: 'Education',
    description: 'Universities, schools, and EdTech',
    icon: '🎓',
  },
  {
    name: 'Retail',
    description: 'E-commerce and brick-and-mortar',
    icon: '🛒',
  },
  {
    name: 'Manufacturing',
    description: 'Production and supply chain',
    icon: '🏭',
  },
]

const caseStudies = [
  {
    company: 'TechCorp',
    industry: 'Technology',
    logo: '/logos/techcorp.svg',
    quote: 'OpenInfo reduced our meeting time by 40% by eliminating status update meetings.',
    metric: '40%',
    metricLabel: 'Less meeting time',
    author: 'VP of Engineering',
  },
  {
    company: 'GlobalBank',
    industry: 'Financial Services',
    logo: '/logos/globalbank.svg',
    quote: 'We now have complete visibility into our team\'s productivity across 12 offices.',
    metric: '12',
    metricLabel: 'Offices connected',
    author: 'COO',
  },
  {
    company: 'HealthFirst',
    industry: 'Healthcare',
    logo: '/logos/healthfirst.svg',
    quote: 'Compliance reporting that used to take days now happens automatically.',
    metric: '90%',
    metricLabel: 'Time saved on reports',
    author: 'Director of Operations',
  },
]

// ============================================
// SOLUTIONS PAGE
// ============================================

export default function SolutionsPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Solutions
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h1"
            className="text-4xl lg:text-6xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Built for every team,
            <br />
            in every industry
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg lg:text-xl text-neutral-600 max-w-3xl mx-auto">
              Whether you're a small startup or a global enterprise, OpenInfo adapts
              to your workflow. Discover how teams like yours are transforming
              their productivity.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn>
              <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                By Team
              </span>
            </FadeIn>
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4"
            >
              Solutions for every department
            </AnimatedHeading>
          </div>

          <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <AnimatedItem key={useCase.id}>
                <UseCaseCard useCase={useCase} />
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn>
              <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                By Industry
              </span>
            </FadeIn>
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4 mb-4"
            >
              Trusted across industries
            </AnimatedHeading>
            <FadeIn delay={0.2}>
              <p className="text-neutral-600 max-w-2xl mx-auto">
                From regulated industries to fast-moving startups, OpenInfo provides
                the flexibility and security organizations need.
              </p>
            </FadeIn>
          </div>

          <AnimatedContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {industries.map((industry) => (
              <AnimatedItem key={industry.name}>
                <div className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-shadow cursor-pointer border border-neutral-100">
                  <div className="text-3xl mb-2">{industry.icon}</div>
                  <div className="font-medium text-neutral-900 text-sm mb-1">
                    {industry.name}
                  </div>
                  <div className="text-xs text-neutral-500 hidden sm:block">
                    {industry.description}
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn>
              <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                Case Studies
              </span>
            </FadeIn>
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4"
            >
              Real results from real teams
            </AnimatedHeading>
          </div>

          <AnimatedContainer className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study) => (
              <AnimatedItem key={study.company}>
                <AnimatedCard className="p-6 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-neutral-500">
                        {study.company.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{study.company}</div>
                      <div className="text-sm text-neutral-500">{study.industry}</div>
                    </div>
                  </div>

                  <blockquote className="text-neutral-600 italic flex-1 mb-4">
                    "{study.quote}"
                  </blockquote>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <div>
                      <div className="text-2xl font-bold text-neutral-900">{study.metric}</div>
                      <div className="text-sm text-neutral-500">{study.metricLabel}</div>
                    </div>
                    <div className="text-sm text-neutral-500">— {study.author}</div>
                  </div>
                </AnimatedCard>
              </AnimatedItem>
            ))}
          </AnimatedContainer>

          <FadeIn delay={0.4}>
            <div className="text-center mt-12">
              <AnimatedButton variant="outline" size="lg">
                View All Case Studies
              </AnimatedButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-16 lg:py-24 bg-neutral-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
              Enterprise
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h2"
            className="text-3xl lg:text-4xl font-bold text-white mt-4 mb-6"
          >
            Need a custom solution?
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
              Our enterprise plan includes custom integrations, dedicated support,
              SSO, advanced security, and white-label options. Let's discuss your needs.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AnimatedButton variant="primary" size="lg">
                Contact Sales
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                size="lg"
                className="border-neutral-700 text-white hover:bg-neutral-800"
              >
                Schedule Demo
              </AnimatedButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterCTA />
    </div>
  )
}

// ============================================
// USE CASE CARD
// ============================================

interface UseCaseCardProps {
  useCase: typeof useCases[0]
}

function UseCaseCard({ useCase }: UseCaseCardProps) {
  return (
    <AnimatedCard className="p-6 h-full flex flex-col group hover:border-neutral-300 transition-colors">
      <div className={cn(
        'w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4',
        `bg-gradient-to-br ${useCase.color}`
      )}>
        {useCase.icon}
      </div>

      <h3 className="text-xl font-semibold text-neutral-900 mb-2">
        {useCase.title}
      </h3>
      <p className="text-neutral-600 text-sm mb-4 flex-1">
        {useCase.description}
      </p>

      <ul className="space-y-2 mb-4">
        {useCase.benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-sm text-neutral-600">
            <svg
              className="w-4 h-4 text-emerald-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>

      <Link
        href={`/solutions/${useCase.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-900 group-hover:gap-2 transition-all"
      >
        Learn more
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </AnimatedCard>
  )
}
