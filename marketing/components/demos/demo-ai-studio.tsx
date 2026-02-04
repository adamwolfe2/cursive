"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

const processingSteps = [
  { label: "Crawled your site", duration: 1000 },
  { label: "Collected brand assets", duration: 1200 },
  { label: "Collected your logo", duration: 800 },
  { label: "Analyzing brand voice", duration: 1500 },
  { label: "Creating knowledge base", duration: 1000 },
]

const emailCopy = "Hi [Name], I noticed you're scaling Acme's sales team and thought you might be interested in how we helped TechStart increase their pipeline by 3x. Would you be open to a quick 15-minute call next week?"

export function DemoAIStudio() {
  const [completedSteps, setCompletedSteps] = useState(0)
  const [progress, setProgress] = useState(0)
  const [streamedText, setStreamedText] = useState("")
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false)

  // Animate progress bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1
        if (newProgress >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return newProgress
      })
    }, 50)

    return () => clearInterval(progressInterval)
  }, [])

  // Complete steps sequentially
  useEffect(() => {
    let totalDelay = 0
    processingSteps.forEach((step, index) => {
      totalDelay += step.duration
      setTimeout(() => {
        setCompletedSteps(index + 1)
        if (index === processingSteps.length - 1) {
          // Show knowledge base after all steps complete
          setTimeout(() => setShowKnowledgeBase(true), 500)
        }
      }, totalDelay)
    })
  }, [])

  // Stream text effect for generated email
  useEffect(() => {
    if (showKnowledgeBase) {
      let charIndex = 0
      const streamInterval = setInterval(() => {
        if (charIndex < emailCopy.length) {
          setStreamedText(emailCopy.slice(0, charIndex + 1))
          charIndex++
        } else {
          clearInterval(streamInterval)
        }
      }, 30)

      return () => clearInterval(streamInterval)
    }
  }, [showKnowledgeBase])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">AI Studio</h3>
        <p className="text-gray-600">Train AI on your brand, generate personalized campaigns</p>
      </div>

      {/* URL Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg p-4 border-2 border-[#007AFF] shadow-sm"
      >
        <div className="text-xs text-gray-600 mb-2">Enter Your Website URL</div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            disabled
            value="https://acmecorp.com"
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-[#007AFF] text-white rounded text-sm whitespace-nowrap font-medium hover:bg-[#0066DD] transition-colors"
          >
            Analyze
          </motion.button>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Analyzing your brand</span>
          <span className="text-sm text-[#007AFF] font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#007AFF] to-blue-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Processing Steps */}
      <div className="space-y-2">
        {processingSteps.map((step, i) => {
          const isComplete = i < completedSteps
          const isActive = i === completedSteps && completedSteps < processingSteps.length

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isComplete
                  ? "bg-green-50 border-green-200"
                  : isActive
                  ? "bg-white border-gray-300 shadow-sm"
                  : "bg-white border-gray-200"
              }`}
            >
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin flex-shrink-0"
                  />
                ) : (
                  <div key="pending" className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                )}
              </AnimatePresence>
              <span className={`text-sm ${isComplete ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                {step.label}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Knowledge Base */}
      <AnimatePresence>
        {showKnowledgeBase && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-900 font-medium">Brand Knowledge Base Created</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded p-3 border border-gray-200"
              >
                <div className="text-gray-600 mb-1">Voice & Tone</div>
                <div className="text-gray-900 font-medium">Professional, data-driven</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 rounded p-3 border border-gray-200"
              >
                <div className="text-gray-600 mb-1">Target Audience</div>
                <div className="text-gray-900 font-medium">B2B SaaS founders</div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Campaign */}
      <AnimatePresence>
        {streamedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-900 font-medium">Personalized Email Campaign</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded font-medium"
              >
                ✓ Ready
              </motion.span>
            </div>
            <div className="bg-gray-50 rounded p-3 border border-gray-200">
              <div className="text-xs text-gray-900 mb-2 font-medium">
                Subject: Quick question about Acme's growth
              </div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {streamedText}
                {streamedText.length < emailCopy.length && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-3 bg-[#007AFF] ml-0.5"
                  >
                    {" "}
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
