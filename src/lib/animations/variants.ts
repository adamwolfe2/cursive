/**
 * Centralized Animation Variants
 * Consistent motion design patterns using Framer Motion
 */

export const animationVariants = {
  // ========== BUTTON INTERACTIONS ==========
  buttonHover: {
    scale: 1.02,
    transition: { duration: 0.15 }
  },

  buttonPress: {
    scale: 0.98,
    transition: { duration: 0.1 }
  },

  buttonGlow: {
    boxShadow: [
      '0 0 0 0 rgba(59, 130, 246, 0)',
      '0 0 0 4px rgba(59, 130, 246, 0.1)',
      '0 0 0 0 rgba(59, 130, 246, 0)'
    ],
    transition: { duration: 0.6 }
  },

  // ========== FADE ANIMATIONS ==========
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2 }
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3 }
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  },

  // ========== SLIDE ANIMATIONS ==========
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  },

  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  },

  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  },

  // ========== SCALE ANIMATIONS ==========
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 }
  },

  scaleUp: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  },

  // ========== BOUNCE ANIMATIONS ==========
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 20
      }
    }
  },

  gentleBounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  // ========== STAGGER CONTAINERS ==========
  staggerContainer: {
    animate: {
      transition: { staggerChildren: 0.1 }
    }
  },

  staggerFast: {
    animate: {
      transition: { staggerChildren: 0.05 }
    }
  },

  staggerSlow: {
    animate: {
      transition: { staggerChildren: 0.15 }
    }
  },

  // ========== FORM ANIMATIONS ==========
  inputFocus: {
    scale: 1.01,
    borderColor: 'rgb(59, 130, 246)',
    transition: { duration: 0.2 }
  },

  labelFloat: {
    initial: { y: 0, fontSize: '14px' },
    animate: { y: -20, fontSize: '12px' },
    transition: { duration: 0.2 }
  },

  shake: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    }
  },

  // ========== CHECKBOX/RADIO ==========
  checkboxDraw: {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  },

  checkboxScale: {
    initial: { scale: 0 },
    animate: {
      scale: 1,
      transition: { type: 'spring', stiffness: 400, damping: 20 }
    }
  },

  // ========== TABLE/LIST ANIMATIONS ==========
  tableRowHover: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    y: -1,
    transition: { duration: 0.15 }
  },

  listItemSlide: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.2 }
  },

  // ========== MODAL/DIALOG ==========
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { duration: 0.2 }
  },

  // ========== DROPDOWN/POPOVER ==========
  dropdownSlide: {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.15 }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  },

  // ========== PAGE TRANSITIONS ==========
  pageTransition: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 }
  },

  // ========== TOAST/NOTIFICATION ==========
  toastSlideIn: {
    initial: { opacity: 0, y: -50, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: {
      opacity: 0,
      y: -50,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  },

  // ========== LOADING ==========
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  }
}

// Animation duration presets
export const durations = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  verySlow: 0.4
}

// Easing presets
export const easings = {
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  sharp: [0.4, 0, 0.6, 1]
}
