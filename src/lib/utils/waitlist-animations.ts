/**
 * Framer Motion Animation Variants
 * Reusable animation configurations for waitlist flow
 */

import { Variants } from 'framer-motion'

// Screen transition animations - Typeform-style slide up from bottom
export const screenVariants: Variants = {
  initial: {
    y: '100%',
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1], // smooth easeInOut
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    y: '-100%',
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 1, 1], // easeIn for exit
    },
  },
}

// Card hover animations - smooth lift effect
export const cardVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.015,
    y: -2,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: 0.1,
      ease: 'easeOut',
    },
  },
}

// Button click animations - subtle scale
export const buttonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.008,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeOut',
    },
  },
}

// Success checkmark animation
export const checkmarkVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1], // spring-like easing
      times: [0, 0.6, 1],
    },
  },
}

// Fade in animation for text
export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
      delay: 0.2,
    },
  },
}

// Text reveal animation - subtle slide up with fade
export const textRevealVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Heading animation - larger slide up for headlines
export const headingVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Progress bar animation
export const progressVariants: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  animate: (progress: number) => ({
    scaleX: progress,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
}

// Stagger children animation - smooth sequential reveal
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.2, // Increased for more noticeable cascade
      delayChildren: 0.2,
    },
  },
}

// Stagger item animation - smooth slide up
export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Fast stagger for option buttons - noticeable cascade
export const fastStaggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08, // Increased from 15ms to 80ms for more visible flow
      delayChildren: 0.3,
    },
  },
}

// Option button stagger item - quick, smooth reveal
export const optionItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 15,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Logo animation - centered, large logo reveal
export const logoVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}
