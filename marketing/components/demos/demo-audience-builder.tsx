"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface Filter {
  id: string
  category: string
  value: string
  impact: number
}

interface Contact {
  id: string
  name: string
  title: string
  company: string
  timestamp: number
}

const availableFilters = {
  industry: ["SaaS", "E-commerce", "Finance", "Healthcare", "Manufacturing"],
  title: ["VP+", "Director", "Manager", "C-Level", "Founder"],
  size: ["1-50", "51-200", "201-1000", "1000+"],
  location: ["US", "California", "New York", "Texas", "Remote"],
}

const sampleContacts = [
  { name: "Sarah Chen", title: "VP Sales", company: "TechCorp" },
  { name: "Michael Rodriguez", title: "Director Marketing", company: "DataFlow" },
  { name: "Jessica Park", title: "Head of Growth", company: "CloudBase" },
  { name: "David Kim", title: "VP Operations", company: "ScaleAI" },
  { name: "Amanda Foster", title: "Chief Revenue Officer", company: "SaaSify" },
  { name: "Ryan Thompson", title: "Director Sales", company: "MetricHQ" },
  { name: "Emily Watson", title: "VP Marketing", company: "GrowthLab" },
  { name: "James Liu", title: "Head of Sales", company: "DataSync" },
]

export function DemoAudienceBuilder() {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [audienceCount, setAudienceCount] = useState(140000000)
  const [targetCount, setTargetCount] = useState(140000000)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [recentContacts, setRecentContacts] = useState<Contact[]>([])
  const [growthData, setGrowthData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const [totalMatched, setTotalMatched] = useState(0)

  // Add contacts sporadically
  useEffect(() => {
    const addRandomContact = () => {
      const randomContact = sampleContacts[Math.floor(Math.random() * sampleContacts.length)]
      const newContact: Contact = {
        id: `contact-${Date.now()}-${Math.random()}`,
        ...randomContact,
        timestamp: Date.now(),
      }

      setRecentContacts(prev => [newContact, ...prev].slice(0, 5))
      setTotalMatched(prev => prev + 1)

      // Update growth chart
      setGrowthData(prev => {
        const newData = [...prev]
        newData.shift()
        newData.push(newData[newData.length - 1] + Math.floor(Math.random() * 15) + 5)
        return newData
      })
    }

    // Start adding contacts after a short delay
    const initialDelay = setTimeout(() => {
      addRandomContact()
      const interval = setInterval(addRandomContact, 2500)
      return () => clearInterval(interval)
    }, 1000)

    return () => clearTimeout(initialDelay)
  }, [])

  // Calculate audience count based on filters
  useEffect(() => {
    let newCount = 140000000

    activeFilters.forEach(filter => {
      newCount = Math.floor(newCount * filter.impact)
    })

    setTargetCount(newCount)
    setEstimatedCost(Math.floor(newCount * 0.0005))
  }, [activeFilters])

  // Animate count change
  useEffect(() => {
    const duration = 500
    const steps = 30
    const increment = (targetCount - audienceCount) / steps
    let current = audienceCount

    const interval = setInterval(() => {
      current += increment
      if (
        (increment > 0 && current >= targetCount) ||
        (increment < 0 && current <= targetCount)
      ) {
        setAudienceCount(targetCount)
        clearInterval(interval)
      } else {
        setAudienceCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [targetCount, audienceCount])

  const addFilter = (category: string, value: string) => {
    const impacts: Record<string, number> = {
      industry: 0.085,
      title: 0.032,
      size: 0.28,
      location: 0.15,
    }

    const newFilter: Filter = {
      id: `${category}-${Date.now()}`,
      category,
      value,
      impact: impacts[category] || 0.5,
    }

    setActiveFilters(prev => [...prev, newFilter])
  }

  const removeFilter = (id: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== id))
  }

  const filterColors: Record<string, string> = {
    industry: "bg-blue-50 text-blue-700 border-blue-200",
    title: "bg-purple-50 text-purple-700 border-purple-200",
    size: "bg-green-50 text-green-700 border-green-200",
    location: "bg-orange-50 text-orange-700 border-orange-200",
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Audience Builder</h3>
        <p className="text-gray-600">Build precise audiences with unlimited filtering</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Audience Count */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center border border-gray-200 col-span-2"
        >
          <div className="text-sm text-gray-600 mb-2">Total Audience Size</div>
          <motion.div
            key={Math.floor(audienceCount / 1000)}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-5xl text-gray-900 font-light mb-2"
          >
            {audienceCount.toLocaleString()}
          </motion.div>
          <div className="text-xs text-gray-600">contacts available</div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-white rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${(audienceCount / 140000000) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* Matched Contacts Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 text-center border border-gray-200 flex flex-col justify-center"
        >
          <div className="text-sm text-gray-600 mb-2">Contacts Matched</div>
          <motion.div
            key={totalMatched}
            initial={{ scale: 1.3, color: "#10B981" }}
            animate={{ scale: 1, color: "#111827" }}
            transition={{ duration: 0.4 }}
            className="text-4xl font-light mb-1"
          >
            {totalMatched}
          </motion.div>
          <div className="flex items-center justify-center gap-1 text-xs text-green-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>Live</span>
          </div>
        </motion.div>
      </div>

      {/* Live Contact Feed & Growth Chart */}
      <div className="grid grid-cols-2 gap-4">
        {/* Live Contact Feed */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm text-gray-900 font-medium">Recent Matches</h4>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
          </div>
          <div className="space-y-2 min-h-[200px]">
            <AnimatePresence mode="popLayout">
              {recentContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  style={{ opacity: 1 - index * 0.15 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium truncate">{contact.name}</div>
                      <div className="text-xs text-gray-600 truncate">{contact.title}</div>
                      <div className="text-xs text-gray-500 truncate">{contact.company}</div>
                    </div>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"
                    >
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h4 className="text-sm text-gray-900 font-medium mb-3">Growth Over Time</h4>
          <div className="h-[200px] flex items-end justify-between gap-1">
            {growthData.map((value, index) => {
              const maxValue = Math.max(...growthData, 1)
              const height = (value / maxValue) * 100

              return (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex-1 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t relative group"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {value}
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>0s</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-900 font-medium mb-3">Active Filters</div>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          <AnimatePresence mode="popLayout">
            {activeFilters.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-gray-500 italic"
              >
                No filters applied - showing all 140M contacts
              </motion.div>
            ) : (
              activeFilters.map(filter => (
                <motion.div
                  key={filter.id}
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  layout
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
                    filterColors[filter.category]
                  }`}
                >
                  <span className="font-medium">{filter.category}:</span>
                  <span>{filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="ml-1 hover:bg-white/50 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter Options Grid */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(availableFilters).map(([category, options]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className="text-sm text-gray-900 font-medium mb-2 capitalize">{category}</div>
            <div className="flex flex-wrap gap-1.5">
              {options.slice(0, 3).map(option => (
                <motion.button
                  key={option}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addFilter(category, option)}
                  disabled={activeFilters.some(f => f.category === category)}
                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-gray-700 rounded border border-gray-200 transition-colors"
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cost Estimate & Export */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Estimated Cost</div>
            <motion.div
              key={estimatedCost}
              initial={{ scale: 1.1, color: "#10B981" }}
              animate={{ scale: 1, color: "#111827" }}
              transition={{ duration: 0.3 }}
              className="text-2xl text-gray-900 font-light"
            >
              ${estimatedCost.toLocaleString()}
            </motion.div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-[#007AFF] text-white rounded-lg font-medium hover:bg-[#0066DD] transition-colors disabled:opacity-50"
            disabled={audienceCount === 0}
          >
            Export Audience
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
