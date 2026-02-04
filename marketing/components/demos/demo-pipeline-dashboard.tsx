"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface Stat {
  label: string
  value: number
  prefix?: string
  suffix?: string
  subtitle: string
  isGreen?: boolean
}

const statsData: Stat[] = [
  { label: "Emails Sent", value: 2847, prefix: "", suffix: "", subtitle: "Last 30 days" },
  { label: "Pipeline Value", value: 2.4, prefix: "$", suffix: "M", subtitle: "↑ 18%", isGreen: true },
  { label: "Open Rate", value: 67, prefix: "", suffix: "%", subtitle: "↑ +4.1%", isGreen: true },
  { label: "Active Responses", value: 341, prefix: "", suffix: "", subtitle: "12% reply rate" },
]

export function DemoPipelineDashboard() {
  const [animatedStats, setAnimatedStats] = useState(statsData.map(() => 0))

  // Animate number counters
  useEffect(() => {
    statsData.forEach((stat, index) => {
      let current = 0
      const increment = stat.value / 50
      const interval = setInterval(() => {
        current += increment
        if (current >= stat.value) {
          current = stat.value
          clearInterval(interval)
        }
        setAnimatedStats(prev => {
          const updated = [...prev]
          updated[index] = current
          return updated
        })
      }, 30)
    })
  }, [])

  const formatValue = (value: number, stat: Stat) => {
    if (stat.suffix === "M") {
      return value.toFixed(1)
    }
    if (stat.suffix === "%") {
      return Math.round(value)
    }
    return Math.round(value).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Pipeline Dashboard</h3>
        <p className="text-gray-600">Live email metrics and outbound performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsData.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="text-xs text-gray-600 mb-1">{stat.label}</div>
            <div className="text-2xl text-gray-900 font-light">
              {stat.prefix}
              {formatValue(animatedStats[i], stat)}
              {stat.suffix}
            </div>
            <div className={`text-xs mt-1 font-medium ${stat.isGreen ? 'text-green-600' : 'text-gray-600'}`}>
              {stat.subtitle}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lead Sources */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <div className="text-sm text-gray-900 font-medium mb-4">Top Lead Sources</div>
        <div className="space-y-3">
          {[
            { source: "Website", percent: 35, color: "#007AFF" },
            { source: "Pixel Tracking", percent: 28, color: "#10B981" },
            { source: "Organic Search", percent: 18, color: "#8B5CF6" },
            { source: "Email Campaigns", percent: 12, color: "#F59E0B" },
            { source: "Paid Ads", percent: 7, color: "#6B7280" },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-700">{item.source}</span>
                <span className="text-gray-900 font-medium">{item.percent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <div className="text-sm text-gray-900 font-medium mb-4">Outbound Activity (Last 7 Days)</div>
        <div className="flex items-end justify-between gap-2 h-32">
          {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.6, delay: 0.7 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.05, backgroundColor: "#007AFF" }}
              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:shadow-lg transition-all cursor-pointer"
              style={{ minWidth: "20px" }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </motion.div>
    </div>
  )
}
