"use client"

import { motion } from "framer-motion"

export function PipelineDashboard() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-6 h-6 text-primary"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-gray-900">Cursive</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-lg p-4"
          >
            <div className="text-sm text-gray-900 mb-2">AI Insight Unlocked</div>
            <div className="text-xs text-gray-600 mb-3">
              High-Intent Lead Detected
              <br />
              Recommendation: Prioritize
              <br />
              CFO leads
            </div>
            <button className="bg-primary text-white text-xs px-3 py-1 rounded">
              Apply
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                S
              </div>
              <div>
                <div className="text-sm text-gray-900">New High-Intent Lead</div>
                <div className="text-xs text-gray-600">
                  Sarah Chen (Salesforce) - $55K
                  <br />
                  Source: Webinar
                </div>
              </div>
            </div>
            <button className="bg-primary text-white text-xs px-3 py-1 rounded w-full">
              Review
            </button>
          </motion.div>
        </div>

        {/* Middle Column - Metrics */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Pipeline</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl text-gray-900">$2.4M</div>
              <div className="text-xs text-blue-600">↑ Trending</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl text-gray-900">24.3%</div>
              <div className="text-xs text-blue-600">+4.1%</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-3">Lead Sources</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Email</span>
                <span className="text-gray-900">34%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "34%" }} />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Organic</span>
                <span className="text-gray-900">35%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "35%" }} />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Paid Ads</span>
                <span className="text-gray-900">31%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "31%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Deals */}
        <div className="space-y-4">
          <div className="text-sm text-gray-900 mb-2">Live Pipeline</div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-6 h-6 text-primary"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-900">Deal Closed!</span>
            </div>
            <div className="text-xs text-gray-600 mb-1">HubSpot - $120K</div>
            <div className="text-xs text-gray-600">Source: Organic Search</div>
          </motion.div>

          <div className="space-y-2">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-900">Salesforce</span>
                <span className="bg-blue-100 text-primary text-xs px-2 py-0.5 rounded">
                  contacted
                </span>
              </div>
              <div className="text-xs text-gray-600">$45K</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-900">Salesforce Ventures</span>
                <span className="bg-blue-100 text-primary text-xs px-2 py-0.5 rounded">
                  contacted
                </span>
              </div>
              <div className="text-xs text-gray-600">$32K</div>
            </div>
          </div>

          <div className="text-xs text-gray-600 text-center mt-4">
            Pipeline Velocity: Avg. 21 days (-4 days)
          </div>
        </div>
      </div>
    </div>
  )
}
