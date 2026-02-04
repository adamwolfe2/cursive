"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

const searchQueries = [
  "VP Marketing at SaaS companies",
  "Head of Sales in San Francisco",
  "CEO at companies with 50-200 employees",
  "Founders in fintech",
]

const contacts = [
  { name: "Sarah Chen", title: "VP Marketing", company: "Acme Corp", verified: true },
  { name: "Mike Rodriguez", title: "Head of Sales", company: "TechStart", verified: true },
  { name: "Emily Johnson", title: "CEO", company: "GrowthCo", verified: false },
  { name: "David Kim", title: "Founder", company: "FinanceAI", verified: true },
  { name: "Lisa Martinez", title: "VP Sales", company: "ScaleUp", verified: false },
]

export function DemoPeopleSearch() {
  const [searchText, setSearchText] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<typeof contacts>([])
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0)
  const [enrichingIndex, setEnrichingIndex] = useState<number | null>(null)

  // Auto-type search query
  useEffect(() => {
    const currentQuery = searchQueries[currentQueryIndex]
    let charIndex = 0

    setSearchText("")
    setResults([])
    setIsSearching(false)

    const typingInterval = setInterval(() => {
      if (charIndex < currentQuery.length) {
        setSearchText(currentQuery.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typingInterval)
        // Start searching after typing completes
        setTimeout(() => {
          setIsSearching(true)
          // Show results after search animation
          setTimeout(() => {
            setIsSearching(false)
            setResults(contacts.slice(0, 3))
          }, 1500)
        }, 500)
      }
    }, 80) // Typing speed

    return () => clearInterval(typingInterval)
  }, [currentQueryIndex])

  // Cycle through search queries
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setCurrentQueryIndex(prev => (prev + 1) % searchQueries.length)
    }, 8000) // Change query every 8 seconds

    return () => clearInterval(cycleInterval)
  }, [])

  // Animate enrichment badges
  useEffect(() => {
    if (results.length > 0) {
      const enrichInterval = setInterval(() => {
        setEnrichingIndex(prev => {
          if (prev === null) return 0
          if (prev >= results.length - 1) return null
          return prev + 1
        })
      }, 2000)

      return () => clearInterval(enrichInterval)
    }
  }, [results])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">People Search</h3>
        <p className="text-gray-600">Find and verify B2B contacts instantly</p>
      </div>

      {/* Search Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchText}
              readOnly
              placeholder="Search by name, company, or title..."
              className="w-full px-4 py-2 rounded border border-gray-300 text-sm bg-white"
            />
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <div className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-[#007AFF] text-white rounded text-sm whitespace-nowrap font-medium hover:bg-[#0066DD] transition-colors"
          >
            Search
          </motion.button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          500M+ verified contacts
        </div>
      </motion.div>

      {/* Search Animation */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-8 border border-gray-200 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-3 border-[#007AFF] border-t-transparent rounded-full mx-auto mb-3"
            />
            <div className="text-sm text-gray-600">Searching 500M+ contacts...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {results.map((contact, i) => (
            <motion.div
              key={contact.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              layout
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.15 + 0.2 }}
                    className="text-sm text-gray-900 font-medium mb-1"
                  >
                    {contact.name}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.15 + 0.3 }}
                    className="text-xs text-gray-600"
                  >
                    {contact.title} at {contact.company}
                  </motion.div>
                </div>
                <AnimatePresence mode="wait">
                  {enrichingIndex === i ? (
                    <motion.div
                      key="enriching"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded font-medium flex items-center gap-1.5"
                    >
                      <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                      Enriching
                    </motion.div>
                  ) : enrichingIndex !== null && i < enrichingIndex ? (
                    <motion.div
                      key="enriched"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded font-medium"
                    >
                      ✓ Enriched
                    </motion.div>
                  ) : (
                    <motion.div
                      key="verified"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`px-3 py-1 text-xs rounded font-medium ${
                        contact.verified
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {contact.verified ? "✓ Verified" : "Available"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
