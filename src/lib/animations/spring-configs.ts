/**
 * Reusable spring configurations for natural motion.
 * Use these with Framer Motion's animate prop.
 */

export const springConfigs = {
  // Snappy interactions (buttons, toggles)
  snappy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },

  // Bouncy animations (empty states, success indicators)
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 20,
  },

  // Smooth transitions (modals, drawers)
  smooth: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },

  // Gentle animations (page transitions, fades)
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
  },

  // Stiff spring (instant feedback)
  stiff: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },
} as const

/**
 * Easing curves for non-spring transitions
 */
export const easings = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeInOut: [0.65, 0, 0.35, 1],
  bounce: [0.34, 1.56, 0.64, 1],
} as const
