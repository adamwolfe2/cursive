"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Code, Users, Target, Send, Check, Eye, Mail, MessageSquare, ArrowRight, TrendingUp, BarChart3 } from "lucide-react"
import Image from "next/image"

interface DemoStep {
  id: number
  title: string
  description: string
  component: React.ComponentType
}

// Step 1: Install Tracking Pixel Demo - Simple & Fast
function TrackingPixelDemo() {
  const [showCode, setShowCode] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowCode(true), 300)
    const timer2 = setTimeout(() => setInstalling(true), 1200)
    const timer3 = setTimeout(() => setInstalled(true), 2000)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-br from-white to-gray-50 rounded-3xl overflow-hidden border border-gray-200 shadow-xl p-12">
      {/* Code Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e1e1e] rounded-2xl shadow-2xl max-w-2xl mx-auto overflow-hidden"
      >
        {/* Editor Header */}
        <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28ca42]" />
          </div>
          <div className="text-xs text-gray-400">index.html</div>
        </div>

        {/* Code Content */}
        <div className="p-6 font-mono text-sm">
          <div className="text-gray-500 mb-4">&lt;head&gt;</div>

          <AnimatePresence>
            {showCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="ml-4 space-y-2"
              >
                <div className="text-gray-400">&lt;!-- Cursive Tracking Pixel --&gt;</div>
                <div className="text-blue-400">&lt;script </div>
                <div className="ml-4 text-green-400">src=&quot;https://cursive.com/pixel.js&quot;</div>
                <div className="ml-4 text-purple-400">data-id=&quot;YOUR_ID&quot;</div>
                <div className="text-blue-400">&gt;&lt;/script&gt;</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-gray-500 mt-4">&lt;/head&gt;</div>
        </div>

        {/* Installation Status */}
        <AnimatePresence>
          {installing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <div className={`px-6 py-3 rounded-full shadow-xl flex items-center gap-3 ${
                installed ? 'bg-green-500' : 'bg-[#007AFF]'
              } text-white`}>
                {installed ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Installed! Tracking 47 visitors</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Installing...</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Visitor Icons */}
      {installed && (
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: Math.random() * 800,
                y: Math.random() * 400,
              }}
              transition={{
                delay: i * 0.2,
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="absolute"
            >
              <Eye className="w-6 h-6 text-[#007AFF]" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Step 2: Visitor Identification Demo - Hub and Spoke Style
function VisitorIdentificationDemo() {
  const [activeConnections, setActiveConnections] = useState<number[]>([])
  const [showMetrics, setShowMetrics] = useState(false)

  const integrations = [
    { id: 1, name: "Salesforce", color: "#00A1E0", icon: "🔵" },
    { id: 2, name: "HubSpot", color: "#FF7A59", icon: "🟠" },
    { id: 3, name: "LinkedIn", color: "#0077B5", icon: "🔷" },
    { id: 4, name: "Google", color: "#4285F4", icon: "🔴" },
    { id: 5, name: "Facebook", color: "#1877F2", icon: "🔵" },
    { id: 6, name: "Slack", color: "#4A154B", icon: "🟣" },
  ]

  useEffect(() => {
    const timer1 = setInterval(() => {
      setActiveConnections(prev => {
        if (prev.length >= integrations.length) return prev
        return [...prev, prev.length]
      })
    }, 600)

    const timer2 = setTimeout(() => setShowMetrics(true), 2000)

    return () => {
      clearInterval(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="relative w-full h-[500px] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xl p-12">
      {/* Central Cursive Logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center z-20 border border-gray-200"
      >
        <div className="font-cursive text-2xl text-gray-900">C</div>
      </motion.div>

      {/* Integration Logos in Hub-and-Spoke */}
      {integrations.map((integration, i) => {
        const angle = (i * 60) - 30
        const radius = 180
        const x = Math.cos((angle * Math.PI) / 180) * radius
        const y = Math.sin((angle * Math.PI) / 180) * radius
        const isActive = activeConnections.includes(i)

        return (
          <div key={integration.id}>
            {/* Connection Line */}
            {isActive && (
              <motion.svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                width="400"
                height="400"
                style={{ zIndex: 5 }}
              >
                <motion.line
                  x1="200"
                  y1="200"
                  x2={200 + x}
                  y2={200 + y}
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Animated dot along line */}
                <motion.circle
                  r="4"
                  fill="#007AFF"
                  initial={{ cx: 200, cy: 200 }}
                  animate={{
                    cx: [200, 200 + x, 200],
                    cy: [200, 200 + y, 200],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.svg>
            )}

            {/* Integration Icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isActive ? 1 : 0.8,
                opacity: isActive ? 1 : 0.3,
                x: `calc(50% + ${x}px)`,
                y: `calc(50% + ${y}px)`,
              }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ zIndex: 10 }}
            >
              <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-200">
                <span className="text-2xl">{integration.icon}</span>
              </div>
              <div className="text-xs text-gray-600 text-center mt-2 font-medium">
                {integration.name}
              </div>
            </motion.div>
          </div>
        )
      })}

      {/* Data Cards Below */}
      {showMetrics && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg px-6 py-4 border border-gray-200"
          >
            <div className="text-3xl font-bold text-gray-900">70%</div>
            <div className="text-sm text-gray-600">Identified</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg px-6 py-4 border border-gray-200"
          >
            <div className="text-sm font-medium text-gray-600 mb-1">Anonymous → Known</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-gray-300 rounded-full" />
              <ArrowRight className="w-4 h-4 text-green-500" />
              <div className="w-8 h-2 bg-green-500 rounded-full" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg px-6 py-4 border border-gray-200"
          >
            <div className="text-3xl font-bold text-gray-900">2,847</div>
            <div className="text-sm text-gray-600">Contacts</div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Step 3: Audience Building Demo - Multi-line Chart
function AudienceBuilderDemo() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)

  const segments = [
    { name: "Technology Companies", percentage: 56.3, color: "#E74C3C", data: [0, 15, 28, 35, 42, 48, 52, 56.3] },
    { name: "Intent Signals", percentage: 44.2, color: "#27AE60", data: [0, 10, 22, 30, 35, 38, 41, 44.2] },
    { name: "Enterprise", percentage: 38.7, color: "#F39C12", data: [0, 8, 18, 25, 30, 33, 36, 38.7] },
  ]

  const xLabels = ["Jan 1", "Jan 8", "Jan 15", "Jan 22", "Jan 29", "Feb 5", "Feb 12", "Feb 19"]

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationProgress(prev => {
        if (prev >= 100) return 100
        return prev + 2
      })
    }, 30)

    return () => clearInterval(timer)
  }, [])

  const chartWidth = 700
  const chartHeight = 300
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const getX = (index: number) => padding.left + (index / (xLabels.length - 1)) * innerWidth
  const getY = (value: number) => padding.top + innerHeight - (value / 100) * innerHeight

  const createPath = (data: number[]) => {
    const progress = animationProgress / 100
    const visiblePoints = Math.floor(data.length * progress)

    return data
      .slice(0, Math.max(visiblePoints, 1))
      .map((value, index) => {
        const x = getX(index)
        const y = getY(value)
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      })
      .join(" ")
  }

  return (
    <div className="relative w-full h-[500px] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xl p-8">
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-900 mb-2">Audience Growth</h3>
        <p className="text-sm text-gray-600">Tracked audience segments over time</p>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-6">
        {segments.map((segment, i) => (
          <motion.div
            key={segment.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-gray-700">
              {segment.name} <span className="font-semibold">{segment.percentage}%</span>
            </span>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <svg width={chartWidth} height={chartHeight} className="mx-auto">
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={getY(value)}
              x2={chartWidth - padding.right}
              y2={getY(value)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={getY(value) + 4}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {value}%
            </text>
          </g>
        ))}

        {/* X-axis Labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={getX(i)}
            y={chartHeight - padding.bottom + 20}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {label}
          </text>
        ))}

        {/* Lines */}
        {segments.map((segment, i) => (
          <motion.g
            key={segment.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.2 }}
          >
            <path
              d={createPath(segment.data)}
              fill="none"
              stroke={segment.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data Points */}
            {segment.data.map((value, pointIndex) => {
              const progress = animationProgress / 100
              const visiblePoints = Math.floor(segment.data.length * progress)
              if (pointIndex >= visiblePoints) return null

              return (
                <circle
                  key={pointIndex}
                  cx={getX(pointIndex)}
                  cy={getY(value)}
                  r="4"
                  fill="white"
                  stroke={segment.color}
                  strokeWidth="2"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pointIndex)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              )
            })}
          </motion.g>
        ))}

        {/* Tooltip */}
        {hoveredPoint !== null && (
          <g>
            {segments.map((segment, i) => {
              const x = getX(hoveredPoint)
              const y = getY(segment.data[hoveredPoint])

              return (
                <g key={segment.name}>
                  <rect
                    x={x + 10}
                    y={y - 15 - i * 25}
                    width="120"
                    height="20"
                    rx="4"
                    fill="white"
                    stroke={segment.color}
                    strokeWidth="1"
                  />
                  <text
                    x={x + 15}
                    y={y - 3 - i * 25}
                    className="text-xs fill-gray-900 font-medium"
                  >
                    {segment.name}: {segment.data[hoveredPoint]}%
                  </text>
                </g>
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}

// Step 4: Multi-Channel Campaigns Demo - Clean Hub and Spoke
function CampaignDemo() {
  const [activeChannels, setActiveChannels] = useState<number[]>([])
  const [showMetrics, setShowMetrics] = useState<{ [key: number]: boolean }>({})

  const channels = [
    { id: 0, label: "Email", icon: "📧", metric: "42% open rate" },
    { id: 1, label: "LinkedIn", icon: "💼", metric: "18% reply rate" },
    { id: 2, label: "Direct Mail", icon: "📬", metric: "8% response" },
    { id: 3, label: "SMS", icon: "💬", metric: "65% read rate" },
  ]

  useEffect(() => {
    const timer1 = setInterval(() => {
      setActiveChannels(prev => {
        if (prev.length >= channels.length) return prev
        return [...prev, prev.length]
      })
    }, 800)

    const timer2 = setInterval(() => {
      activeChannels.forEach((channelId, index) => {
        setTimeout(() => {
          setShowMetrics(prev => ({ ...prev, [channelId]: true }))
        }, index * 300)
      })
    }, 2000)

    return () => {
      clearInterval(timer1)
      clearInterval(timer2)
    }
  }, [activeChannels])

  return (
    <div className="relative w-full h-[500px] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xl p-12">
      {/* Central Cursive Logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center z-20 border border-gray-200"
      >
        <div className="font-cursive text-2xl text-gray-900">C</div>
      </motion.div>

      {/* Channel Cards in Hub-and-Spoke */}
      {channels.map((channel, i) => {
        const angle = (i * 90) - 45
        const radius = 160
        const x = Math.cos((angle * Math.PI) / 180) * radius
        const y = Math.sin((angle * Math.PI) / 180) * radius
        const isActive = activeChannels.includes(i)

        return (
          <div key={channel.id}>
            {/* Connection Line with animated particles */}
            {isActive && (
              <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                width="400"
                height="400"
                style={{ zIndex: 5 }}
              >
                <motion.line
                  x1="200"
                  y1="200"
                  x2={200 + x}
                  y2={200 + y}
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Animated particles flowing from center to channel */}
                {[...Array(3)].map((_, particleIndex) => (
                  <motion.circle
                    key={particleIndex}
                    r="3"
                    fill="#007AFF"
                    initial={{ cx: 200, cy: 200 }}
                    animate={{
                      cx: [200, 200 + x],
                      cy: [200, 200 + y],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: particleIndex * 0.5,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </svg>
            )}

            {/* Channel Icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isActive ? 1 : 0.8,
                opacity: isActive ? 1 : 0.3,
                x: `calc(50% + ${x}px)`,
                y: `calc(50% + ${y}px)`,
              }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ zIndex: 10 }}
            >
              <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center border border-gray-200">
                <span className="text-3xl mb-1">{channel.icon}</span>
                <div className="text-xs text-gray-600 font-medium">{channel.label}</div>
              </div>

              {/* Success Metric */}
              {showMetrics[i] && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -50, scale: 1 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                    {channel.metric}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )
      })}

      {/* Title */}
      <div className="absolute top-6 left-6">
        <h3 className="text-xl font-medium text-gray-900">Multi-Channel Activation</h3>
        <p className="text-sm text-gray-600 mt-1">Automated campaigns across all channels</p>
      </div>
    </div>
  )
}

export function HowItWorksInteractiveDemo() {
  const [activeStep, setActiveStep] = useState(0)

  const steps: DemoStep[] = [
    {
      id: 1,
      title: "Install Tracking Pixel",
      description: "Add one line of code. Takes 5 minutes. Works with any platform.",
      component: TrackingPixelDemo,
    },
    {
      id: 2,
      title: "Identify Visitors",
      description: "Cursive automatically reveals company names and contact information.",
      component: VisitorIdentificationDemo,
    },
    {
      id: 3,
      title: "Build Your Audience",
      description: "Filter by industry, intent signals, company size, and more.",
      component: AudienceBuilderDemo,
    },
    {
      id: 4,
      title: "Launch Campaigns",
      description: "Activate across email, LinkedIn, and direct mail in one click.",
      component: CampaignDemo,
    },
  ]

  const ActiveComponent = steps[activeStep].component

  return (
    <div className="space-y-8">
      {/* Step Navigation */}
      <div className="flex justify-center gap-4">
        {steps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(i)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeStep === i
                ? 'bg-[#007AFF] text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#007AFF]'
            }`}
          >
            <div className="text-sm opacity-70 mb-1">Step {step.id}</div>
            <div>{step.title}</div>
          </button>
        ))}
      </div>

      {/* Active Demo */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Description */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-lg text-gray-600">{steps[activeStep].description}</p>
      </div>
    </div>
  )
}
