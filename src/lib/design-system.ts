/**
 * OpenInfo Enterprise Design System
 *
 * This file contains all design tokens and constants for the enterprise UI.
 * Use these values for consistency across all components.
 */

// ============================================
// COLOR TOKENS
// ============================================

export const colors = {
  // Brand
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Success
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Destructive
  destructive: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Info
  info: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },

  // Neutral (Gray)
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
} as const

// ============================================
// SPACING TOKENS
// ============================================

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const

// ============================================
// TYPOGRAPHY TOKENS
// ============================================

export const typography = {
  fontSizes: {
    '2xs': '0.625rem',   // 10px
    xs: '0.75rem',       // 12px
    sm: '0.875rem',      // 14px
    base: '1rem',        // 16px
    lg: '1.125rem',      // 18px
    xl: '1.25rem',       // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ============================================
// BORDER TOKENS
// ============================================

export const borders = {
  radius: {
    none: '0',
    sm: '0.375rem',
    DEFAULT: '0.5rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },
  widths: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
} as const

// ============================================
// SHADOW TOKENS
// ============================================

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const

// ============================================
// TRANSITION TOKENS
// ============================================

export const transitions = {
  durations: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easings: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const

// ============================================
// Z-INDEX TOKENS
// ============================================

export const zIndex = {
  behind: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================
// COMPONENT SIZE VARIANTS
// ============================================

export const componentSizes = {
  button: {
    xs: { height: '1.75rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem' },
    sm: { height: '2rem', padding: '0.5rem 1rem', fontSize: '0.875rem' },
    md: { height: '2.5rem', padding: '0.625rem 1.25rem', fontSize: '0.875rem' },
    lg: { height: '2.75rem', padding: '0.75rem 1.5rem', fontSize: '1rem' },
    xl: { height: '3rem', padding: '1rem 2rem', fontSize: '1rem' },
  },
  input: {
    sm: { height: '2rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem' },
    md: { height: '2.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' },
    lg: { height: '3rem', padding: '0.75rem 1.25rem', fontSize: '1rem' },
  },
  avatar: {
    xs: { size: '1.5rem', fontSize: '0.625rem' },
    sm: { size: '2rem', fontSize: '0.75rem' },
    md: { size: '2.5rem', fontSize: '0.875rem' },
    lg: { size: '3rem', fontSize: '1rem' },
    xl: { size: '4rem', fontSize: '1.25rem' },
    '2xl': { size: '5rem', fontSize: '1.5rem' },
  },
  icon: {
    xs: '0.875rem',
    sm: '1rem',
    md: '1.25rem',
    lg: '1.5rem',
    xl: '2rem',
  },
} as const

// ============================================
// STATUS COLORS
// ============================================

export const statusColors = {
  active: { bg: 'bg-success-muted', text: 'text-success', dot: 'bg-success' },
  paused: { bg: 'bg-warning-muted', text: 'text-warning', dot: 'bg-warning' },
  error: { bg: 'bg-destructive-muted', text: 'text-destructive', dot: 'bg-destructive' },
  pending: { bg: 'bg-info-muted', text: 'text-info', dot: 'bg-info' },
  inactive: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
} as const

// ============================================
// INTENT COLORS (Lead Scoring)
// ============================================

export const intentColors = {
  hot: { bg: 'bg-destructive-muted', text: 'text-destructive', border: 'border-destructive/30' },
  warm: { bg: 'bg-warning-muted', text: 'text-warning', border: 'border-warning/30' },
  cold: { bg: 'bg-info-muted', text: 'text-info', border: 'border-info/30' },
} as const

// ============================================
// PLAN BADGES
// ============================================

export const planColors = {
  free: { bg: 'bg-muted', text: 'text-muted-foreground' },
  pro: { bg: 'bg-primary-muted', text: 'text-primary' },
  enterprise: { bg: 'bg-primary', text: 'text-primary-foreground' },
} as const

// ============================================
// ENRICHMENT STATUS COLORS
// ============================================

export const enrichmentColors = {
  enriched: { bg: 'bg-success-muted', text: 'text-success' },
  pending: { bg: 'bg-warning-muted', text: 'text-warning' },
  failed: { bg: 'bg-destructive-muted', text: 'text-destructive' },
  new: { bg: 'bg-info-muted', text: 'text-info' },
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status color classes
 */
export function getStatusClasses(status: keyof typeof statusColors) {
  return statusColors[status]
}

/**
 * Get intent color classes
 */
export function getIntentClasses(intent: keyof typeof intentColors) {
  return intentColors[intent]
}

/**
 * Get plan color classes
 */
export function getPlanClasses(plan: keyof typeof planColors) {
  return planColors[plan]
}

/**
 * Get enrichment status color classes
 */
export function getEnrichmentClasses(status: keyof typeof enrichmentColors) {
  return enrichmentColors[status]
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}...`
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Class name merge utility
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
