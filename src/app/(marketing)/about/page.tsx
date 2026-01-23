'use client'

/**
 * About Page
 * OpenInfo Platform Marketing Site
 *
 * Company story, mission, values, and team.
 */

import * as React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  FadeIn,
  AnimatedHeading,
  AnimatedCard,
  AnimatedContainer,
  AnimatedItem,
  Counter,
  NewsletterCTA,
} from '@/components/marketing'

// ============================================
// COMPANY DATA
// ============================================

const stats = [
  { label: 'Team members managed', value: 50000 },
  { label: 'Tasks completed', value: 2500000 },
  { label: 'Reports generated', value: 500000 },
  { label: 'Customer satisfaction', value: 99, suffix: '%' },
]

const values = [
  {
    title: 'Transparency',
    description: 'We believe in open communication. Our platform helps teams share progress and stay aligned without micromanagement.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    title: 'Simplicity',
    description: 'Complex problems deserve simple solutions. We design intuitive tools that teams actually want to use.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    title: 'Intelligence',
    description: 'AI should amplify human capabilities, not replace them. Our insights help teams make better decisions.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'Trust',
    description: 'Security and privacy are non-negotiable. Your data is yours, and we protect it with enterprise-grade security.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

const timeline = [
  {
    year: '2023',
    title: 'The Beginning',
    description: 'Started with a simple idea: make team reporting effortless and insightful.',
  },
  {
    year: '2024',
    title: 'AI Integration',
    description: 'Launched AI-powered insights, transforming raw data into actionable intelligence.',
  },
  {
    year: '2025',
    title: 'Enterprise Ready',
    description: 'Scaled to support large organizations with advanced security and customization.',
  },
  {
    year: '2026',
    title: 'Global Expansion',
    description: 'Now serving teams across 50+ countries with multi-language support.',
  },
]

const team = [
  {
    name: 'Alex Chen',
    role: 'CEO & Co-founder',
    image: '/team/alex.jpg',
    bio: 'Former engineering lead at Stripe. Passionate about building tools that empower teams.',
  },
  {
    name: 'Sarah Johnson',
    role: 'CTO & Co-founder',
    image: '/team/sarah.jpg',
    bio: 'AI researcher turned entrepreneur. Led ML teams at Google before founding OpenInfo.',
  },
  {
    name: 'Marcus Williams',
    role: 'VP of Product',
    image: '/team/marcus.jpg',
    bio: 'Product leader with 15 years of experience in SaaS. Previously at Notion and Slack.',
  },
  {
    name: 'Emily Park',
    role: 'VP of Engineering',
    image: '/team/emily.jpg',
    bio: 'Systems architect who scaled infrastructure at AWS. Loves building reliable systems.',
  },
]

// ============================================
// ABOUT PAGE
// ============================================

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              About Us
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h1"
            className="text-4xl lg:text-6xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Building the future of
            <br />
            team collaboration
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg lg:text-xl text-neutral-600 max-w-3xl mx-auto">
              We're on a mission to help teams work smarter, communicate better,
              and achieve more together. Our platform combines powerful task management
              with AI-driven insights to transform how teams operate.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <FadeIn key={stat.label} delay={index * 0.1}>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
                    <Counter to={stat.value} duration={2} />
                    {stat.suffix || '+'}
                  </div>
                  <div className="text-sm text-neutral-600">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                  Our Mission
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4 mb-6">
                  Empowering teams to do their best work
                </h2>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  We started OpenInfo because we experienced firsthand the frustration of
                  fragmented team communication. Status updates lost in chat threads,
                  progress invisible to leadership, and insights buried in spreadsheets.
                </p>
                <p className="text-neutral-600 leading-relaxed">
                  Our platform brings everything together—tasks, progress, and insights—in
                  one place. With AI that actually understands your team's work, we help
                  you focus on what matters: building great things together.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="relative">
                <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-2xl p-8 lg:p-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">Instant Insights</div>
                        <div className="text-sm text-neutral-500">AI-powered analysis in real-time</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">Simple Workflow</div>
                        <div className="text-sm text-neutral-500">No training required</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">Team Aligned</div>
                        <div className="text-sm text-neutral-500">Everyone on the same page</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn>
              <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                Our Values
              </span>
            </FadeIn>
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4"
            >
              What we stand for
            </AnimatedHeading>
          </div>

          <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <AnimatedItem key={value.title}>
                <AnimatedCard className="p-6 h-full">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-700 mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {value.description}
                  </p>
                </AnimatedCard>
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn>
              <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                Our Journey
              </span>
            </FadeIn>
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4"
            >
              How we got here
            </AnimatedHeading>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-neutral-200 hidden md:block" />

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <FadeIn key={item.year} delay={index * 0.1}>
                  <div className="relative flex items-start gap-6 md:gap-8">
                    <div className="flex-shrink-0 w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-white font-bold relative z-10">
                      {item.year}
                    </div>
                    <div className="flex-1 pb-8">
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-neutral-600">{item.description}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn>
              <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                Our Team
              </span>
            </FadeIn>
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4 mb-4"
            >
              Meet the people behind OpenInfo
            </AnimatedHeading>
            <FadeIn delay={0.2}>
              <p className="text-neutral-600 max-w-2xl mx-auto">
                We're a diverse team of engineers, designers, and product thinkers
                united by a passion for building tools that make work better.
              </p>
            </FadeIn>
          </div>

          <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <AnimatedItem key={member.name}>
                <AnimatedCard className="p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-neutral-500">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {member.name}
                  </h3>
                  <p className="text-sm text-neutral-500 mb-3">{member.role}</p>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {member.bio}
                  </p>
                </AnimatedCard>
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* Careers CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Join Us
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h2"
            className="text-3xl lg:text-4xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Help us build the future of work
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
              We're always looking for talented people who share our passion for
              creating exceptional products. Check out our open positions.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <a
              href="/careers"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              View Open Positions
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </FadeIn>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterCTA />
    </div>
  )
}
