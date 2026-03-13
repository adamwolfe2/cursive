"use client"

import { motion } from "framer-motion"

export function LeadSequenceFlow() {
  return (
    <div className="bg-white rounded-xl p-8 border border-gray-200 overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Entry Point */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Lead Enters Sequence</span>
          </div>
          <div className="w-px h-8 bg-primary" />
          <div className="text-xs text-gray-600 mb-2">Day 1</div>
          <div className="w-px h-8 bg-primary" />
        </motion.div>

        {/* First Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="bg-blue-100 border-2 border-primary px-6 py-4 rounded-lg text-center max-w-xs">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-primary"
              >
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-primary">Email</span>
            </div>
            <div className="text-xs text-gray-900">Personalized Email</div>
            <div className="text-xs text-gray-600 mt-1">
              Hi (first_name), I noticed...
            </div>
          </div>
        </motion.div>

        {/* Decision Tree */}
        <div className="flex items-start justify-center gap-8 mb-8">
          {/* If Opened */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <div className="bg-blue-500 text-white px-4 py-2 rounded text-xs mb-2">
              If opened →
            </div>
            <div className="text-xs text-gray-600 mb-2">Day 2</div>
            <div className="w-px h-8 bg-primary" />
            <div className="bg-blue-100 border-2 border-primary px-4 py-3 rounded-lg text-center max-w-xs">
              <div className="text-xs text-primary mb-1">SMS</div>
              <div className="text-xs text-gray-900">Follow-up SMS</div>
              <div className="text-xs text-gray-600">Quick question about...</div>
            </div>
            <div className="w-px h-8 bg-primary mt-4" />
            <div className="text-xs text-gray-600 mb-2">Day 3</div>
            <div className="w-px h-8 bg-primary" />
            <div className="bg-blue-100 border-2 border-primary px-4 py-3 rounded-lg text-center max-w-xs">
              <div className="text-xs text-primary mb-1">Call</div>
              <div className="text-xs text-gray-900">Call Task Created</div>
              <div className="text-xs text-gray-600">Assigned to rep</div>
            </div>
          </motion.div>

          {/* If No Open */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <div className="bg-blue-500 text-white px-4 py-2 rounded text-xs mb-2">
              If no open →
            </div>
            <div className="text-xs text-gray-600 mb-2">Day 5</div>
            <div className="w-px h-8 bg-primary" />
            <div className="bg-blue-100 border-2 border-primary px-4 py-3 rounded-lg text-center max-w-xs">
              <div className="text-xs text-primary mb-1">Email</div>
              <div className="text-xs text-gray-900">Re-engagement Email</div>
              <div className="text-xs text-gray-600">Trying to connect...</div>
            </div>
          </motion.div>
        </div>

        {/* Final Outcomes */}
        <div className="flex items-center justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-primary text-white px-6 py-3 rounded-lg text-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5 mx-auto mb-1"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">Replied</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-primary text-white px-6 py-3 rounded-lg text-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5 mx-auto mb-1"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-sm">Booked</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-blue-100 border-2 border-primary px-6 py-3 rounded-lg text-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5 mx-auto mb-1 text-primary"
            >
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-900">No Response</div>
            <div className="text-xs text-gray-600">Moves to nurture</div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
