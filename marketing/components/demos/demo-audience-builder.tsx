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
  { name: "Sarah Chen", title: "VP Sales", company: "Salesforce" },
  { name: "Michael Rodriguez", title: "Director Marketing", company: "Datadog" },
  { name: "Jessica Park", title: "Head of Growth", company: "Cloudflare" },
  { name: "David Kim", title: "VP Operations", company: "Monday.com" },
  { name: "Amanda Foster", title: "Chief Revenue Officer", company: "HubSpot" },
  { name: "Ryan Thompson", title: "Director Sales", company: "Elastic" },
  { name: "Emily Watson", title: "VP Marketing", company: "Klaviyo" },
  { name: "James Liu", title: "Head of Sales", company: "Snowflake" },
]

export function DemoAudienceBuilder() {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [audienceCount, setAudienceCount] = useState(140000000)
  const [targetCount, setTargetCount] = useState(140000000)
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
      // eslint-disable-next-line react-hooks/purity
      id: `${category}-${Math.random()}`,
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
    title: "bg-blue-50 text-blue-700 border-blue-200",
    size: "bg-blue-50 text-blue-700 border-blue-200",
    location: "bg-gray-50 text-gray-700 border-gray-200",
  }

  return (
    <div className="space-y-2">
      {/* Top Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Audience Count */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-lg p-3 text-center border border-gray-200 col-span-2"
        >
          <div className="text-[10px] text-gray-600 mb-1">Total Audience Size</div>
          <motion.div
            key={Math.floor(audienceCount / 1000)}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl text-gray-900 font-light"
          >
            {audienceCount.toLocaleString()}
          </motion.div>
          <div className="mt-1.5 w-full bg-white rounded-full h-1.5 overflow-hidden">
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
          className="bg-white rounded-lg p-3 text-center border border-gray-200 flex flex-col justify-center"
        >
          <div className="text-[10px] text-gray-600 mb-1">Matched</div>
          <motion.div
            key={totalMatched}
            initial={{ scale: 1.3, color: "#10B981" }}
            animate={{ scale: 1, color: "#111827" }}
            transition={{ duration: 0.4 }}
            className="text-xl font-light"
          >
            {totalMatched}
          </motion.div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-blue-600">
            <span>Live</span>
          </div>
        </motion.div>
      </div>

      {/* Live Contact Feed & Growth Chart */}
      <div className="grid grid-cols-2 gap-2">
        {/* Live Contact Feed */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] text-gray-900 font-medium">Recent Matches</h4>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {recentContacts.slice(0, 3).map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                  className="bg-gray-50 rounded p-1.5 border border-gray-200"
                  style={{ opacity: 1 - index * 0.2 }}
                >
                  <div className="text-[10px] text-gray-900 font-medium truncate">{contact.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{contact.title} · {contact.company}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-200">
          <h4 className="text-[10px] text-gray-900 font-medium mb-2">Growth</h4>
          <div className="h-[72px] flex items-end justify-between gap-0.5">
            {growthData.map((value, index) => {
              const maxValue = Math.max(...growthData, 1)
              const height = (value / maxValue) * 100

              return (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex-1 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t"
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Active Filters + Quick Filter Buttons */}
      <div className="bg-white rounded-lg p-2.5 border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-500 font-medium">Filters:</span>
          <AnimatePresence mode="popLayout">
            {activeFilters.length === 0 ? (
              <span className="text-[10px] text-gray-400 italic">None applied</span>
            ) : (
              activeFilters.map(filter => (
                <motion.div
                  key={filter.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                    filterColors[filter.category]
                  }`}
                >
                  <span>{filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="hover:bg-white/50 rounded-full transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {Object.entries(availableFilters).map(([category, options]) => (
            options.slice(0, 2).map(option => (
              <motion.button
                key={`${category}-${option}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => addFilter(category, option)}
                disabled={activeFilters.some(f => f.category === category)}
                className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-[10px] text-gray-600 rounded border border-gray-200 transition-colors"
              >
                {option}
              </motion.button>
            ))
          ))}
        </div>
      </div>
    </div>
  )
}
