"use client"

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

type ViewMode = 'human' | 'machine'

interface ViewContextType {
  view: ViewMode
  setView: (view: ViewMode) => void
}

const ViewContext = createContext<ViewContextType | undefined>(undefined)

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Initialize from URL param or localStorage
  const [view, setViewState] = useState<ViewMode>('human')
  const scrollPositionRef = useRef<number>(0)

  const setView = (newView: ViewMode) => {
    // Save current scroll position before state change
    if (typeof window !== 'undefined') {
      scrollPositionRef.current = window.scrollY
    }

    setViewState(newView)

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cursive-view-mode', newView)
    }

    // Update URL parameter without scroll
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    // Restore scroll position after a brief delay to ensure DOM has updated
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current)
      })
    }
  }

  // Initialize from URL and localStorage on mount
  useEffect(() => {
    const urlView = searchParams.get('view')
    if (urlView === 'machine' || urlView === 'human') {
      setViewState(urlView)
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cursive-view-mode')
      if (stored === 'machine' || stored === 'human') {
        setViewState(stored)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync with URL changes
  useEffect(() => {
    const urlView = searchParams.get('view')
    if (urlView === 'machine' || urlView === 'human') {
      setViewState(urlView)
    }
  }, [searchParams])

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
