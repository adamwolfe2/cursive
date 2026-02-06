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

  const handleViewChange = (e: React.MouseEvent<HTMLButtonElement>, newView: 'human' | 'machine') => {
    e.preventDefault()
    setView(newView)
    trackViewChange(newView)
  }

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1 border border-gray-200">
      <button
        onClick={(e) => handleViewChange(e, 'human')}
        className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
          view === 'human'
            ? 'text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        type="button"
      >
        {view === 'human' && (
          <motion.div
            layoutId="activeView"
            className="absolute inset-0 bg-[#007AFF] rounded-full shadow-sm"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">HUMAN</span>
      </button>
      <button
        onClick={(e) => handleViewChange(e, 'machine')}
        className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
          view === 'machine'
            ? 'text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        type="button"
      >
        {view === 'machine' && (
          <motion.div
            layoutId="activeView"
            className="absolute inset-0 bg-[#007AFF] rounded-full shadow-sm"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">MACHINE</span>
      </button>
    </div>
  )
}
