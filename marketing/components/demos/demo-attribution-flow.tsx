"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"

interface Touchpoint {
  channel: string
  label: string
  color: string
}

interface Journey {
  name: string
  title: string
  company: string
  outcome: string
  outcomeColor: string
  touchpoints: Touchpoint[]
}

const journeys: Journey[] = [
  {
    name: "Sarah Johnson",
    title: "VP Marketing",
    company: "Datadog",
    outcome: "Demo Booked",
    outcomeColor: "#10B981",
    touchpoints: [
      { channel: "ad", label: "Google Ad", color: "#4285F4" },
      { channel: "web", label: "Blog Post", color: "#007AFF" },
      { channel: "email", label: "Email Open", color: "#10B981" },
      { channel: "web", label: "Pricing Page", color: "#007AFF" },
      { channel: "call", label: "Demo Call", color: "#8B5CF6" },
    ],
  },
  {
    name: "Marcus Rivera",
    title: "Head of Growth",
    company: "Snowflake",
    outcome: "Enterprise Deal",
    outcomeColor: "#F59E0B",
    touchpoints: [
      { channel: "web", label: "Homepage", color: "#007AFF" },
      { channel: "mail", label: "Direct Mail", color: "#EF4444" },
      { channel: "ad", label: "LinkedIn Ad", color: "#0A66C2" },
      { channel: "email", label: "Case Study", color: "#10B981" },
      { channel: "web", label: "ROI Calc", color: "#007AFF" },
      { channel: "call", label: "Strategy Call", color: "#8B5CF6" },
    ],
  },
  {
    name: "Priya Patel",
    title: "Director Sales",
    company: "Monday.com",
    outcome: "Trial Started",
    outcomeColor: "#8B5CF6",
    touchpoints: [
      { channel: "ad", label: "Meta Ad", color: "#1877F2" },
      { channel: "web", label: "Features Page", color: "#007AFF" },
      { channel: "email", label: "Welcome Email", color: "#10B981" },
      { channel: "web", label: "Marketplace", color: "#007AFF" },
    ],
  },
  {
    name: "James Liu",
    title: "CRO",
    company: "Klaviyo",
    outcome: "Purchased",
    outcomeColor: "#10B981",
    touchpoints: [
      { channel: "web", label: "Referral Link", color: "#007AFF" },
      { channel: "email", label: "Nurture Email", color: "#10B981" },
      { channel: "mail", label: "Postcard", color: "#EF4444" },
      { channel: "web", label: "Pricing Page", color: "#007AFF" },
      { channel: "ad", label: "Retarget Ad", color: "#F59E0B" },
    ],
  },
  {
    name: "Amanda Foster",
    title: "VP Operations",
    company: "HubSpot",
    outcome: "Demo Booked",
    outcomeColor: "#10B981",
    touchpoints: [
      { channel: "ad", label: "Google Ad", color: "#4285F4" },
      { channel: "web", label: "Case Studies", color: "#007AFF" },
      { channel: "email", label: "Email Series", color: "#10B981" },
      { channel: "call", label: "Intro Call", color: "#8B5CF6" },
    ],
  },
]

interface ChannelData {
  name: string
  pct: number
  color: string
}

const channelAttribution: ChannelData[] = [
  { name: "Website", pct: 34, color: "#007AFF" },
  { name: "Email", pct: 26, color: "#10B981" },
  { name: "Paid Ads", pct: 22, color: "#F59E0B" },
  { name: "Direct Mail", pct: 11, color: "#EF4444" },
  { name: "Phone", pct: 7, color: "#8B5CF6" },
]

export function DemoAttributionFlow() {
  const [journeyIndex, setJourneyIndex] = useState(0)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [touchpoints, setTouchpoints] = useState(1847)
  const [conversions, setConversions] = useState(312)
  const tickRef = useRef(0)

  const journey = journeys[journeyIndex]

  // Cycle through journeys
  useEffect(() => {
    setVisibleSteps(0)

    // Reveal touchpoints one at a time
    const stepTimers: ReturnType<typeof setTimeout>[] = []
    journey.touchpoints.forEach((_, i) => {
      stepTimers.push(
        setTimeout(() => setVisibleSteps(i + 1), 400 + i * 500)
      )
    })

    // Move to next journey
    const nextTimer = setTimeout(() => {
      setJourneyIndex(prev => (prev + 1) % journeys.length)
    }, 400 + journey.touchpoints.length * 500 + 2000)

    return () => {
      stepTimers.forEach(clearTimeout)
      clearTimeout(nextTimer)
    }
  }, [journeyIndex, journey.touchpoints])

  // Tick up stats
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++
      if (tickRef.current % 3 === 0) setTouchpoints(prev => prev + Math.floor(Math.random() * 3) + 1)
      if (tickRef.current % 5 === 0) setConversions(prev => prev + 1)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const rate = Math.round((conversions / touchpoints) * 100)

  return (
    <div className="space-y-2">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-2 border border-gray-200 text-center"
        >
          <motion.div key={touchpoints} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-lg text-gray-900 font-light">
            {touchpoints.toLocaleString()}
          </motion.div>
          <div className="text-[10px] text-gray-600">Touchpoints</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-2 border border-gray-200 text-center"
        >
          <motion.div key={conversions} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-lg text-green-600 font-light">
            {conversions}
          </motion.div>
          <div className="text-[10px] text-gray-600">Conversions</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-2 border border-gray-200 text-center"
        >
          <div className="text-lg text-primary font-light">{rate}%</div>
          <div className="text-[10px] text-gray-600">Conv. Rate</div>
        </motion.div>
      </div>

      {/* Live Journey */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] text-gray-500 font-medium">CUSTOMER JOURNEY</h4>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={journeyIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Person info */}
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-xs font-medium text-gray-900">{journey.name}</span>
                <span className="text-[10px] text-gray-500 ml-1.5">{journey.title} · {journey.company}</span>
              </div>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ color: journey.outcomeColor, backgroundColor: `${journey.outcomeColor}15` }}
              >
                {journey.outcome}
              </span>
            </div>

            {/* Touchpoint timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-3 left-3 right-3 h-px bg-gray-200" />

              <div className="flex justify-between relative">
                {journey.touchpoints.map((tp, i) => {
                  const isVisible = i < visibleSteps
                  return (
                    <motion.div
                      key={`${journeyIndex}-${i}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{
                        opacity: isVisible ? 1 : 0.15,
                        scale: isVisible ? 1 : 0.8,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                      style={{ flex: 1 }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white z-10"
                        style={{
                          borderColor: isVisible ? tp.color : "#E5E7EB",
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: isVisible ? tp.color : "#D1D5DB" }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-600 mt-1 text-center leading-tight max-w-[52px]">
                        {tp.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Channel Attribution Bars */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <h4 className="text-[10px] text-gray-500 font-medium mb-2">CHANNEL CREDIT</h4>
        <div className="space-y-1.5">
          {channelAttribution.map((ch, i) => (
            <div key={ch.name} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 w-14 text-right flex-shrink-0">{ch.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ch.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: ch.color }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-900 w-7 text-right flex-shrink-0">{ch.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
