"use client"

import { motion } from "framer-motion"

export function VisitorTrackingFlow() {
  const nodes = [
    {
      title: "Website Visit",
      subtitle: "",
      iconPath: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
    },
    {
      title: "Pixel Fires",
      subtitle: "Anonymous visitor detected",
      iconPath: "M15 10l-4 4 6 6 4-16-16 6 4 6z",
    },
    {
      title: "Identify Enriched",
      subtitle: "Name: Sarah Chen\nCompany: Salesforce\nTitle: VP Marketing\nEmail revealed",
      iconPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      badge: "NODE 3"
    },
    {
      title: "Intent Scored",
      subtitle: "87\nHigh Intent",
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      badge: "NODE 4"
    },
    {
      title: "CRM Entry Created",
      subtitle: "Auto-synced",
      iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
  ]

  return (
    <div className="bg-white rounded-xl p-8 border border-gray-200">
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
        {nodes.map((node, index) => (
          <div key={index} className="flex items-center gap-4 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              {node.badge && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                  {node.badge}
                </div>
              )}
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6 min-w-[160px] text-center">
                <div className="w-12 h-12 mx-auto mb-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-full h-full text-primary"
                  >
                    <path d={node.iconPath} />
                  </svg>
                </div>
                <div className="text-gray-900 mb-1">{node.title}</div>
                {node.subtitle && (
                  <div className="text-xs text-gray-600 whitespace-pre-line">
                    {node.subtitle}
                  </div>
                )}
              </div>
            </motion.div>
            {index < nodes.length - 1 && (
              <svg
                className="w-8 h-8 text-blue-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
