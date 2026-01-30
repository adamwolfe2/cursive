/**
 * Reusable Spring Configuration Presets
 * For use with Framer Motion spring animations
 */

export const springConfigs = {
  // Snappy - Quick, responsive interactions (buttons, toggles)
  snappy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1
  },

  // Bouncy - Playful with noticeable bounce (notifications, celebrations)
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 20,
    mass: 1
  },

  // Smooth - Balanced, professional feel (modals, dropdowns)
  smooth: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
    mass: 1
  },

  // Gentle - Soft, subtle motion (page transitions, fades)
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
    mass: 1
  },

  // Stiff - Minimal overshoot (precise interactions)
  stiff: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 40,
    mass: 1
  },

  // Wobbly - Maximum bounce (fun interactions, gamification)
  wobbly: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
    mass: 1
  }
}

// Transition presets for non-spring animations
export const transitionConfigs = {
  // Quick fade/slide
  quick: {
    duration: 0.15,
    ease: [0, 0, 0.2, 1] // easeOut
  },

  // Default transitions
  default: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1] // easeInOut
  },

  // Slow, smooth transitions
  slow: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1]
  },

  // Sharp, snappy (no easing)
  sharp: {
    duration: 0.1,
    ease: 'linear' as const
  }
}

// Layout transition configs (for layout animations)
export const layoutTransitions = {
  default: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30
  },

  smooth: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25
  }
}

// Recommended use cases
export const recommendedUsage = {
  // Button interactions
  button: springConfigs.snappy,

  // Modal/Dialog entrance
  modal: springConfigs.smooth,

  // Dropdown/Popover
  dropdown: transitionConfigs.quick,

  // Page transitions
  page: springConfigs.gentle,

  // Toast notifications
  toast: springConfigs.snappy,

  // Checkbox/Toggle
  toggle: springConfigs.bouncy,

  // Drag & Drop
  drag: springConfigs.stiff,

  // Success celebrations
  success: springConfigs.bouncy,

  // Error shake
  error: transitionConfigs.sharp,

  // Loading states
  loading: transitionConfigs.slow,

  // List/Table items
  list: transitionConfigs.default
}
