"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface Email {
  id: string
  subject: string
  status: "sent" | "opened" | "replied"
  time: string
}

const emailSequence = [
  { subject: "Quick question about your sales process", status: "replied" as const, time: "2 days ago" },
  { subject: "Following up: Sales automation insights", status: "opened" as const, time: "1 day ago" },
  { subject: "Case study: 3x pipeline growth", status: "sent" as const, time: "2 hours ago" },
]

export function DemoLeadSequence() {
  const [activeStep, setActiveStep] = useState(0)
  const [emails, setEmails] = useState<Email[]>([])
  const [sendingEmail, setSendingEmail] = useState(false)

  // Simulate sending emails
  useEffect(() => {
    const sendInterval = setInterval(() => {
      if (emails.length < emailSequence.length) {
        setSendingEmail(true)
        setTimeout(() => {
          const nextEmail = emailSequence[emails.length]
          setEmails(prev => [...prev, { ...nextEmail, id: `email-${emails.length}` }])
          setSendingEmail(false)
        }, 1500)
      }
    }, 4000)

    return () => clearInterval(sendInterval)
  }, [emails])

  // Cycle active step
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4)
    }, 2000)

    return () => clearInterval(stepInterval)
  }, [])

  const steps = [
    { day: "Day 1", action: "Pixel Tracking", status: activeStep >= 0 ? "complete" : "pending" },
    { day: "Day 2", action: "Leads Enriched", status: activeStep >= 1 ? "complete" : "pending" },
    { day: "Day 3", action: "Email Campaign", status: activeStep >= 2 ? "active" : activeStep > 2 ? "complete" : "pending" },
    { day: "Day 5", action: "Follow-up", status: activeStep >= 3 ? "active" : "pending" },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Automated Lead Sequences</h3>
        <p className="text-gray-600">Multi-touch campaigns that convert on autopilot</p>
      </div>

      {/* Sequence Timeline */}
      <div className="relative">
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className={`bg-white border-2 rounded-lg p-4 min-w-[140px] text-center transition-all ${
                  step.status === "active"
                    ? "border-[#007AFF] shadow-md"
                    : step.status === "complete"
                    ? "border-green-300"
                    : "border-gray-200"
                }`}
              >
                <div className="text-xs text-gray-600 mb-1">{step.day}</div>
                <div className="text-sm text-gray-900 font-medium mb-2">{step.action}</div>
                <AnimatePresence mode="wait">
                  {step.status === "complete" ? (
                    <motion.div
                      key="complete"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded font-medium"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete
                    </motion.div>
                  ) : step.status === "active" ? (
                    <motion.div
                      key="active"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-[#007AFF] text-xs rounded font-medium"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-2.5 h-2.5 border-2 border-[#007AFF] border-t-transparent rounded-full"
                      />
                      Active
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pending"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      Pending
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              {i < steps.length - 1 && (
                <motion.svg
                  initial={{ opacity: 0 }}
                  animate={{ opacity: step.status !== "pending" ? 1 : 0.3 }}
                  className="w-5 h-5 text-[#007AFF] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </motion.svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Email Activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm text-gray-900 font-medium">Email Activity</h4>
          {sendingEmail && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs text-[#007AFF]"
            >
              <div className="w-3 h-3 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              Sending...
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {emails.map((email, i) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3 }}
                layout
                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 mb-1 truncate">{email.subject}</div>
                    <div className="text-xs text-gray-600">{email.time}</div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`px-2 py-1 text-xs rounded font-medium flex-shrink-0 ${
                      email.status === "replied"
                        ? "bg-green-50 text-green-700"
                        : email.status === "opened"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {email.status === "replied" ? "Replied" : email.status === "opened" ? "Opened" : "Sent"}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Performance Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="bg-white rounded-lg p-6 border border-gray-200"
      >
        <div className="text-sm text-gray-900 font-medium mb-4">Average Sequence Performance</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { value: 80, label: "Open Rate", suffix: "%" },
            { value: 42, label: "Reply Rate", suffix: "%" },
            { value: 8, label: "Booked", suffix: "%" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
            >
              <div className="text-3xl text-[#007AFF] mb-1 font-light">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
