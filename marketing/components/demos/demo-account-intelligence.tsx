"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

const companies = [
  {
    name: "Acme Corp",
    size: 150,
    growth: 12,
    funding: "Series B, $25M",
    intent: 45,
    tech: ["Salesforce", "HubSpot", "Slack", "AWS"],
    contacts: 12,
  },
  {
    name: "TechStart Inc",
    size: 85,
    growth: 28,
    funding: "Series A, $12M",
    intent: 67,
    tech: ["Google Workspace", "Notion", "Stripe"],
    contacts: 8,
  },
]

export function DemoAccountIntelligence() {
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0)
  const [expandedSection, setExpandedSection] = useState<string | null>("overview")
  const [intentSignals, setIntentSignals] = useState<{ category: string; time: string }[]>([])

  const company = companies[currentCompanyIndex]

  // Cycle through companies
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCompanyIndex(prev => (prev + 1) % companies.length)
      setExpandedSection("overview")
      setIntentSignals([])
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Add intent signals
  useEffect(() => {
    const signals = [
      { category: "CRM Software", time: "2 hours ago" },
      { category: "Sales Automation", time: "5 hours ago" },
      { category: "Marketing Tools", time: "1 day ago" },
      { category: "Lead Generation", time: "2 days ago" },
    ]

    signals.forEach((signal, index) => {
      setTimeout(() => {
        setIntentSignals(prev => [...prev, signal])
      }, 1000 + index * 800)
    })
  }, [currentCompanyIndex])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-gray-900 mb-2">Account Intelligence</h3>
        <p className="text-gray-600">Deep insights into target accounts</p>
      </div>

      {/* Company Header */}
      <motion.div
        key={company.name}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#007AFF] to-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {company.name[0]}
            </div>
            <div>
              <h4 className="text-xl text-gray-900 font-medium">{company.name}</h4>
              <div className="text-sm text-gray-600">B2B SaaS Company</div>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-full font-medium"
          >
            High Intent
          </motion.div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Employees", value: company.size },
            { label: "Growth", value: `↑${company.growth}%` },
            { label: "Funding", value: company.funding.split(",")[0] },
            { label: "Intent Signals", value: company.intent },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center"
            >
              <div className="text-xs text-gray-600 mb-1">{stat.label}</div>
              <div className="text-lg text-gray-900 font-light">{stat.value}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["overview", "contacts", "tech", "signals"].map(section => (
          <motion.button
            key={section}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpandedSection(section)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              expandedSection === section
                ? "bg-[#007AFF] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {/* Overview */}
        {expandedSection === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Company Overview</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry:</span>
                  <span className="text-gray-900">B2B SaaS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="text-gray-900">San Francisco, CA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Funding:</span>
                  <span className="text-gray-900">{company.funding}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Year Founded:</span>
                  <span className="text-gray-900">2019</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contacts */}
        {expandedSection === "contacts" && (
          <motion.div
            key="contacts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {["Sarah Johnson - VP Marketing", "Mike Chen - Head of Sales", "Emily Rodriguez - CEO"].map((contact, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm">
                    {contact[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{contact.split(" - ")[0]}</div>
                    <div className="text-xs text-gray-600">{contact.split(" - ")[1]}</div>
                  </div>
                  <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">Verified</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Tech Stack */}
        {expandedSection === "tech" && (
          <motion.div
            key="tech"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <h5 className="text-sm font-medium text-gray-900 mb-3">Technology Stack</h5>
            <div className="flex flex-wrap gap-2">
              {company.tech.map((tech, i) => (
                <motion.div
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-[#007AFF] transition-colors cursor-pointer"
                >
                  {tech}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Intent Signals */}
        {expandedSection === "signals" && (
          <motion.div
            key="signals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <h5 className="text-sm font-medium text-gray-900">Recent Intent Signals</h5>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {intentSignals.map((signal, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    layout
                    className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-900">{signal.category}</span>
                    <span className="text-xs text-gray-600">{signal.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 px-4 py-3 bg-[#007AFF] text-white rounded-lg font-medium hover:bg-[#0066DD] transition-colors"
        >
          Export Account
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors"
        >
          Add to Campaign
        </motion.button>
      </motion.div>
    </div>
  )
}
