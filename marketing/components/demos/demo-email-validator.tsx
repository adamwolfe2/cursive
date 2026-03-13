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
  const [, setIsValidating] = useState(false)

  // Type email and start validation cycle
  useEffect(() => {
    const startCycle = () => {
      const testEmail = testEmails[currentEmailIndex]
      setInputEmail("")
      setScore(0)
      setChecks(validationChecks.map(c => ({ ...c, status: "pending" as ValidationCheck["status"] })))
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
            i === index ? { ...c, status: "checking" as ValidationCheck["status"] } : c
          ))
        }, accumulatedTime)

        accumulatedTime += check.duration

        setTimeout(() => {
          const newStatus: ValidationCheck["status"] = index === 2 && targetScore < 50 ? "warning" : targetScore < 60 && index > 3 ? "warning" : "pass"
          setChecks(prev => prev.map((c, i) =>
            i === index ? { ...c, status: newStatus } : c
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
    <div className="space-y-2">
      {/* Email Input + Score */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-2.5 border-2 border-primary col-span-2"
        >
          <div className="text-[10px] text-gray-600 mb-1">Email to Validate</div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-900 font-medium truncate">
              {inputEmail}
              {inputEmail && inputEmail.length < testEmails[currentEmailIndex].email.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-3 bg-primary ml-0.5"
                />
              )}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-2.5 text-center border border-gray-200 flex flex-col justify-center"
        >
          <motion.div
            key={score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-light ${getScoreColor(score)}`}
          >
            {score}<span className="text-sm">/100</span>
          </motion.div>
          <div className="text-[10px] text-gray-600">{getScoreLabel(score)}</div>
        </motion.div>
      </div>

      {/* Validation Checks */}
      <div className="space-y-1">
        {checks.map((check, index) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-md p-2 border transition-all ${
              check.status === "pass"
                ? "border-blue-300 bg-blue-50/30"
                : check.status === "warning"
                ? "border-gray-300 bg-gray-50/30"
                : check.status === "checking"
                ? "border-primary shadow-sm"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                <AnimatePresence mode="wait">
                  {check.status === "pass" ? (
                    <motion.div
                      key="pass"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                    >
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : check.status === "warning" ? (
                    <motion.div
                      key="warning"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center"
                    >
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                    </motion.div>
                  ) : check.status === "checking" ? (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <div key="pending" className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                </AnimatePresence>
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900">{check.label}</span>
                {check.status === "checking" && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-primary">Checking...</motion.span>
                )}
                {(check.status === "pass" || check.status === "warning") && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-gray-500 truncate ml-2">{check.message}</motion.span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
