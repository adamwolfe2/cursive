'use client'

/**
 * Command Palette Component
 * OpenInfo Platform
 *
 * VS Code-style command palette for quick navigation and actions.
 */

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Modal, ModalContent } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useShortcut,
  useArrowNavigation,
  useEscapeKey,
  useTypeAhead,
} from '@/lib/keyboard/hooks'
import { formatKeyCombo } from '@/lib/keyboard/shortcuts'

// ============================================
// TYPES
// ============================================

export interface CommandItem {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string
  category?: string
  keywords?: string[]
  action: () => void | Promise<void>
  disabled?: boolean
}

export interface CommandGroup {
  id: string
  name: string
  items: CommandItem[]
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  items: CommandItem[]
  placeholder?: string
  emptyMessage?: string
  loading?: boolean
  recentItems?: CommandItem[]
  maxRecentItems?: number
  className?: string
}

// ============================================
// COMMAND PALETTE
// ============================================

export function CommandPalette({
  isOpen,
  onClose,
  items,
  placeholder = 'Type a command or search...',
  emptyMessage = 'No results found.',
  loading,
  recentItems = [],
  maxRecentItems = 5,
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) {
      // Show recent items first, then all items
      const recentIds = new Set(recentItems.slice(0, maxRecentItems).map(i => i.id))
      const otherItems = items.filter(i => !recentIds.has(i.id))
      return [
        ...recentItems.slice(0, maxRecentItems),
        ...otherItems,
      ]
    }

    const searchTerms = query.toLowerCase().split(' ')

    return items.filter(item => {
      const searchText = [
        item.name,
        item.description,
        item.category,
        ...(item.keywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchTerms.every(term => searchText.includes(term))
    })
  }, [items, query, recentItems, maxRecentItems])

  // Group items by category
  const groupedItems = React.useMemo(() => {
    const groups: CommandGroup[] = []
    const categoryMap = new Map<string, CommandItem[]>()

    for (const item of filteredItems) {
      const category = item.category || 'Actions'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(item)
    }

    for (const [name, items] of categoryMap) {
      groups.push({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        items,
      })
    }

    return groups
  }, [filteredItems])

  // Flat list for keyboard navigation
  const flatItems = groupedItems.flatMap(g => g.items)

  // Arrow navigation
  const { activeIndex, setActiveIndex, handleKeyDown: handleArrowNav } = useArrowNavigation({
    itemCount: flatItems.length,
    onSelect: (index) => {
      const item = flatItems[index]
      if (item && !item.disabled) {
        executeCommand(item)
      }
    },
    loop: true,
  })

  // Execute command
  const executeCommand = React.useCallback(
    async (item: CommandItem) => {
      if (item.disabled) return

      onClose()
      setQuery('')
      await item.action()
    },
    [onClose]
  )

  // Handle keyboard events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    handleArrowNav(event)
  }

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [isOpen, setActiveIndex])

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  // Scroll active item into view
  React.useEffect(() => {
    const activeElement = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    activeElement?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Close on escape
  useEscapeKey(onClose, isOpen)

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={cn('max-w-2xl p-0', className)}>
      <div className="flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="p-3 border-b border-border">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="border-0 focus:ring-0 text-base"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : flatItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.id} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group.name}
                </div>
                {group.items.map((item) => {
                  const itemIndex = flatItems.indexOf(item)
                  const isActive = itemIndex === activeIndex

                  return (
                    <CommandItem
                      key={item.id}
                      item={item}
                      isActive={isActive}
                      onClick={() => executeCommand(item)}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                      dataIndex={itemIndex}
                    />
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">↑↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">↵</kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">esc</kbd>
                to close
              </span>
            </div>
            <span>{flatItems.length} commands</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// COMMAND ITEM
// ============================================

interface CommandItemProps {
  item: CommandItem
  isActive: boolean
  onClick: () => void
  onMouseEnter: () => void
  dataIndex: number
}

function CommandItem({ item, isActive, onClick, onMouseEnter, dataIndex }: CommandItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
        isActive
          ? 'bg-primary/10 text-foreground'
          : 'text-foreground/80 hover:bg-muted',
        item.disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      disabled={item.disabled}
      data-index={dataIndex}
    >
      {item.icon && (
        <span className="flex-shrink-0 text-muted-foreground">{item.icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        {item.description && (
          <div className="text-xs text-muted-foreground truncate">
            {item.description}
          </div>
        )}
      </div>
      {item.shortcut && (
        <kbd className="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs text-muted-foreground">
          {formatKeyCombo(item.shortcut)}
        </kbd>
      )}
    </button>
  )
}

// ============================================
// USE COMMAND PALETTE
// ============================================

interface UseCommandPaletteOptions {
  items: CommandItem[]
  shortcut?: string
  recentStorageKey?: string
}

export function useCommandPalette({
  items,
  shortcut = 'meta+k',
  recentStorageKey = 'command-palette-recent',
}: UseCommandPaletteOptions) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [recentItems, setRecentItems] = React.useState<CommandItem[]>([])

  // Load recent items from storage
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(recentStorageKey)
    if (stored) {
      try {
        const recentIds = JSON.parse(stored) as string[]
        const recent = recentIds
          .map(id => items.find(i => i.id === id))
          .filter((i): i is CommandItem => !!i)
        setRecentItems(recent)
      } catch {
        // Ignore parse errors
      }
    }
  }, [items, recentStorageKey])

  // Register shortcut to open
  useShortcut(shortcut, () => setIsOpen(true), {
    id: 'open-command-palette',
    name: 'Open Command Palette',
    category: 'search',
    global: true,
  })

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])

  // Wrap items with recent tracking
  const wrappedItems = React.useMemo(() => {
    return items.map(item => ({
      ...item,
      action: async () => {
        // Add to recent
        setRecentItems(prev => {
          const filtered = prev.filter(i => i.id !== item.id)
          const updated = [item, ...filtered].slice(0, 10)

          // Save to storage
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              recentStorageKey,
              JSON.stringify(updated.map(i => i.id))
            )
          }

          return updated
        })

        // Execute original action
        await item.action()
      },
    }))
  }, [items, recentStorageKey])

  return {
    isOpen,
    open,
    close,
    items: wrappedItems,
    recentItems,
    CommandPalette: (
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        items={wrappedItems}
        recentItems={recentItems}
      />
    ),
  }
}
