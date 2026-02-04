"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

const testEmails = [
  { email: "sarah.j@acmecorp.com", score: 98, risk: "low" },
  { email: "john.doe@company.io", score: 85, risk: "medium" },
  { email: "noreply@service.com", score: 45, risk: "high" },
  { email: "mike@startup.ai", score: 92, risk: "low" },
]

interface ValidationCheck {
  id: string
  label: string
  status: "pending" | "checking" | "pass" | "warning" | "fail"
  message: string
  duration: number
}

const validationChecks: ValidationCheck[] = [
  { id: "syntax", label: "Syntax Valid", status: "pending", message: "Email format is correct", duration: 50 },
  { id: "domain", label: "Domain Exists", status: "pending", message: "Domain is registered and active", duration: 120 },
  { id: "mx", label: "MX Records Found", status: "pending", message: "Mail servers configured", duration: 200 },
  { id: "smtp", label: "SMTP Verified", status: "pending", message: "Mailbox exists and accepts mail", duration: 450 },
  { id: "disposable", label: "Not Disposable", status: "pending", message: "Not a temporary email service", duration: 300 },
  { id: "reputation", label: "Domain Reputation", status: "pending", message: "Good sender reputation", duration: 350 },
]

export function DemoEmailValidator() {
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0)
  const [inputEmail, setInputEmail] = useState("")
  const [checks, setChecks] = useState(validationChecks.map(c => ({ ...c })))
  const [score, setScore] = useState(0)
  const [isValidating, setIsValidating] = useState(false)

  // Type email and start validation cycle
  useEffect(() => {
    const startCycle = () => {
      const testEmail = testEmails[currentEmailIndex]
      setInputEmail("")
      setScore(0)
      setChecks(validationChecks.map(c => ({ ...c, status: "pending" as const })))
      setIsValidating(false)

      // Type out email
      const email = testEmail.email
      let charIndex = 0
      const typingInterval = setInterval(() => {
        if (charIndex < email.length) {
          setInputEmail(email.slice(0, charIndex + 1))
          charIndex++
        } else {
          clearInterval(typingInterval)
          // Start validation after typing
          setTimeout(() => startValidation(testEmail.score), 300)
        }
      }, 60)
    }

    const startValidation = (targetScore: number) => {
      setIsValidating(true)
      let accumulatedTime = 0

      validationChecks.forEach((check, index) => {
        setTimeout(() => {
          setChecks(prev => prev.map((c, i) =>
            i === index ? { ...c, status: "checking" as const } : c
          ))
        }, accumulatedTime)

        accumulatedTime += check.duration

        setTimeout(() => {
          const newStatus = index === 2 && targetScore < 50 ? "warning" : targetScore < 60 && index > 3 ? "warning" : "pass"
          setChecks(prev => prev.map((c, i) =>
            i === index ? { ...c, status: newStatus as const } : c
          ))

          // Update score progressively
          setScore(Math.round(((index + 1) / validationChecks.length) * targetScore))

          if (index === validationChecks.length - 1) {
            setTimeout(() => {
              setIsValidating(false)
            }, 1000)
          }
        }, accumulatedTime)
      })
    }

    startCycle()
    const cycleInterval = setInterval(() => {
      setCurrentEmailIndex(prev => (prev + 1) % testEmails.length)
    }, 9000)

    return () => {
      clearInterval(cycleInterval)
    }
  }, [currentEmailIndex])

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 70) return "Good"
    if (score >= 50) return "Fair"
    return "Poor"
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Email Deliverability Validator</h3>
        <p className="text-gray-600">Real-time verification with multi-step validation</p>
      </div>

      {/* Email Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-4 border-2 border-[#007AFF]"
      >
        <div className="text-xs text-gray-600 mb-2">Email Address to Validate</div>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-900 font-medium">
            {inputEmail}
            {inputEmail && inputEmail.length < testEmails[currentEmailIndex].email.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-[#007AFF] ml-0.5"
              />
            )}
          </span>
        </div>
      </motion.div>

      {/* Score Gauge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 text-center border border-gray-200"
      >
        <div className="text-sm text-gray-600 mb-4">Deliverability Score</div>
        <motion.div
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`text-6xl font-light mb-2 ${getScoreColor(score)}`}
        >
          {score}
          <span className="text-3xl">/100</span>
        </motion.div>
        <motion.div
          key={`${score}-label`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600"
        >
          {getScoreLabel(score)}
        </motion.div>

        {/* Circular Progress */}
        <div className="mt-6 relative w-32 h-32 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke={score >= 90 ? "#10B981" : score >= 70 ? "#F59E0B" : "#EF4444"}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ strokeDasharray: "352", strokeDashoffset: 0 }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Validation Checks */}
      <div className="space-y-2">
        {checks.map((check, index) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-lg p-4 border transition-all ${
              check.status === "pass"
                ? "border-green-300 bg-green-50/30"
                : check.status === "warning"
                ? "border-yellow-300 bg-yellow-50/30"
                : check.status === "checking"
                ? "border-[#007AFF] shadow-sm"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                <AnimatePresence mode="wait">
                  {check.status === "pass" ? (
                    <motion.div
                      key="pass"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : check.status === "warning" ? (
                    <motion.div
                      key="warning"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </motion.div>
                  ) : check.status === "checking" ? (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <div key="pending" className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </AnimatePresence>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-0.5">{check.label}</div>
                <AnimatePresence mode="wait">
                  {check.status === "checking" ? (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-[#007AFF]"
                    >
                      Checking...
                    </motion.div>
                  ) : check.status !== "pending" ? (
                    <motion.div
                      key="message"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-gray-600"
                    >
                      {check.message}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Risk Assessment */}
      <AnimatePresence>
        {!isValidating && score > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-lg p-4 border-2 ${
              score >= 90
                ? "bg-green-50 border-green-300"
                : score >= 70
                ? "bg-yellow-50 border-yellow-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                {score >= 90 ? "Safe to Send" : score >= 70 ? "Proceed with Caution" : "High Risk - Not Recommended"}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {score >= 90
                ? "This email is verified and has excellent deliverability."
                : score >= 70
                ? "Email is likely valid but may have some deliverability issues."
                : "High risk of bounce or spam. Consider finding an alternative contact."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
