/**
 * A/B Testing Infrastructure
 * OpenInfo Platform Marketing Site
 *
 * Client-side A/B testing utilities.
 */

'use client'

import * as React from 'react'

// ============================================
// TYPES
// ============================================

export interface Experiment {
  id: string
  name: string
  variants: Variant[]
  traffic?: number // Percentage of traffic to include (0-100)
}

export interface Variant {
  id: string
  name: string
  weight: number // Relative weight for distribution
}

export interface ExperimentAssignment {
  experimentId: string
  variantId: string
  timestamp: number
}

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'openinfo_experiments'

function getStoredAssignments(): Record<string, ExperimentAssignment> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function storeAssignment(assignment: ExperimentAssignment): void {
  if (typeof window === 'undefined') return

  try {
    const assignments = getStoredAssignments()
    assignments[assignment.experimentId] = assignment
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
  } catch {
    // Storage failed, continue without persistence
  }
}

// ============================================
// VARIANT SELECTION
// ============================================

/**
 * Generate a stable hash from a string
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Get a stable user ID for experiment assignment
 */
function getUserId(): string {
  if (typeof window === 'undefined') return 'server'

  const storageKey = 'openinfo_user_id'

  try {
    let userId = localStorage.getItem(storageKey)
    if (!userId) {
      userId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      localStorage.setItem(storageKey, userId)
    }
    return userId
  } catch {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

/**
 * Select a variant based on weights
 */
function selectVariant(experiment: Experiment, userId: string): Variant {
  const hash = hashCode(`${experiment.id}-${userId}`)
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0)
  let target = hash % totalWeight

  for (const variant of experiment.variants) {
    target -= variant.weight
    if (target < 0) {
      return variant
    }
  }

  return experiment.variants[0]
}

/**
 * Check if user should be included in experiment
 */
function shouldIncludeUser(experiment: Experiment, userId: string): boolean {
  if (!experiment.traffic || experiment.traffic >= 100) return true

  const hash = hashCode(`${experiment.id}-traffic-${userId}`)
  return (hash % 100) < experiment.traffic
}

// ============================================
// MAIN API
// ============================================

/**
 * Get variant assignment for an experiment
 */
export function getVariant(experiment: Experiment): Variant | null {
  const userId = getUserId()

  // Check if user should be in experiment
  if (!shouldIncludeUser(experiment, userId)) {
    return null
  }

  // Check for existing assignment
  const assignments = getStoredAssignments()
  const existing = assignments[experiment.id]

  if (existing) {
    const variant = experiment.variants.find(v => v.id === existing.variantId)
    if (variant) return variant
  }

  // Assign new variant
  const variant = selectVariant(experiment, userId)

  storeAssignment({
    experimentId: experiment.id,
    variantId: variant.id,
    timestamp: Date.now(),
  })

  return variant
}

/**
 * Track experiment event
 */
export function trackExperimentEvent(
  experimentId: string,
  eventName: string,
  eventData?: Record<string, unknown>
): void {
  const assignments = getStoredAssignments()
  const assignment = assignments[experimentId]

  if (!assignment) return

  // In production, send to analytics
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to your analytics service
    // analytics.track(eventName, {
    //   experimentId,
    //   variantId: assignment.variantId,
    //   ...eventData,
    // })
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[A/B Test Event]', {
      experimentId,
      variantId: assignment.variantId,
      eventName,
      eventData,
    })
  }
}

/**
 * Track conversion for an experiment
 */
export function trackConversion(experimentId: string, value?: number): void {
  trackExperimentEvent(experimentId, 'conversion', { value })
}

// ============================================
// REACT HOOKS
// ============================================

/**
 * Hook to get variant for an experiment
 */
export function useExperiment(experiment: Experiment): {
  variant: Variant | null
  isLoading: boolean
  trackEvent: (eventName: string, eventData?: Record<string, unknown>) => void
  trackConversion: (value?: number) => void
} {
  const [variant, setVariant] = React.useState<Variant | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const assignedVariant = getVariant(experiment)
    setVariant(assignedVariant)
    setIsLoading(false)

    // Track experiment view
    if (assignedVariant) {
      trackExperimentEvent(experiment.id, 'view')
    }
  }, [experiment])

  const trackEventFn = React.useCallback(
    (eventName: string, eventData?: Record<string, unknown>) => {
      trackExperimentEvent(experiment.id, eventName, eventData)
    },
    [experiment.id]
  )

  const trackConversionFn = React.useCallback(
    (value?: number) => {
      trackConversion(experiment.id, value)
    },
    [experiment.id]
  )

  return {
    variant,
    isLoading,
    trackEvent: trackEventFn,
    trackConversion: trackConversionFn,
  }
}

// ============================================
// EXPERIMENT COMPONENTS
// ============================================

interface ExperimentProps {
  experiment: Experiment
  children: (variant: Variant | null, isLoading: boolean) => React.ReactNode
}

/**
 * Component for rendering experiment variants
 */
export function Experiment({ experiment, children }: ExperimentProps) {
  const { variant, isLoading } = useExperiment(experiment)
  return <>{children(variant, isLoading)}</>
}

interface VariantProps {
  experiment: Experiment
  variantId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Component that only renders for a specific variant
 */
export function Variant({
  experiment,
  variantId,
  children,
  fallback = null,
}: VariantProps) {
  const { variant, isLoading } = useExperiment(experiment)

  if (isLoading) return <>{fallback}</>
  if (variant?.id !== variantId) return <>{fallback}</>

  return <>{children}</>
}

// ============================================
// PREDEFINED EXPERIMENTS
// ============================================

export const experiments = {
  /**
   * Hero CTA button text experiment
   */
  heroCtaText: {
    id: 'hero-cta-text',
    name: 'Hero CTA Button Text',
    variants: [
      { id: 'control', name: 'Get Started Free', weight: 50 },
      { id: 'variant-a', name: 'Start Free Trial', weight: 25 },
      { id: 'variant-b', name: 'Try It Now', weight: 25 },
    ],
  } as Experiment,

  /**
   * Pricing page layout experiment
   */
  pricingLayout: {
    id: 'pricing-layout',
    name: 'Pricing Page Layout',
    variants: [
      { id: 'control', name: 'Three columns', weight: 50 },
      { id: 'variant-a', name: 'Two columns featured', weight: 50 },
    ],
    traffic: 50, // Only 50% of users see this experiment
  } as Experiment,

  /**
   * Social proof position experiment
   */
  socialProofPosition: {
    id: 'social-proof-position',
    name: 'Social Proof Position',
    variants: [
      { id: 'control', name: 'Below hero', weight: 50 },
      { id: 'variant-a', name: 'In hero', weight: 50 },
    ],
  } as Experiment,
}

// ============================================
// DEBUG UTILITIES
// ============================================

/**
 * Force a specific variant (for testing)
 */
export function forceVariant(experimentId: string, variantId: string): void {
  if (typeof window === 'undefined') return

  storeAssignment({
    experimentId,
    variantId,
    timestamp: Date.now(),
  })
}

/**
 * Clear all experiment assignments
 */
export function clearExperiments(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Get all current assignments
 */
export function getAssignments(): Record<string, ExperimentAssignment> {
  return getStoredAssignments()
}
