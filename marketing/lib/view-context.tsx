"use client"

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'

type ViewMode = 'human' | 'machine'

interface ViewContextType {
  view: ViewMode
  setView: (view: ViewMode) => void
}

const ViewContext = createContext<ViewContextType | undefined>(undefined)

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<ViewMode>('human')
  const scrollPositionRef = useRef<number>(0)

  const setView = useCallback((newView: ViewMode) => {
    // Save current scroll position before state change
    if (typeof window !== 'undefined') {
      scrollPositionRef.current = window.scrollY
    }

    setViewState(newView)

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cursive-view-mode', newView)
    }

    // Update URL parameter without triggering navigation/suspension
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('view', newView)
      window.history.replaceState({}, '', url.toString())
    }

    // Restore scroll position after DOM update
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current)
      })
    }
  }, [])

  // Initialize from URL param or localStorage on mount (client-side only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlView = params.get('view')
    if (urlView === 'machine' || urlView === 'human') {
      setViewState(urlView)
    } else {
      const stored = localStorage.getItem('cursive-view-mode')
      if (stored === 'machine' || stored === 'human') {
        setViewState(stored)
      }
    }
  }, [])

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  )
}

export function useView() {
  const context = useContext(ViewContext)
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider')
  }
  return context
}
