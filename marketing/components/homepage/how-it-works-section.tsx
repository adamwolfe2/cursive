"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Container } from "@/components/ui/container"
import {
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface ProcessStep {
  number: number
  title: string
  description: string
  details: string[]
  color: string
}

const processSteps: ProcessStep[] = [
  {
    number: 1,
    title: "Visitor Lands on Website",
    description: "Pixel fires, collects data",
    details: [
      "Tracking pixel loads instantly",
      "Captures page views, time on site, and behavior",
      "Records device fingerprint and IP address",
      "Works across all pages without forms"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 2,
    title: "Data Enrichment",
    description: "IP resolution, device fingerprinting, identity graph matching",
    details: [
      "IP address resolved to company location",
      "Device fingerprinting for cross-session tracking",
      "Identity graph matches across 220M+ profiles",
      "Appends verified email and phone data"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 3,
    title: "Profile Building",
    description: "Append firmographic, demographic, behavioral data",
    details: [
      "Company details (size, industry, revenue)",
      "Individual contacts (title, department, seniority)",
      "Behavioral signals (pages viewed, time spent)",
      "Historical visit patterns and frequency"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 4,
    title: "Real-time Scoring",
    description: "Intent signals, fit analysis, buying stage",
    details: [
      "Intent signals from 450B+ monthly data points",
      "ICP fit score based on your criteria",
      "Buying stage detection (research, evaluation, decision)",
      "Prioritization by likelihood to convert"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 5,
    title: "Audience Activation",
    description: "Sync to CRM, ad platforms, email tools",
    details: [
      "Real-time sync to Salesforce, HubSpot, Pipedrive",
      "Push to ad platforms (Google, Facebook, LinkedIn)",
      "Trigger automated email and SMS campaigns",
      "Direct mail postcards for high-intent visitors"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 6,
    title: "Conversion Tracking",
    description: "Close the loop, prove ROI",
    details: [
      "Track conversions back to original visit",
      "Attribution across multiple touchpoints",
      "Calculate ROI per channel and campaign",
      "Optimize based on what actually drives revenue"
    ],
    color: "#007AFF" // blue
  }
]

export function HowItWorksSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-advance functionality
  useEffect(() => {
    if (!isAutoPlay) return

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % processSteps.length)
    }, 6000) // Change slide every 6 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlay])

  const handlePrev = () => {
    setIsAutoPlay(false)
    setCurrentIndex((prev) => (prev - 1 + processSteps.length) % processSteps.length)
  }

  const handleNext = () => {
    setIsAutoPlay(false)
    setCurrentIndex((prev) => (prev + 1) % processSteps.length)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlay(false)
    setCurrentIndex(index)
  }

  const currentStep = processSteps[currentIndex]

  return (
    <section className="py-20 bg-white">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              The Technical Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From anonymous visitor to qualified pipeline in 6 automated steps
            </p>
          </motion.div>
        </div>

        {/* Horizontal Ticker/Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Slide Container */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0.3, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0.3, x: -40 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {/* Step Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow">
                  {/* Title & Description */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      Step {currentStep.number}
                    </div>
                    <h3 className="text-3xl font-medium text-gray-900 mb-2">
                      {currentStep.title}
                    </h3>
                    <p className="text-lg text-gray-600">
                      {currentStep.description}
                    </p>
                  </div>

                  {/* Details List */}
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentStep.details.map((detail, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3"
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: currentStep.color }}
                        />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8">
            {/* Previous Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              className="p-2 lg:p-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            {/* Dot Indicators */}
            <div className="flex items-center gap-2">
              {processSteps.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-blue-500 w-3 h-3"
                      : "bg-gray-300 hover:bg-gray-400 w-2 h-2"
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to step ${index + 1}`}
                  aria-current={index === currentIndex}
                />
              ))}
            </div>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="p-2 lg:p-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
              aria-label="Next step"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Progress Counter */}
          <div className="text-center mt-6 text-sm text-gray-500">
            Step {currentIndex + 1} of {processSteps.length}
          </div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl font-light text-gray-900 mb-2">
              &lt;5 min
            </div>
            <div className="text-sm text-gray-600">
              Setup Time
            </div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl font-light text-gray-900 mb-2">
              Real-time
            </div>
            <div className="text-sm text-gray-600">
              Data Processing
            </div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl font-light text-gray-900 mb-2">
              200+
            </div>
            <div className="text-sm text-gray-600">
              Native Integrations
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
