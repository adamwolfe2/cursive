"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface EnrichmentStep {
  id: string
  field: string
  value: string
  status: "pending" | "processing" | "complete"
  confidence: number
  duration: number
}

const enrichmentSteps: EnrichmentStep[] = [
  { id: "name", field: "Full Name", value: "Sarah Johnson", status: "pending", confidence: 98, duration: 50 },
  { id: "title", field: "Job Title", value: "VP of Marketing", status: "pending", confidence: 95, duration: 120 },
  { id: "company", field: "Company", value: "Acme Corp", status: "pending", confidence: 100, duration: 80 },
  { id: "linkedin", field: "LinkedIn Profile", value: "linkedin.com/in/sarahjohnson", status: "pending", confidence: 92, duration: 200 },
  { id: "phone", field: "Phone Number", value: "(555) 234-5678", status: "pending", confidence: 88, duration: 350 },
  { id: "location", field: "Location", value: "San Francisco, CA", status: "pending", confidence: 100, duration: 90 },
  { id: "intent", field: "Intent Signals", value: "5 signals (last 30 days)", status: "pending", confidence: 85, duration: 400 },
]

export function DemoEnrichmentWaterfall() {
  const [steps, setSteps] = useState(enrichmentSteps.map(s => ({ ...s })))
  const [currentStep, setCurrentStep] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isEnriching, setIsEnriching] = useState(false)

  // Start enrichment cycle
  useEffect(() => {
    const startCycle = () => {
      setSteps(enrichmentSteps.map(s => ({ ...s, status: "pending" as const })))
      setCurrentStep(0)
      setTotalTime(0)
      setIsEnriching(true)

      let accumulatedTime = 0

      enrichmentSteps.forEach((step, index) => {
        // Set to processing
        setTimeout(() => {
          setSteps(prev => prev.map((s, i) =>
            i === index ? { ...s, status: "processing" as const } : s
          ))
          setCurrentStep(index)
        }, accumulatedTime)

        accumulatedTime += step.duration

        // Set to complete
        setTimeout(() => {
          setSteps(prev => prev.map((s, i) =>
            i === index ? { ...s, status: "complete" as const } : s
          ))
          setTotalTime(accumulatedTime)

          if (index === enrichmentSteps.length - 1) {
            setTimeout(() => {
              setIsEnriching(false)
            }, 1000)
          }
        }, accumulatedTime)
      })
    }

    startCycle()
    const interval = setInterval(startCycle, 8000) // Restart every 8 seconds

    return () => clearInterval(interval)
  }, [])

  const completedSteps = steps.filter(s => s.status === "complete").length
  const completionPercent = Math.round((completedSteps / steps.length) * 100)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Data Enrichment Waterfall</h3>
        <p className="text-gray-600">Watch data transform from email to complete profile</p>
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-4 border-2 border-[#007AFF]"
      >
        <div className="text-xs text-gray-600 mb-2">Input Email</div>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-900 font-medium">sarah.j@acmecorp.com</span>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Enrichment Progress</div>
            <motion.div
              key={completionPercent}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-3xl text-gray-900 font-light"
            >
              {completionPercent}%
            </motion.div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Time Elapsed</div>
            <div className="text-3xl text-gray-900 font-light">{totalTime}ms</div>
          </div>
        </div>
        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
          <motion.div
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-[#007AFF] to-green-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Enrichment Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-lg p-4 border-2 transition-all ${
              step.status === "complete"
                ? "border-green-300 bg-green-50/30"
                : step.status === "processing"
                ? "border-[#007AFF] shadow-md"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                <AnimatePresence mode="wait">
                  {step.status === "complete" ? (
                    <motion.div
                      key="complete"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : step.status === "processing" ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-8 h-8 border-3 border-[#007AFF] border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <div
                      key="pending"
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{step.field}</span>
                  {step.status === "processing" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-[#007AFF] font-medium"
                    >
                      Enriching...
                    </motion.span>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  {step.status === "complete" ? (
                    <motion.div
                      key="value"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-gray-600"
                    >
                      {step.value}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-gray-400 italic"
                    >
                      {step.status === "processing" ? "Finding data..." : "Waiting..."}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Confidence Score */}
              {step.status === "complete" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    step.confidence >= 95
                      ? "bg-green-100 text-green-700"
                      : step.confidence >= 85
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {step.confidence}% confident
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Final Result */}
      <AnimatePresence>
        {!isEnriching && completionPercent === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Enrichment Complete!</div>
                <div className="text-xs text-gray-600">Profile ready for export</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/50 rounded p-2">
                <span className="text-gray-600">Total Time:</span>{" "}
                <span className="font-medium text-gray-900">{totalTime}ms</span>
              </div>
              <div className="bg-white/50 rounded p-2">
                <span className="text-gray-600">Avg Confidence:</span>{" "}
                <span className="font-medium text-gray-900">
                  {Math.round(steps.reduce((acc, s) => acc + s.confidence, 0) / steps.length)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
