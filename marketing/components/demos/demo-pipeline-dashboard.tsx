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

  // Animate number counters - consolidated single interval
  useEffect(() => {
    const targetValues = statsData.map(stat => stat.value)
    const currentValues = [0, 0, 0, 0]
    const increments = statsData.map(stat => stat.value / 50)
    let completedCount = 0

    const interval = setInterval(() => {
      let hasUpdate = false

      // Update all stats in a single batch
      const newValues = currentValues.map((current, index) => {
        if (current >= targetValues[index]) {
          return targetValues[index]
        }
        hasUpdate = true
        const newValue = current + increments[index]
        return newValue >= targetValues[index] ? targetValues[index] : newValue
      })

      // Track which animations completed
      newValues.forEach((val, idx) => {
        if (val >= targetValues[idx] && currentValues[idx] < targetValues[idx]) {
          completedCount++
        }
        currentValues[idx] = val
      })

      setAnimatedStats([...newValues])

      // Clear interval when all animations complete
      if (completedCount >= statsData.length) {
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
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
    <div className="space-y-2">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {statsData.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-white rounded-lg p-2 border border-gray-200"
          >
            <div className="text-[10px] text-gray-600">{stat.label}</div>
            <div className="text-lg text-gray-900 font-light">
              {stat.prefix}
              {formatValue(animatedStats[i], stat)}
              {stat.suffix}
            </div>
            <div className={`text-[10px] font-medium ${stat.isGreen ? 'text-green-600' : 'text-gray-600'}`}>
              {stat.subtitle}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lead Sources + Activity Chart side by side */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg p-2.5 border border-gray-200"
        >
          <div className="text-[10px] text-gray-900 font-medium mb-2">Top Sources</div>
          <div className="space-y-1.5">
            {[
              { source: "Website", percent: 35, color: "#007AFF" },
              { source: "Pixel", percent: 28, color: "#10B981" },
              { source: "Organic", percent: 18, color: "#8B5CF6" },
              { source: "Email", percent: 12, color: "#F59E0B" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-gray-600">{item.source}</span>
                  <span className="text-gray-900 font-medium">{item.percent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white rounded-lg p-2.5 border border-gray-200"
        >
          <div className="text-[10px] text-gray-900 font-medium mb-2">7-Day Activity</div>
          <div className="flex items-end justify-between gap-1 h-14">
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.6, delay: 0.7 + i * 0.08 }}
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[8px] text-gray-500">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
