// Keyboard Shortcuts Hook
// Implements keyboard shortcuts for the CRM table

'use client'

import { useEffect } from 'react'

interface KeyboardShortcutsOptions {
  onShowHelp?: () => void
  onFocusSearch?: () => void
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export function useKeyboardShortcuts({
  onShowHelp,
  onFocusSearch,
  searchInputRef,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to blur input
        if (e.key === 'Escape') {
          target.blur()
        }
        return
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?') {
        e.preventDefault()
        onShowHelp?.()
        return
      }

      // Cmd/Ctrl + F - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        if (searchInputRef?.current) {
          searchInputRef.current.focus()
        } else {
          onFocusSearch?.()
        }
        return
      }

      // Cmd/Ctrl + A - Select all (handled by table)
      // Space - Toggle row selection (handled by table)
      // Arrow keys - Navigate (handled by table)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onShowHelp, onFocusSearch, searchInputRef])
}
