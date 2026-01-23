/**
 * Keyboard Shortcuts Library Index
 * OpenInfo Platform
 *
 * Export all keyboard shortcut utilities and hooks.
 */

// Core shortcuts
export {
  // Types
  type KeyModifier,
  type KeyCombo,
  type ShortcutAction,
  type ShortcutCategory,
  type ShortcutGroup,
  type KeyboardEvent,

  // Parsing & matching
  parseKeyCombo,
  normalizeKey,
  matchesKeyCombo,

  // Formatting
  formatKeyCombo,
  formatKeyComboHTML,

  // Manager
  shortcutManager,

  // Default shortcuts
  DEFAULT_SHORTCUTS,

  // Utilities
  isInputElement,
  getActiveElement,
  blurActiveElement,
} from './shortcuts'

// React hooks
export {
  useShortcut,
  useShortcuts,
  useAllShortcuts,
  useShortcutGroups,
  useKeyPress,
  useHotkey,
  useEscapeKey,
  useArrowNavigation,
  useTypeAhead,
  useFocusTrap,
  useKeyComboDisplay,
} from './hooks'
