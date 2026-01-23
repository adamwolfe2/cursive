'use client'

/**
 * Testimonials Section
 * OpenInfo Platform Marketing Site
 *
 * Social proof with customer testimonials.
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  FadeIn,
  AnimatedHeading,
  AnimatedCard,
  AnimatedContainer,
  AnimatedItem,
} from '../ui/animated-components'

// ============================================
// TESTIMONIALS DATA
// ============================================

const testimonials = [
  {
    quote: "OpenInfo has completely transformed how our team manages tasks. The AI-powered insights have helped us identify bottlenecks we never knew existed.",
    author: 'Sarah Chen',
    role: 'VP of Engineering',
    company: 'TechCorp',
    avatar: null,
  },
  {
    quote: "The end-of-day reports are a game-changer. Leadership now has complete visibility into team progress without constant status meetings.",
    author: 'Michael Rodriguez',
    role: 'Product Manager',
    company: 'InnovateCo',
    avatar: null,
  },
  {
    quote: "We went from chaos to clarity in just two weeks. The platform is intuitive, and the support team is incredibly responsive.",
    author: 'Emily Watson',
    role: 'Operations Director',
    company: 'ScaleUp Inc',
    avatar: null,
  },
  {
    quote: "As an agency, we needed something we could white-label for clients. OpenInfo delivered exactly that with excellent customization options.",
    author: 'James Park',
    role: 'CEO',
    company: 'Digital Agency Pro',
    avatar: null,
  },
  {
    quote: "The real-time updates and Claude integration keep everyone aligned. It's like having a project manager that never sleeps.",
    author: 'Lisa Thompson',
    role: 'Team Lead',
    company: 'StartupHub',
    avatar: null,
  },
  {
    quote: "Enterprise-ready from day one. Security, compliance, and scalability were all there when we needed them.",
    author: 'David Kim',
    role: 'CTO',
    company: 'SecureTech',
    avatar: null,
  },
]

// ============================================
// TESTIMONIALS SECTION
// ============================================

export function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Testimonials
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h2"
            className="text-4xl lg:text-5xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Loved by teams
            <br />
            around the world
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg text-neutral-600">
              See what teams are saying about OpenInfo and how it's transformed their workflow.
            </p>
          </FadeIn>
        </div>

        {/* Testimonials Grid */}
        <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedItem key={testimonial.author}>
              <TestimonialCard testimonial={testimonial} />
            </AnimatedItem>
          ))}
        </AnimatedContainer>
      </div>
    </section>
  )
}

// ============================================
// TESTIMONIAL CARD
// ============================================

interface TestimonialCardProps {
  testimonial: typeof testimonials[0]
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <AnimatedCard className="p-6 lg:p-8 h-full flex flex-col">
      {/* Stars */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="w-5 h-5 text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-neutral-700 leading-relaxed flex-1 mb-6">
        "{testimonial.quote}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
          <span className="text-neutral-600 font-semibold text-sm">
            {testimonial.author.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <p className="font-medium text-neutral-900">{testimonial.author}</p>
          <p className="text-sm text-neutral-500">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </AnimatedCard>
  )
}

// ============================================
// FEATURED TESTIMONIAL
// ============================================

export function FeaturedTestimonial() {
  const featured = testimonials[0]

  return (
    <section className="py-24 lg:py-32 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <FadeIn>
          <svg
            className="w-12 h-12 mx-auto text-neutral-300 mb-8"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
          </svg>
        </FadeIn>

        <FadeIn delay={0.1}>
          <blockquote className="text-2xl lg:text-3xl font-medium text-neutral-900 leading-relaxed mb-8">
            "{featured.quote}"
          </blockquote>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-600 font-semibold">
                {featured.author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-neutral-900">{featured.author}</p>
              <p className="text-neutral-500">
                {featured.role}, {featured.company}
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export default TestimonialsSection
