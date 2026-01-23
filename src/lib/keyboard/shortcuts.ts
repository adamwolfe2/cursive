/**
 * Keyboard Shortcuts System
 * OpenInfo Platform
 *
 * Global keyboard shortcut management and utilities.
 */

// ============================================
// TYPES
// ============================================

export type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta'
export type KeyCombo = string // e.g., "ctrl+k", "meta+shift+p"

export interface ShortcutAction {
  id: string
  name: string
  description?: string
  category: ShortcutCategory
  keys: KeyCombo
  alternateKeys?: KeyCombo
  callback: () => void | Promise<void>
  enabled?: boolean | (() => boolean)
  global?: boolean // Works even when input is focused
}

export type ShortcutCategory =
  | 'navigation'
  | 'search'
  | 'actions'
  | 'editing'
  | 'view'
  | 'help'

export interface ShortcutGroup {
  category: ShortcutCategory
  label: string
  shortcuts: ShortcutAction[]
}

export interface KeyboardEvent {
  key: string
  code: string
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
  target: EventTarget | null
}

// ============================================
// KEY PARSING
// ============================================

const KEY_ALIASES: Record<string, string> = {
  cmd: 'meta',
  command: 'meta',
  control: 'ctrl',
  option: 'alt',
  return: 'enter',
  escape: 'esc',
  space: ' ',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
}

const MODIFIER_KEYS: KeyModifier[] = ['ctrl', 'alt', 'shift', 'meta']

export function parseKeyCombo(combo: KeyCombo): {
  modifiers: KeyModifier[]
  key: string
} {
  const parts = combo.toLowerCase().split('+').map(p => p.trim())
  const modifiers: KeyModifier[] = []
  let key = ''

  for (const part of parts) {
    const normalized = KEY_ALIASES[part] || part

    if (MODIFIER_KEYS.includes(normalized as KeyModifier)) {
      modifiers.push(normalized as KeyModifier)
    } else {
      key = normalized
    }
  }

  return { modifiers, key }
}

export function normalizeKey(key: string): string {
  const normalized = key.toLowerCase()
  return KEY_ALIASES[normalized] || normalized
}

export function matchesKeyCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const { modifiers, key } = parseKeyCombo(combo)
  const eventKey = normalizeKey(event.key)

  // Check if all required modifiers are pressed
  const modifiersMatch =
    modifiers.includes('ctrl') === event.ctrlKey &&
    modifiers.includes('alt') === event.altKey &&
    modifiers.includes('shift') === event.shiftKey &&
    modifiers.includes('meta') === event.metaKey

  // Check if the key matches
  const keyMatches = eventKey === key || normalizeKey(event.code.replace('Key', '').toLowerCase()) === key

  return modifiersMatch && keyMatches
}

// ============================================
// FORMATTING
// ============================================

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

const KEY_DISPLAY_NAMES: Record<string, string> = {
  meta: isMac ? '⌘' : 'Win',
  ctrl: isMac ? '⌃' : 'Ctrl',
  alt: isMac ? '⌥' : 'Alt',
  shift: isMac ? '⇧' : 'Shift',
  enter: '↵',
  escape: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  backspace: '⌫',
  delete: 'Del',
  tab: 'Tab',
  ' ': 'Space',
}

export function formatKeyCombo(combo: KeyCombo, platform?: 'mac' | 'windows'): string {
  const { modifiers, key } = parseKeyCombo(combo)
  const useMac = platform === 'mac' || (platform === undefined && isMac)

  const formattedModifiers = modifiers.map(mod => {
    if (mod === 'meta' && !useMac) return 'Ctrl'
    if (mod === 'ctrl' && useMac) return '⌃'
    return KEY_DISPLAY_NAMES[mod] || mod
  })

  const formattedKey = KEY_DISPLAY_NAMES[key] || key.toUpperCase()

  if (useMac) {
    return [...formattedModifiers, formattedKey].join('')
  }

  return [...formattedModifiers, formattedKey].join('+')
}

export function formatKeyComboHTML(combo: KeyCombo): string {
  const { modifiers, key } = parseKeyCombo(combo)

  const parts = [
    ...modifiers.map(mod => `<kbd>${KEY_DISPLAY_NAMES[mod] || mod}</kbd>`),
    `<kbd>${KEY_DISPLAY_NAMES[key] || key.toUpperCase()}</kbd>`,
  ]

  return parts.join(' ')
}

// ============================================
// SHORTCUT MANAGER
// ============================================

type ShortcutCallback = () => void | Promise<void>
type UnsubscribeFn = () => void

class ShortcutManager {
  private shortcuts: Map<string, ShortcutAction> = new Map()
  private enabled: boolean = true
  private listeners: Set<(shortcuts: ShortcutAction[]) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown)
    }
  }

  private handleKeyDown = (event: globalThis.KeyboardEvent) => {
    if (!this.enabled) return

    // Skip if typing in an input, textarea, or contenteditable
    const target = event.target as HTMLElement
    const isInputFocused =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    for (const shortcut of Array.from(this.shortcuts.values())) {
      // Check if shortcut is enabled
      const isEnabled =
        typeof shortcut.enabled === 'function'
          ? shortcut.enabled()
          : shortcut.enabled !== false

      if (!isEnabled) continue

      // Skip non-global shortcuts when input is focused
      if (isInputFocused && !shortcut.global) continue

      // Check primary keys
      if (matchesKeyCombo(event, shortcut.keys)) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.callback()
        return
      }

      // Check alternate keys
      if (shortcut.alternateKeys && matchesKeyCombo(event, shortcut.alternateKeys)) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.callback()
        return
      }
    }
  }

  register(action: ShortcutAction): UnsubscribeFn {
    this.shortcuts.set(action.id, action)
    this.notifyListeners()

    return () => {
      this.shortcuts.delete(action.id)
      this.notifyListeners()
    }
  }

  registerMany(actions: ShortcutAction[]): UnsubscribeFn {
    for (const action of actions) {
      this.shortcuts.set(action.id, action)
    }
    this.notifyListeners()

    return () => {
      for (const action of actions) {
        this.shortcuts.delete(action.id)
      }
      this.notifyListeners()
    }
  }

  unregister(id: string): void {
    this.shortcuts.delete(id)
    this.notifyListeners()
  }

  getAll(): ShortcutAction[] {
    return Array.from(this.shortcuts.values())
  }

  getByCategory(category: ShortcutCategory): ShortcutAction[] {
    return this.getAll().filter(s => s.category === category)
  }

  getGrouped(): ShortcutGroup[] {
    const categoryLabels: Record<ShortcutCategory, string> = {
      navigation: 'Navigation',
      search: 'Search',
      actions: 'Actions',
      editing: 'Editing',
      view: 'View',
      help: 'Help',
    }

    const groups: ShortcutGroup[] = []

    for (const category of Object.keys(categoryLabels) as ShortcutCategory[]) {
      const shortcuts = this.getByCategory(category)
      if (shortcuts.length > 0) {
        groups.push({
          category,
          label: categoryLabels[category],
          shortcuts,
        })
      }
    }

    return groups
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  subscribe(callback: (shortcuts: ShortcutAction[]) => void): UnsubscribeFn {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    const shortcuts = this.getAll()
    Array.from(this.listeners).forEach(listener => {
      listener(shortcuts)
    })
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown)
    }
    this.shortcuts.clear()
    this.listeners.clear()
  }
}

// Singleton instance
export const shortcutManager = typeof window !== 'undefined' ? new ShortcutManager() : null

// ============================================
// DEFAULT SHORTCUTS
// ============================================

export const DEFAULT_SHORTCUTS: Omit<ShortcutAction, 'callback'>[] = [
  // Navigation
  {
    id: 'goto-dashboard',
    name: 'Go to Dashboard',
    keys: 'meta+shift+d',
    alternateKeys: 'ctrl+shift+d',
    category: 'navigation',
    global: true,
  },
  {
    id: 'goto-leads',
    name: 'Go to Leads',
    keys: 'meta+shift+l',
    alternateKeys: 'ctrl+shift+l',
    category: 'navigation',
    global: true,
  },
  {
    id: 'goto-queries',
    name: 'Go to Queries',
    keys: 'meta+shift+q',
    alternateKeys: 'ctrl+shift+q',
    category: 'navigation',
    global: true,
  },
  {
    id: 'goto-settings',
    name: 'Go to Settings',
    keys: 'meta+,',
    alternateKeys: 'ctrl+,',
    category: 'navigation',
    global: true,
  },

  // Search
  {
    id: 'open-search',
    name: 'Open Search',
    keys: 'meta+k',
    alternateKeys: 'ctrl+k',
    category: 'search',
    global: true,
  },
  {
    id: 'open-command-palette',
    name: 'Open Command Palette',
    keys: 'meta+shift+p',
    alternateKeys: 'ctrl+shift+p',
    category: 'search',
    global: true,
  },

  // Actions
  {
    id: 'new-query',
    name: 'New Query',
    keys: 'meta+n',
    alternateKeys: 'ctrl+n',
    category: 'actions',
    global: true,
  },
  {
    id: 'save',
    name: 'Save',
    keys: 'meta+s',
    alternateKeys: 'ctrl+s',
    category: 'actions',
  },
  {
    id: 'export',
    name: 'Export',
    keys: 'meta+e',
    alternateKeys: 'ctrl+e',
    category: 'actions',
  },

  // View
  {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    keys: 'meta+b',
    alternateKeys: 'ctrl+b',
    category: 'view',
    global: true,
  },
  {
    id: 'toggle-fullscreen',
    name: 'Toggle Fullscreen',
    keys: 'f11',
    category: 'view',
    global: true,
  },

  // Help
  {
    id: 'show-shortcuts',
    name: 'Show Keyboard Shortcuts',
    keys: 'meta+/',
    alternateKeys: 'ctrl+/',
    category: 'help',
    global: true,
  },
]

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function isInputElement(element: Element | null): boolean {
  if (!element) return false

  const tagName = element.tagName
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    (element as HTMLElement).isContentEditable
  )
}

export function getActiveElement(): Element | null {
  return document.activeElement
}

export function blurActiveElement(): void {
  const active = getActiveElement()
  if (active && 'blur' in active) {
    (active as HTMLElement).blur()
  }
}
