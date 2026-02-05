/**
 * Popup System Types
 * Shared types for popup components and hooks
 */

export type PopupVariant = 'exit-intent' | 'scroll-based' | 'time-delayed' | 'click-triggered'

export interface PopupConfig {
  id: string
  variant: PopupVariant
  enabled: boolean
  trigger: {
    // Exit Intent
    exitIntent?: boolean
    // Scroll-based
    scrollDepth?: number // percentage (0-100)
    // Time-based
    timeDelay?: number // milliseconds
    // Click-triggered
    clickSelector?: string
  }
  frequency: {
    maxShowsPerSession?: number
    cooldownDays?: number // days before showing again after dismiss
    respectDismissal?: boolean
  }
  targeting: {
    includePages?: string[] // regex patterns
    excludePages?: string[] // regex patterns
    newVisitorsOnly?: boolean
    returningVisitorsOnly?: boolean
  }
}

export interface PopupState {
  isOpen: boolean
  hasBeenShown: boolean
  lastShownAt: number | null
  lastDismissedAt: number | null
  showCount: number
}

export interface PopupFormData {
  email: string
  company?: string
  firstName?: string
  source?: string
}

export interface PopupAnalytics {
  impression: () => void
  interaction: () => void
  submission: (data: PopupFormData) => void
  dismiss: (method: 'close-button' | 'outside-click' | 'escape-key') => void
}
