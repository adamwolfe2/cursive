"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface Visitor {
  id: string
  name: string
  email: string
  phone: string
  location: string
  page: string
  enrichmentStep: number
}

const visitorPool = [
  { name: "Sarah Johnson", email: "sarah.j@acmecorp.com", phone: "(555) 234-5678", location: "San Francisco, CA", page: "/pricing" },
  { name: "Mike Chen", email: "m.chen@techstart.io", phone: "(555) 789-0123", location: "New York, NY", page: "/features" },
  { name: "Emily Rodriguez", email: "emily@saasco.com", phone: "(555) 456-7890", location: "Austin, TX", page: "/demo" },
  { name: "David Park", email: "d.park@innovate.co", phone: "(555) 321-9876", location: "Seattle, WA", page: "/platform" },
  { name: "Jessica Martinez", email: "jess@growth.io", phone: "(555) 654-3210", location: "Miami, FL", page: "/contact" },
  { name: "Tom Anderson", email: "tom.a@scale.ai", phone: "(555) 987-6543", location: "Boston, MA", page: "/about" },
]

export function DemoVisitorTracking() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [totalToday, setTotalToday] = useState(124)
  const [liveCount, setLiveCount] = useState(3)

  // Add new visitors periodically
  useEffect(() => {
    // Start with 3 visitors
    const initialVisitors = visitorPool.slice(0, 3).map((v, i) => ({
      ...v,
      id: `initial-${i}`,
      enrichmentStep: 4, // Fully enriched
    }))
    setVisitors(initialVisitors)

    const interval = setInterval(() => {
      const randomVisitor = visitorPool[Math.floor(Math.random() * visitorPool.length)]
      const newVisitor: Visitor = {
        ...randomVisitor,
        id: `visitor-${Date.now()}`,
        enrichmentStep: 0,
      }

      setVisitors(prev => {
        const updated = [newVisitor, ...prev].slice(0, 5) // Keep max 5 visitors
        return updated
      })

      setTotalToday(prev => prev + 1)
      setLiveCount(prev => Math.min(prev + 1, 8))
    }, 4000) // New visitor every 4 seconds

    return () => clearInterval(interval)
  }, [])

  // Animate enrichment for new visitors
  useEffect(() => {
    const enrichmentInterval = setInterval(() => {
      setVisitors(prev =>
        prev.map(visitor =>
          visitor.enrichmentStep < 4
            ? { ...visitor, enrichmentStep: visitor.enrichmentStep + 1 }
            : visitor
        )
      )
    }, 500) // Enrich one field every 500ms

    return () => clearInterval(enrichmentInterval)
  }, [])

  // Animate stat counters
  useEffect(() => {
    const statInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setLiveCount(prev => Math.max(3, Math.min(10, prev + (Math.random() > 0.5 ? 1 : -1))))
      }
    }, 3000)

    return () => clearInterval(statInterval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Visitor Tracking</h3>
        <p className="text-gray-600">Install pixel, identify visitors, capture leads in real-time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <motion.div
            key={totalToday}
            initial={{ scale: 1.2, color: "#007AFF" }}
            animate={{ scale: 1, color: "#111827" }}
            transition={{ duration: 0.3 }}
            className="text-3xl text-gray-900 mb-1 font-light"
          >
            {totalToday}
          </motion.div>
          <div className="text-sm text-gray-600">Visitors Identified Today</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <motion.div
            key={liveCount}
            initial={{ scale: 1.2, color: "#10B981" }}
            animate={{ scale: 1, color: "#111827" }}
            transition={{ duration: 0.3 }}
            className="text-3xl text-gray-900 mb-1 font-light"
          >
            {liveCount}
          </motion.div>
          <div className="text-sm text-gray-600">Live Visitors Now</div>
        </motion.div>
      </div>

      {/* Live Visitors Stream */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
          <h4 className="text-gray-900 font-medium">Live Visitors on Your Site</h4>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visitors.map((visitor, i) => (
              <motion.div
                key={visitor.id}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, x: -100, height: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                layout
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: visitor.enrichmentStep >= 1 ? 1 : 0.3 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-900 font-medium mb-1"
                    >
                      {visitor.enrichmentStep >= 1 ? visitor.name : "Identifying..."}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: visitor.enrichmentStep >= 2 ? 1 : 0.3 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-gray-600"
                    >
                      {visitor.enrichmentStep >= 2 ? visitor.location : "Loading location..."}
                    </motion.div>
                  </div>
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-1.5 flex-shrink-0"
                  >
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-green-500 rounded-full"
                    />
                    Live
                  </motion.span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: visitor.enrichmentStep >= 3 ? 1 : 0.3, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-gray-600 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {visitor.enrichmentStep >= 3 ? visitor.email : "Enriching email..."}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: visitor.enrichmentStep >= 4 ? 1 : 0.3, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-gray-600 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {visitor.enrichmentStep >= 4 ? visitor.phone : "Finding phone..."}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: visitor.enrichmentStep >= 2 ? 1 : 0.3 }}
                    transition={{ duration: 0.3 }}
                    className="text-[#007AFF] flex items-center gap-2 mt-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Viewing: {visitor.enrichmentStep >= 2 ? visitor.page : "..."}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
