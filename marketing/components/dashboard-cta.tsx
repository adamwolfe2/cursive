"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { DashboardPreview } from "@/components/dashboard-preview"

interface DashboardCTAProps {
  headline: string
  subheadline: string
  description: string
  ctaText?: string
  ctaUrl?: string
}

export function DashboardCTA({
  headline,
  subheadline,
  description,
  ctaText = "Book Your Free AI Audit Now",
  ctaUrl = "https://cal.com/cursive/30min",
}: DashboardCTAProps) {
  return (
    <section className="relative py-32 bg-white overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center relative z-10 mb-16"
        >
          <h2 className="text-5xl lg:text-7xl font-light text-gray-900 mb-4 leading-tight">
            {headline}
          </h2>
          <p className="font-cursive text-5xl lg:text-6xl text-gray-500 mb-6">
            {subheadline}
          </p>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            {description}
          </p>

          <Button
            size="lg"
            href={ctaUrl}
            target="_blank"
            className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
          >
            {ctaText}
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-gray-600 mt-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No commitment required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Setup in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>See results in 24 hours</span>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-6xl mx-auto"
        >
          <div className="relative rounded-xl overflow-hidden shadow-2xl">
            <DashboardPreview />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
