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
  { id: "company", field: "Company", value: "Salesforce", status: "pending", confidence: 100, duration: 80 },
  { id: "phone", field: "Phone Number", value: "(555) 234-5678", status: "pending", confidence: 88, duration: 200 },
  { id: "intent", field: "Intent Signals", value: "5 signals (last 30 days)", status: "pending", confidence: 85, duration: 250 },
]

export function DemoEnrichmentWaterfall() {
  const [steps, setSteps] = useState(enrichmentSteps.map(s => ({ ...s })))
  const [totalTime, setTotalTime] = useState(0)

  // Start enrichment cycle
  useEffect(() => {
    const startCycle = () => {
      setSteps(enrichmentSteps.map(s => ({ ...s, status: "pending" as const })))
      setTotalTime(0)
      let accumulatedTime = 0

      enrichmentSteps.forEach((step, index) => {
        // Set to processing
        setTimeout(() => {
          setSteps(prev => prev.map((s, i) =>
            i === index ? { ...s, status: "processing" as const } : s
          ))
        }, accumulatedTime)

        accumulatedTime += step.duration

        // Set to complete
        setTimeout(() => {
          setSteps(prev => prev.map((s, i) =>
            i === index ? { ...s, status: "complete" as const } : s
          ))
          setTotalTime(accumulatedTime)

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
    <div className="space-y-2">
      {/* Input + Progress Row */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-2.5 border-2 border-primary"
        >
          <div className="text-[10px] text-gray-600 mb-1">Input Email</div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-900 font-medium truncate">sarah.j@salesforce.com</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-2.5 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-[10px] text-gray-600">Progress</div>
              <motion.div key={completionPercent} className="text-lg text-gray-900 font-light">{completionPercent}%</motion.div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-600">Time</div>
              <div className="text-lg text-gray-900 font-light">{totalTime}ms</div>
            </div>
          </div>
          <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
            <motion.div
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Enrichment Steps */}
      <div className="space-y-1">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-md p-2 border transition-all ${
              step.status === "complete"
                ? "border-blue-300 bg-blue-50/30"
                : step.status === "processing"
                ? "border-primary shadow-sm"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                <AnimatePresence mode="wait">
                  {step.status === "complete" ? (
                    <motion.div
                      key="complete"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : step.status === "processing" ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <div key="pending" className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-gray-900">{step.field}</span>
                  {step.status === "complete" && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-gray-500 ml-2">{step.value}</motion.span>
                  )}
                  {step.status === "processing" && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-primary ml-2">Finding...</motion.span>
                  )}
                </div>
                {step.status === "complete" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[10px] text-blue-600 font-medium flex-shrink-0"
                  >
                    {step.confidence}%
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
