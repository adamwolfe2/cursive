/**
 * Keyboard Hooks
 * OpenInfo Platform
 *
 * React hooks for keyboard shortcut management.
 */

'use client'

import * as React from 'react'
import {
  shortcutManager,
  matchesKeyCombo,
  parseKeyCombo,
  formatKeyCombo,
  type ShortcutAction,
  type ShortcutCategory,
  type ShortcutGroup,
  type KeyCombo,
} from './shortcuts'

// ============================================
// USE SHORTCUT
// ============================================

/**
 * Register a single keyboard shortcut
 */
export function useShortcut(
  keys: KeyCombo,
  callback: () => void | Promise<void>,
  options?: {
    id?: string
    name?: string
    description?: string
    category?: ShortcutCategory
    enabled?: boolean | (() => boolean)
    global?: boolean
    alternateKeys?: KeyCombo
  }
): void {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback

  React.useEffect(() => {
    if (!shortcutManager) return

    const action: ShortcutAction = {
      id: options?.id || `shortcut-${keys}`,
      name: options?.name || keys,
      description: options?.description,
      category: options?.category || 'actions',
      keys,
      alternateKeys: options?.alternateKeys,
      callback: () => callbackRef.current(),
      enabled: options?.enabled,
      global: options?.global,
    }

    return shortcutManager.register(action)
  }, [keys, options?.id, options?.name, options?.description, options?.category, options?.alternateKeys, options?.enabled, options?.global])
}

// ============================================
// USE SHORTCUTS
// ============================================

/**
 * Register multiple keyboard shortcuts
 */
export function useShortcuts(
  shortcuts: Array<Omit<ShortcutAction, 'callback'> & { callback: () => void | Promise<void> }>
): void {
  // Keep callbacks in refs to avoid re-registering
  const callbacksRef = React.useRef<Map<string, () => void | Promise<void>>>(new Map())

  for (const shortcut of shortcuts) {
    callbacksRef.current.set(shortcut.id, shortcut.callback)
  }

  React.useEffect(() => {
    if (!shortcutManager) return

    const actions = shortcuts.map(shortcut => ({
      ...shortcut,
      callback: () => {
        const cb = callbacksRef.current.get(shortcut.id)
        if (cb) cb()
      },
    }))

    return shortcutManager.registerMany(actions)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(shortcuts.map(s => ({ ...s, callback: undefined })))])
}

// ============================================
// USE ALL SHORTCUTS
// ============================================

/**
 * Get all registered shortcuts, with automatic updates
 */
export function useAllShortcuts(): ShortcutAction[] {
  const [shortcuts, setShortcuts] = React.useState<ShortcutAction[]>(() =>
    shortcutManager?.getAll() || []
  )

  React.useEffect(() => {
    if (!shortcutManager) return

    setShortcuts(shortcutManager.getAll())

    return shortcutManager.subscribe(setShortcuts)
  }, [])

  return shortcuts
}

/**
 * Get shortcuts grouped by category
 */
export function useShortcutGroups(): ShortcutGroup[] {
  const shortcuts = useAllShortcuts()

  return React.useMemo(() => {
    if (!shortcutManager) return []
    return shortcutManager.getGrouped()
  }, [shortcuts])
}

// ============================================
// USE KEY PRESS
// ============================================

/**
 * Simple hook for detecting single key presses
 */
export function useKeyPress(
  targetKey: string,
  callback: () => void,
  options?: {
    global?: boolean
    preventDefault?: boolean
  }
): void {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isInputFocused && !options?.global) return

      if (event.key.toLowerCase() === targetKey.toLowerCase()) {
        if (options?.preventDefault) {
          event.preventDefault()
        }
        callbackRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [targetKey, options?.global, options?.preventDefault])
}

// ============================================
// USE HOTKEY
// ============================================

/**
 * Hook for handling keyboard shortcuts with key combos
 */
export function useHotkey(
  combo: KeyCombo,
  callback: () => void,
  deps: React.DependencyList = []
): void {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (matchesKeyCombo(event, combo)) {
        event.preventDefault()
        callbackRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo, ...deps])
}

// ============================================
// USE ESCAPE KEY
// ============================================

/**
 * Hook for handling escape key presses
 */
export function useEscapeKey(callback: () => void, enabled: boolean = true): void {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback

  React.useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        callbackRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}

// ============================================
// USE ARROW NAVIGATION
// ============================================

interface UseArrowNavigationOptions {
  itemCount: number
  onSelect?: (index: number) => void
  loop?: boolean
  orientation?: 'vertical' | 'horizontal' | 'both'
  initialIndex?: number
}

/**
 * Hook for arrow key navigation through a list
 */
export function useArrowNavigation({
  itemCount,
  onSelect,
  loop = true,
  orientation = 'vertical',
  initialIndex = 0,
}: UseArrowNavigationOptions) {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex)

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const vertical = orientation === 'vertical' || orientation === 'both'
      const horizontal = orientation === 'horizontal' || orientation === 'both'

      let newIndex = activeIndex

      switch (event.key) {
        case 'ArrowUp':
          if (vertical) {
            event.preventDefault()
            newIndex = activeIndex - 1
            if (newIndex < 0) {
              newIndex = loop ? itemCount - 1 : 0
            }
          }
          break
        case 'ArrowDown':
          if (vertical) {
            event.preventDefault()
            newIndex = activeIndex + 1
            if (newIndex >= itemCount) {
              newIndex = loop ? 0 : itemCount - 1
            }
          }
          break
        case 'ArrowLeft':
          if (horizontal) {
            event.preventDefault()
            newIndex = activeIndex - 1
            if (newIndex < 0) {
              newIndex = loop ? itemCount - 1 : 0
            }
          }
          break
        case 'ArrowRight':
          if (horizontal) {
            event.preventDefault()
            newIndex = activeIndex + 1
            if (newIndex >= itemCount) {
              newIndex = loop ? 0 : itemCount - 1
            }
          }
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          onSelect?.(activeIndex)
          return
        case 'Home':
          event.preventDefault()
          newIndex = 0
          break
        case 'End':
          event.preventDefault()
          newIndex = itemCount - 1
          break
        default:
          return
      }

      setActiveIndex(newIndex)
    },
    [activeIndex, itemCount, loop, orientation, onSelect]
  )

  const reset = React.useCallback(() => {
    setActiveIndex(initialIndex)
  }, [initialIndex])

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    reset,
  }
}

// ============================================
// USE TYPE AHEAD
// ============================================

interface UseTypeAheadOptions<T> {
  items: T[]
  getLabel: (item: T) => string
  onSelect?: (item: T, index: number) => void
  timeout?: number
}

/**
 * Hook for type-ahead selection in a list
 */
export function useTypeAhead<T>({
  items,
  getLabel,
  onSelect,
  timeout = 500,
}: UseTypeAheadOptions<T>) {
  const [searchString, setSearchString] = React.useState('')
  const [matchedIndex, setMatchedIndex] = React.useState(-1)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Only handle printable characters
      if (event.key.length !== 1) return
      if (event.ctrlKey || event.altKey || event.metaKey) return

      const newSearchString = searchString + event.key.toLowerCase()
      setSearchString(newSearchString)

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout to clear search
      timeoutRef.current = setTimeout(() => {
        setSearchString('')
      }, timeout)

      // Find matching item
      const index = items.findIndex(item =>
        getLabel(item).toLowerCase().startsWith(newSearchString)
      )

      if (index !== -1) {
        setMatchedIndex(index)
        onSelect?.(items[index], index)
      }
    },
    [searchString, items, getLabel, onSelect, timeout]
  )

  const reset = React.useCallback(() => {
    setSearchString('')
    setMatchedIndex(-1)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    searchString,
    matchedIndex,
    handleKeyDown,
    reset,
  }
}

// ============================================
// USE FOCUS TRAP
// ============================================

/**
 * Hook for trapping focus within an element
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options?: {
    enabled?: boolean
    initialFocus?: React.RefObject<HTMLElement>
    returnFocus?: boolean
  }
): void {
  const { enabled = true, initialFocus, returnFocus = true } = options || {}
  const previousActiveRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Store previously focused element
    previousActiveRef.current = document.activeElement as HTMLElement

    // Focus initial element or first focusable
    const focusInitial = () => {
      if (initialFocus?.current) {
        initialFocus.current.focus()
      } else {
        const focusable = containerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }
    }

    focusInitial()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return

      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Return focus to previous element
      if (returnFocus && previousActiveRef.current) {
        previousActiveRef.current.focus()
      }
    }
  }, [enabled, containerRef, initialFocus, returnFocus])
}

// ============================================
// USE KEY COMBO DISPLAY
// ============================================

/**
 * Hook for getting formatted key combo display
 */
export function useKeyComboDisplay(combo: KeyCombo): string {
  const [display, setDisplay] = React.useState(() => formatKeyCombo(combo))

  React.useEffect(() => {
    setDisplay(formatKeyCombo(combo))
  }, [combo])

  return display
}
