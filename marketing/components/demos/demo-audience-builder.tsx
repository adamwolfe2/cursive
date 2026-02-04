"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface Filter {
  id: string
  category: string
  value: string
  impact: number
}

const availableFilters = {
  industry: ["SaaS", "E-commerce", "Finance", "Healthcare", "Manufacturing"],
  title: ["VP+", "Director", "Manager", "C-Level", "Founder"],
  size: ["1-50", "51-200", "201-1000", "1000+"],
  location: ["US", "California", "New York", "Texas", "Remote"],
}

export function DemoAudienceBuilder() {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [audienceCount, setAudienceCount] = useState(140000000)
  const [targetCount, setTargetCount] = useState(140000000)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [suggestedFilters, setSuggestedFilters] = useState<string[]>([])

  // Calculate audience count based on filters
  useEffect(() => {
    let newCount = 140000000

    activeFilters.forEach(filter => {
      newCount = Math.floor(newCount * filter.impact)
    })

    setTargetCount(newCount)

    // Calculate cost ($0.50 per contact)
    setEstimatedCost(Math.floor(newCount * 0.0005))

    // Suggest next filters
    if (activeFilters.length > 0 && activeFilters.length < 4) {
      const usedCategories = activeFilters.map(f => f.category)
      const availableCategories = Object.keys(availableFilters).filter(
        cat => !usedCategories.includes(cat)
      )
      if (availableCategories.length > 0) {
        setSuggestedFilters(availableCategories.slice(0, 2))
      }
    } else {
      setSuggestedFilters([])
    }
  }, [activeFilters])

  // Animate count change
  useEffect(() => {
    const duration = 500 // ms
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
  }, [targetCount])

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

      {/* Audience Count Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 text-center border border-gray-200"
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
            className="h-full bg-gradient-to-r from-[#007AFF] to-purple-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Active Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 min-h-[80px]">
        <div className="text-sm text-gray-900 font-medium mb-3">Active Filters</div>
        <div className="flex flex-wrap gap-2">
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

      {/* Suggested Filters */}
      <AnimatePresence>
        {suggestedFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg p-4 border border-dashed border-gray-300"
          >
            <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Suggested filters
            </div>
            <div className="flex gap-2">
              {suggestedFilters.map(category => (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const options = availableFilters[category as keyof typeof availableFilters]
                    const randomValue = options[Math.floor(Math.random() * options.length)]
                    addFilter(category, randomValue)
                  }}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 rounded-lg border border-gray-200 transition-colors"
                >
                  Add {category}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Cost Estimate */}
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
              initial={{ scale: 1.1, color: "#007AFF" }}
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
