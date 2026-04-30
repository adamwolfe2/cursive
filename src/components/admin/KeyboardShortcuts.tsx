'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const SHORTCUTS = [
  { key: 'n', description: 'New client', path: '/admin/onboarding/new' },
  { key: 'd', description: 'Deal calculator', path: '/admin/deal-calculator' },
  { key: 'p', description: 'Pipeline', path: '/admin/onboarding' },
  { key: 'k', description: 'Focus search', action: 'search' },
  { key: '?', description: 'Show shortcuts', action: 'help' },
  { key: 'Escape', description: 'Close modal', action: 'escape' },
]

export default function KeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger in inputs/textareas
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        if (e.key === 'Escape') {
          ;(target as HTMLInputElement).blur()
        }
        return
      }

      // Don't trigger with modifier keys (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      switch (e.key) {
        case 'n':
          e.preventDefault()
          router.push('/admin/onboarding/new')
          break
        case 'd':
          e.preventDefault()
          router.push('/admin/deal-calculator')
          break
        case 'p':
          e.preventDefault()
          router.push('/admin/onboarding')
          break
        case 'k': {
          e.preventDefault()
          const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="earch"]')
          searchInput?.focus()
          break
        }
        case '?':
          e.preventDefault()
          setShowHelp((prev) => !prev)
          break
        case 'Escape':
          setShowHelp(false)
          break
      }
    },
    [router]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])

  if (!showHelp) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowHelp(false)}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm m-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{s.description}</span>
              <kbd className="inline-flex items-center justify-center rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700 border border-gray-200 min-w-[28px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-4 text-center">
          Press ? to toggle this help
        </p>
      </div>
    </div>
  )
}
