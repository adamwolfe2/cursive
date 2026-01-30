/**
 * Centralized animation variants for consistent micro-interactions.
 * All animations use GPU-accelerated properties (transform, opacity) only.
 */

export const animationVariants = {
  // Button interactions
  buttonHover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  buttonPress: {
    scale: 0.98,
    transition: { duration: 0.1, ease: 'easeIn' },
  },

  // Fade animations
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  fadeInFast: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },

  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  modalScale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },

  // Stagger container
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  },

  staggerContainerFast: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.02,
      },
    },
  },

  // Stagger item
  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  // Table row hover
  rowHover: {
    scale: 1.01,
    transition: { duration: 0.15, ease: 'easeOut' },
  },

  // Checkbox draw (for SVG path)
  checkboxDraw: {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },

  // Input shake (validation error)
  shake: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 },
    },
  },

  // Toast slide in from top
  toastSlideIn: {
    initial: { opacity: 0, y: -100, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },

  // Empty state bounce
  emptyStateBounce: {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1], // Bounce easing
      },
    },
  },

  // Drawer slide
  drawerSlideRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },

  drawerSlideLeft: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
} as const

/**
 * Transition presets for consistent timing
 */
export const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' },
  base: { duration: 0.2, ease: 'easeOut' },
  slow: { duration: 0.3, ease: 'easeOut' },
  bounce: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 20 },
} as const
