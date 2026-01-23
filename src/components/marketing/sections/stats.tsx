'use client'

/**
 * Stats Section
 * OpenInfo Platform Marketing Site
 *
 * Impressive statistics with animated counters.
 */

import * as React from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/design-system'
import { FadeIn, Counter, AnimatedContainer, AnimatedItem } from '../ui/animated-components'

// ============================================
// STATS DATA
// ============================================

const stats = [
  { value: 10000, suffix: '+', label: 'Teams worldwide' },
  { value: 5, suffix: 'M+', label: 'Tasks completed' },
  { value: 99.9, suffix: '%', label: 'Uptime guarantee' },
  { value: 24, suffix: '/7', label: 'Support available' },
]

// ============================================
// STATS SECTION
// ============================================

export function StatsSection() {
  return (
    <section className="py-20 lg:py-24 bg-neutral-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <AnimatedContainer className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <AnimatedItem key={stat.label}>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  <Counter
                    to={stat.value}
                    suffix={stat.suffix}
                    duration={2.5}
                  />
                </div>
                <p className="text-neutral-400 text-sm lg:text-base">
                  {stat.label}
                </p>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedContainer>
      </div>
    </section>
  )
}

// ============================================
// ALTERNATE STATS (Light version)
// ============================================

export function StatsLightSection() {
  return (
    <section className="py-16 lg:py-20 border-y border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <AnimatedContainer className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <AnimatedItem key={stat.label}>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-2">
                  <Counter
                    to={stat.value}
                    suffix={stat.suffix}
                    duration={2.5}
                  />
                </div>
                <p className="text-neutral-500 text-sm lg:text-base">
                  {stat.label}
                </p>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedContainer>
      </div>
    </section>
  )
}

export default StatsSection
