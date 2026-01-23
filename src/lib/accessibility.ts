/**
 * Accessibility Utilities for OpenInfo Platform
 *
 * This file contains helper functions and constants for accessibility compliance.
 */

// ============================================
// ARIA UTILITIES
// ============================================

/**
 * Generate a unique ID for ARIA relationships
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create aria-describedby value from multiple IDs
 */
export function combineAriaDescribedBy(...ids: (string | undefined | null)[]): string | undefined {
  const validIds = ids.filter(Boolean) as string[]
  return validIds.length > 0 ? validIds.join(' ') : undefined
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

export const Keys = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  Tab: 'Tab',
} as const

/**
 * Check if a key event matches specified keys
 */
export function isKey(event: KeyboardEvent | React.KeyboardEvent, keys: string | string[]): boolean {
  const keyList = Array.isArray(keys) ? keys : [keys]
  return keyList.includes(event.key)
}

/**
 * Handle keyboard navigation for a list of items
 */
export function handleListKeyboardNavigation(
  event: KeyboardEvent | React.KeyboardEvent,
  currentIndex: number,
  itemCount: number,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): number | null {
  const prevKey = orientation === 'vertical' ? Keys.ArrowUp : Keys.ArrowLeft
  const nextKey = orientation === 'vertical' ? Keys.ArrowDown : Keys.ArrowRight

  switch (event.key) {
    case prevKey:
      event.preventDefault()
      return currentIndex > 0 ? currentIndex - 1 : itemCount - 1
    case nextKey:
      event.preventDefault()
      return currentIndex < itemCount - 1 ? currentIndex + 1 : 0
    case Keys.Home:
      event.preventDefault()
      return 0
    case Keys.End:
      event.preventDefault()
      return itemCount - 1
    default:
      return null
  }
}

// ============================================
// FOCUS MANAGEMENT
// ============================================

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
}

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== Keys.Tab) return

  const focusableElements = getFocusableElements(container)
  if (focusableElements.length === 0) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirst(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container)
  if (focusableElements.length > 0) {
    focusableElements[0].focus()
  }
}

// ============================================
// SCREEN READER UTILITIES
// ============================================

/**
 * Announce a message to screen readers using aria-live
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// ============================================
// REDUCED MOTION
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ============================================
// COLOR CONTRAST
// ============================================

/**
 * Check if a color has sufficient contrast ratio
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function meetsContrastRatio(
  foreground: string,
  background: string,
  largeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  return largeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Get relative luminance of a color
 */
function getLuminance(color: string): number {
  const rgb = parseColor(color)
  if (!rgb) return 0

  const [r, g, b] = rgb.map((val) => {
    val = val / 255
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Parse a color string to RGB values
 */
function parseColor(color: string): [number, number, number] | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ]
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ]
    }
  }

  // Handle rgb/rgba colors
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
  }

  return null
}

// ============================================
// FORM ACCESSIBILITY
// ============================================

export interface FormFieldA11y {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

/**
 * Generate accessibility props for a form field
 */
export function getFormFieldA11yProps(
  id: string,
  options: {
    error?: string | boolean
    description?: string
    required?: boolean
  } = {}
): FormFieldA11y {
  const { error, description, required } = options
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined

  return {
    id,
    'aria-describedby': combineAriaDescribedBy(descriptionId, errorId),
    'aria-invalid': !!error || undefined,
    'aria-required': required || undefined,
  }
}
