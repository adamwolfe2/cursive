// Animation constants for consistent motion design across the dashboard
// Based on Material Design and modern SaaS best practices

export const ANIMATION_DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const

export const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25,
}

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

// Page transition animations
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: ANIMATION_DURATIONS.normal, ease: EASE_OUT },
}

// Stagger children animations
export const STAGGER_CHILDREN = {
  staggerChildren: 0.05,
  delayChildren: 0.1,
}

// Card hover animations
export const CARD_HOVER = {
  scale: 1.02,
  y: -4,
  transition: SPRING_CONFIG,
}

export const CARD_TAP = {
  scale: 0.98,
  transition: { ...SPRING_CONFIG, stiffness: 400 },
}

// Fade in animations
export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: ANIMATION_DURATIONS.normal },
}

// Slide up animations
export const SLIDE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: ANIMATION_DURATIONS.normal, ease: EASE_OUT },
}

// Scale animations
export const SCALE_IN = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: ANIMATION_DURATIONS.normal, ease: EASE_OUT },
}

// Success celebration animation
export const SUCCESS_ANIMATION = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1,
  },
  transition: {
    duration: 0.5,
    ease: EASE_OUT,
    times: [0, 0.6, 1],
  },
}
