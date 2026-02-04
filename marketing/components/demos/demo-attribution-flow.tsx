"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface Channel {
  id: string
  name: string
  icon: string
  visitors: number
  converted: number
  color: string
}

const channels: Channel[] = [
  { id: "website", name: "Website Visit", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9", visitors: 1000, converted: 350, color: "#007AFF" },
  { id: "email", name: "Email Campaign", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", visitors: 350, converted: 120, color: "#10B981" },
  { id: "directmail", name: "Direct Mail", icon: "M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76", visitors: 250, converted: 89, color: "#8B5CF6" },
  { id: "ads", name: "Retargeting Ads", icon: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122", visitors: 150, converted: 45, color: "#F59E0B" },
  { id: "phone", name: "Phone Call", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", visitors: 209, converted: 78, color: "#EF4444" },
]

export function DemoAttributionFlow() {
  const [activeFlow, setActiveFlow] = useState<string | null>(null)
  const [flowingParticles, setFlowingParticles] = useState<{ id: string; from: string; to: string }[]>([])

  // Create flowing particles
  useEffect(() => {
    const interval = setInterval(() => {
      const randomChannel = channels[Math.floor(Math.random() * channels.length)]
      const nextChannel = channels[(channels.findIndex(c => c.id === randomChannel.id) + 1) % channels.length]

      const particle = {
        id: `particle-${Date.now()}`,
        from: randomChannel.id,
        to: nextChannel.id,
      }

      setFlowingParticles(prev => [...prev, particle])

      // Remove particle after animation
      setTimeout(() => {
        setFlowingParticles(prev => prev.filter(p => p.id !== particle.id))
      }, 2000)
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  const totalVisitors = channels.reduce((sum, c) => sum + c.visitors, 0)
  const totalConverted = channels.reduce((sum, c) => sum + c.converted, 0)
  const conversionRate = Math.round((totalConverted / totalVisitors) * 100)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Multi-Channel Attribution</h3>
        <p className="text-gray-600">Visualize touchpoints and conversion paths</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-4 border border-gray-200 text-center"
        >
          <div className="text-2xl text-gray-900 font-light mb-1">{totalVisitors}</div>
          <div className="text-xs text-gray-600">Total Touchpoints</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-4 border border-gray-200 text-center"
        >
          <div className="text-2xl text-green-600 font-light mb-1">{totalConverted}</div>
          <div className="text-xs text-gray-600">Conversions</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-4 border border-gray-200 text-center"
        >
          <div className="text-2xl text-[#007AFF] font-light mb-1">{conversionRate}%</div>
          <div className="text-xs text-gray-600">Conversion Rate</div>
        </motion.div>
      </div>

      {/* Flow Visualization */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-200 relative overflow-hidden"
        style={{ minHeight: "400px" }}
      >
        <div className="flex items-center justify-between h-full">
          {/* Source Channels (Left) */}
          <div className="flex-1 space-y-4">
            <div className="text-xs text-gray-600 mb-4 font-medium">Traffic Sources</div>
            {channels.map((channel, index) => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveFlow(channel.id)}
                onMouseLeave={() => setActiveFlow(null)}
                className="relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05, x: 5 }}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: channel.color,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" style={{ color: channel.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={channel.icon} />
                    </svg>
                    <span className="text-xs font-medium text-gray-900">{channel.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{channel.visitors} visitors</span>
                    <span className="text-green-600 font-medium">{channel.converted} converted</span>
                  </div>
                </motion.div>

                {/* Flow Lines */}
                {activeFlow === channel.id && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute top-1/2 left-full w-32 h-0.5 origin-left"
                    style={{ backgroundColor: channel.color }}
                  >
                    {/* Flowing particles */}
                    <motion.div
                      animate={{ x: [0, 128] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full absolute top-1/2 -translate-y-1/2"
                      style={{ backgroundColor: channel.color }}
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Center Funnel */}
          <div className="flex-shrink-0 mx-8">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <div className="w-32 h-64 relative">
                {/* Funnel shape */}
                <svg viewBox="0 0 100 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#007AFF" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#007AFF" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10 20 L 90 20 L 70 100 L 30 100 Z M 30 100 L 70 100 L 60 180 L 40 180 Z"
                    fill="url(#funnelGradient)"
                    stroke="#007AFF"
                    strokeWidth="2"
                  />
                </svg>

                {/* Funnel labels */}
                <div className="absolute top-8 left-0 right-0 text-center">
                  <div className="text-lg font-light text-gray-900">{totalVisitors}</div>
                  <div className="text-xs text-gray-600">Leads</div>
                </div>
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <div className="text-lg font-light text-green-600">{totalConverted}</div>
                  <div className="text-xs text-gray-600">Customers</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Conversion Outcomes (Right) */}
          <div className="flex-1 space-y-4">
            <div className="text-xs text-gray-600 mb-4 font-medium text-right">Outcomes</div>
            {[
              { label: "Demo Booked", value: 145, color: "#10B981" },
              { label: "Trial Started", value: 98, color: "#8B5CF6" },
              { label: "Purchased", value: 67, color: "#F59E0B" },
              { label: "Enterprise Deal", value: 22, color: "#EF4444" },
            ].map((outcome, index) => (
              <motion.div
                key={outcome.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, x: -5 }}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                  style={{
                    borderRightWidth: "4px",
                    borderRightColor: outcome.color,
                  }}
                >
                  <div className="text-xs font-medium text-gray-900 mb-2">{outcome.label}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-light" style={{ color: outcome.color }}>
                      {outcome.value}
                    </div>
                    <div className="text-xs text-gray-600">
                      {Math.round((outcome.value / totalVisitors) * 100)}% rate
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Animated particles */}
        <AnimatePresence>
          {flowingParticles.map(particle => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], x: [0, 200] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute w-2 h-2 rounded-full bg-[#007AFF] pointer-events-none"
              style={{ top: "50%", left: "20%" }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Best Performing Path */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300"
      >
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-sm font-medium text-gray-900">Best Performing Path</span>
        </div>
        <div className="text-xs text-gray-600">
          Website Visit → Email Campaign → Demo Booked (34% conversion rate)
        </div>
      </motion.div>
    </div>
  )
}
