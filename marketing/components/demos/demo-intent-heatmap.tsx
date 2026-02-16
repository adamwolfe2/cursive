"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface IntentSignal {
  id: string
  city: string
  lat: number
  lng: number
  category: string
  intensity: number
}

const locations = [
  { city: "San Francisco", lat: 37.7749, lng: -122.4194, x: 15, y: 45 },
  { city: "New York", lat: 40.7128, lng: -74.0060, x: 85, y: 35 },
  { city: "Austin", lat: 30.2672, lng: -97.7431, x: 50, y: 70 },
  { city: "Seattle", lat: 47.6062, lng: -122.3321, x: 20, y: 20 },
  { city: "Boston", lat: 42.3601, lng: -71.0589, x: 88, y: 32 },
  { city: "Miami", lat: 25.7617, lng: -80.1918, x: 80, y: 85 },
  { city: "Denver", lat: 39.7392, lng: -104.9903, x: 40, y: 40 },
  { city: "Chicago", lat: 41.8781, lng: -87.6298, x: 65, y: 38 },
]

const categories = [
  "SaaS Tools", "Marketing Software", "CRM Platforms", "Sales Automation",
  "Analytics Tools", "Email Marketing", "Lead Generation", "Data Enrichment"
]

export function DemoIntentHeatmap() {
  const [signals, setSignals] = useState<IntentSignal[]>([])
  const [totalSignals, setTotalSignals] = useState(1247)
  const [activeCategories, setActiveCategories] = useState<string[]>([])

  // Add signals periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)]
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]

      const newSignal: IntentSignal = {
        id: `signal-${Date.now()}-${Math.random()}`,
        city: randomLocation.city,
        lat: randomLocation.lat,
        lng: randomLocation.lng,
        category: randomCategory,
        intensity: Math.random() * 100,
      }

      setSignals(prev => [...prev, newSignal].slice(-20)) // Keep last 20
      setTotalSignals(prev => prev + 1)

      // Add category to active list
      setActiveCategories(prev => {
        if (!prev.includes(randomCategory)) {
          return [...prev, randomCategory].slice(-4) // Keep last 4
        }
        return prev
      })

      // Remove signal after animation
      setTimeout(() => {
        setSignals(prev => prev.filter(s => s.id !== newSignal.id))
      }, 3000)
    }, 800) // New signal every 800ms

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-3">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-4 border border-gray-200"
        >
          <div className="text-xs text-gray-600 mb-1">Live Signals</div>
          <motion.div
            key={totalSignals}
            initial={{ color: "#007AFF" }}
            animate={{ color: "#111827" }}
            transition={{ duration: 0.4 }}
            className="text-2xl text-gray-900 font-light tabular-nums"
          >
            {totalSignals.toLocaleString()}
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-4 border border-gray-200"
        >
          <div className="text-xs text-gray-600 mb-1">Active Now</div>
          <div className="text-2xl text-gray-900 font-light">{signals.length}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-4 border border-gray-200"
        >
          <div className="text-xs text-gray-600 mb-1">Categories</div>
          <div className="text-2xl text-gray-900 font-light">{activeCategories.length}</div>
        </motion.div>
      </div>

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-gray-200 relative overflow-hidden"
        style={{ minHeight: "250px" }}
      >
        {/* Map Background */}
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="0" y="0" width="100" height="100" fill="#007AFF" opacity="0.1" />
            {/* Simplified US map outline */}
            <path
              d="M 10,30 L 15,25 L 20,20 L 30,18 L 40,20 L 50,25 L 60,22 L 70,25 L 80,30 L 85,40 L 88,50 L 85,60 L 80,70 L 70,75 L 60,72 L 50,75 L 40,78 L 30,75 L 20,70 L 15,60 L 12,50 L 10,40 Z"
              fill="none"
              stroke="#007AFF"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        {/* Location Markers */}
        {locations.map((location, i) => (
          <motion.div
            key={location.city}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="absolute"
            style={{ left: `${location.x}%`, top: `${location.y}%` }}
          >
            {/* Pulsing ring */}
            <motion.div
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="absolute w-8 h-8 -left-4 -top-4 rounded-full bg-[#007AFF] opacity-30"
            />
            {/* Center dot */}
            <motion.div
              whileHover={{ scale: 1.5 }}
              className="w-3 h-3 rounded-full bg-[#007AFF] shadow-lg cursor-pointer"
            />
          </motion.div>
        ))}

        {/* Active Signal Pulses */}
        <AnimatePresence>
          {signals.map((signal) => {
            const location = locations.find(l => l.city === signal.city)
            if (!location) return null

            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 2 }}
                transition={{ duration: 0.5 }}
                className="absolute pointer-events-none"
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
              >
                <motion.div
                  animate={{
                    scale: [1, 3],
                    opacity: [0.8, 0],
                  }}
                  transition={{ duration: 1.5 }}
                  className="w-6 h-6 -left-3 -top-3 rounded-full bg-blue-500 absolute"
                />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Floating Category Bubbles */}
        <div className="absolute top-4 right-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {activeCategories.map((category, i) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                layout
                className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-gray-700 border border-gray-200 shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                  />
                  {category}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Recent Signals List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
          <h4 className="text-sm text-gray-900 font-medium">Recent Signals</h4>
        </div>
        <div className="space-y-2 max-h-32 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {signals.slice(0, 4).map((signal, i) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3 }}
                layout
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-gray-600">
                  {signal.city} - <span className="text-gray-900">{signal.category}</span>
                </span>
                <span className="text-[#007AFF]">Just now</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
