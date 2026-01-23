'use client'

/**
 * Keyboard Shortcuts Help Modal
 * OpenInfo Platform
 *
 * Modal showing all available keyboard shortcuts.
 */

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Modal, ModalHeader, ModalTitle, ModalContent } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useShortcutGroups, useShortcut } from '@/lib/keyboard/hooks'
import { formatKeyCombo, type ShortcutGroup, type ShortcutAction } from '@/lib/keyboard/shortcuts'

// ============================================
// TYPES
// ============================================

export interface ShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

// ============================================
// SHORTCUTS HELP MODAL
// ============================================

export function ShortcutsHelp({ isOpen, onClose, className }: ShortcutsHelpProps) {
  const groups = useShortcutGroups()
  const [searchQuery, setSearchQuery] = React.useState('')

  // Filter shortcuts based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groups

    const query = searchQuery.toLowerCase()

    return groups
      .map(group => ({
        ...group,
        shortcuts: group.shortcuts.filter(
          s =>
            s.name.toLowerCase().includes(query) ||
            s.description?.toLowerCase().includes(query) ||
            s.keys.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.shortcuts.length > 0)
  }, [groups, searchQuery])

  // Reset search when closed
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={cn('max-w-2xl', className)}>
      <ModalHeader onClose={onClose}>
        <ModalTitle>Keyboard Shortcuts</ModalTitle>
      </ModalHeader>
      <ModalContent className="p-0">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shortcuts..."
            className="max-w-sm"
          />
        </div>

        {/* Shortcuts List */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No shortcuts found matching "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <ShortcutGroupSection key={group.category} group={group} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">?</kbd> or{' '}
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">{formatKeyCombo('meta+/')}</kbd> to toggle this help.
          </p>
        </div>
      </ModalContent>
    </Modal>
  )
}

// ============================================
// SHORTCUT GROUP SECTION
// ============================================

interface ShortcutGroupSectionProps {
  group: ShortcutGroup
}

function ShortcutGroupSection({ group }: ShortcutGroupSectionProps) {
  const categoryIcons: Record<string, React.ReactNode> = {
    navigation: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
    search: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    actions: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    editing: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    view: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    help: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted-foreground">{categoryIcons[group.category]}</span>
        <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
        <Badge variant="secondary" className="text-xs">
          {group.shortcuts.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {group.shortcuts.map((shortcut) => (
          <ShortcutRow key={shortcut.id} shortcut={shortcut} />
        ))}
      </div>
    </div>
  )
}

// ============================================
// SHORTCUT ROW
// ============================================

interface ShortcutRowProps {
  shortcut: ShortcutAction
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
      <div className="flex-1">
        <span className="text-sm text-foreground">{shortcut.name}</span>
        {shortcut.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {shortcut.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <KeyCombo combo={shortcut.keys} />
        {shortcut.alternateKeys && (
          <>
            <span className="text-xs text-muted-foreground">or</span>
            <KeyCombo combo={shortcut.alternateKeys} />
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// KEY COMBO DISPLAY
// ============================================

interface KeyComboProps {
  combo: string
  className?: string
}

export function KeyCombo({ combo, className }: KeyComboProps) {
  const formatted = formatKeyCombo(combo)
  const keys = formatted.match(/([⌘⌃⌥⇧]|[A-Z0-9]|↑|↓|←|→|↵|⌫|Tab|Esc|Space|Del)/g) || [formatted]

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="min-w-[24px] h-6 px-1.5 inline-flex items-center justify-center rounded bg-muted border border-border font-mono text-xs text-muted-foreground"
        >
          {key}
        </kbd>
      ))}
    </div>
  )
}

// ============================================
// USE SHORTCUTS HELP
// ============================================

export function useShortcutsHelp(shortcut: string = 'meta+/') {
  const [isOpen, setIsOpen] = React.useState(false)

  useShortcut(shortcut, () => setIsOpen(prev => !prev), {
    id: 'toggle-shortcuts-help',
    name: 'Toggle Keyboard Shortcuts Help',
    category: 'help',
    global: true,
  })

  // Also listen for '?' key
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if (event.key === '?' && !isInput && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
    ShortcutsHelp: <ShortcutsHelp isOpen={isOpen} onClose={() => setIsOpen(false)} />,
  }
}
