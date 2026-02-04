"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const leadLists = [
  { title: "SaaS Founders - Series A", leads: 500, price: 250, verified: 99, tag: "Popular", tagColor: "bg-[#007AFF]" },
  { title: "VP Marketing - Tech", leads: 1000, price: 450, verified: 98, tag: "New", tagColor: "bg-green-500" },
  { title: "Head of Sales - B2B", leads: 750, price: 350, verified: 97, tag: "Trending", tagColor: "bg-purple-500" },
]

export function DemoMarketplace() {
  const [visibleLists, setVisibleLists] = useState<typeof leadLists>([])
  const [downloading, setDownloading] = useState<number | null>(null)

  // Animate lists appearing
  useEffect(() => {
    leadLists.forEach((list, index) => {
      setTimeout(() => {
        setVisibleLists(prev => [...prev, list])
      }, index * 600)
    })
  }, [])

  const handlePurchase = (index: number) => {
    setDownloading(index)
    setTimeout(() => {
      setDownloading(null)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Lead Marketplace</h3>
        <p className="text-gray-600">AI-curated, pre-verified lead lists ready to purchase</p>
      </div>

      {/* Lead Lists Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {visibleLists.slice(0, 2).map((list, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, scale: 1.02, borderColor: "#007AFF" }}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm text-gray-900 font-medium">{list.title}</div>
              <span className={`px-2 py-1 ${list.tagColor} text-white text-xs rounded font-medium`}>
                {list.tag}
              </span>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total Leads</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-900 font-medium"
                >
                  {list.leads.toLocaleString()}
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Verified</span>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-1.5"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                  <span className="text-sm text-green-700 font-medium">{list.verified}%</span>
                </motion.div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Delivery</span>
                <span className="text-xs text-gray-900 font-medium">Instant CSV</span>
              </div>
            </div>

            {/* Price & Action */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-2xl text-[#007AFF] font-light">
                ${list.price}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePurchase(i)}
                disabled={downloading === i}
                className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0066DD] transition-colors disabled:opacity-50"
              >
                {downloading === i ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </span>
                ) : (
                  "Purchase"
                )}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* What's Included */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-900 font-medium">What's Included</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Full name and title",
            "Verified email address",
            "Company details",
            "LinkedIn profile",
            "Phone number",
            "Industry & size",
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
              className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 rounded px-3 py-2 border border-gray-200"
            >
              <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Trust Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
        className="flex items-center justify-center gap-2 text-xs text-gray-600"
      >
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        100% Money-back guarantee | GDPR & CCPA compliant
      </motion.div>
    </div>
  )
}
