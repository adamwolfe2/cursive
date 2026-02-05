"use client"

import { useView } from '@/lib/view-context'
import { motion } from 'framer-motion'

// Track view toggle events in Google Analytics
const trackViewChange = (newView: 'human' | 'machine') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_toggle', {
      view_mode: newView,
      event_category: 'engagement',
      event_label: `Switched to ${newView} view`,
    })
  }
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export function ViewToggle() {
  const { view, setView } = useView()

  const handleViewChange = (newView: 'human' | 'machine') => {
    setView(newView)
    trackViewChange(newView)
  }

  return (
    <div className="inline-flex items-center bg-gray-900 rounded-full p-1 gap-1">
      <button
        onClick={() => handleViewChange('human')}
        className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
          view === 'human'
            ? 'text-white'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        {view === 'human' && (
          <motion.div
            layoutId="activeView"
            className="absolute inset-0 bg-gray-700 rounded-full"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">HUMAN</span>
      </button>
      <button
        onClick={() => handleViewChange('machine')}
        className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
          view === 'machine'
            ? 'text-white'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        {view === 'machine' && (
          <motion.div
            layoutId="activeView"
            className="absolute inset-0 bg-gray-700 rounded-full"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">MACHINE</span>
      </button>
    </div>
  )
}
