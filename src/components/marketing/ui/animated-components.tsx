'use client'

/**
 * Animated Components for Marketing Site
 * OpenInfo Platform
 *
 * Reusable animated components using Framer Motion.
 */

import * as React from 'react'
import { motion, useInView, useScroll, useTransform, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  fadeInUp,
  fadeIn,
  scaleIn,
  staggerContainer,
  staggerItem,
  scrollReveal,
  cardVariants,
  buttonVariants,
  viewportOnce,
  smoothTransition,
  hoverLift,
  tapScale,
} from '@/lib/motion'

// ============================================
// ANIMATED SECTION
// ============================================

interface AnimatedSectionProps extends HTMLMotionProps<'section'> {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  ...props
}: AnimatedSectionProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={scrollReveal}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  )
}

// ============================================
// ANIMATED CONTAINER
// ============================================

interface AnimatedContainerProps {
  children: React.ReactNode
  className?: string
  stagger?: boolean
  delay?: number
}

export function AnimatedContainer({
  children,
  className,
  stagger = true,
  delay = 0,
}: AnimatedContainerProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger ? staggerContainer : fadeIn}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// ANIMATED ITEM
// ============================================

interface AnimatedItemProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedItem({ children, className, delay = 0 }: AnimatedItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// FADE IN
// ============================================

interface FadeInProps {
  children: React.ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  delay?: number
  duration?: number
}

export function FadeIn({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.5,
}: FadeInProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const directionOffset = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
    none: {},
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, ...directionOffset[direction] }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// ANIMATED TEXT
// ============================================

interface AnimatedTextProps {
  text: string
  className?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
  delay?: number
}

export function AnimatedText({
  text,
  className,
  tag: Tag = 'p',
  delay = 0,
}: AnimatedTextProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const MotionTag = motion[Tag] as typeof motion.p

  const words = text.split(' ')

  return (
    <MotionTag ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.05,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </MotionTag>
  )
}

// ============================================
// ANIMATED HEADING
// ============================================

interface AnimatedHeadingProps {
  children: React.ReactNode
  className?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4'
  delay?: number
}

export function AnimatedHeading({
  children,
  className,
  tag: Tag = 'h2',
  delay = 0,
}: AnimatedHeadingProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const MotionTag = motion[Tag] as typeof motion.h2

  return (
    <MotionTag
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}

// ============================================
// ANIMATED CARD
// ============================================

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

export function AnimatedCard({
  children,
  className,
  hover = true,
  delay = 0,
}: AnimatedCardProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      whileHover={hover ? 'hover' : undefined}
      variants={cardVariants}
      transition={{ delay }}
      className={cn(
        'bg-white rounded-2xl border border-neutral-200/60 overflow-hidden',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// ANIMATED BUTTON
// ============================================

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: AnimatedButtonProps) {
  const variants = {
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
    outline: 'border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white',
    ghost: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={cn(
        'font-medium rounded-full transition-colors inline-flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// ============================================
// ANIMATED LINK
// ============================================

interface AnimatedLinkProps {
  children: React.ReactNode
  href: string
  className?: string
  external?: boolean
}

export function AnimatedLink({
  children,
  href,
  className,
  external = false,
}: AnimatedLinkProps) {
  return (
    <motion.a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900 transition-colors',
        className
      )}
    >
      {children}
      <motion.span
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        →
      </motion.span>
    </motion.a>
  )
}

// ============================================
// PARALLAX
// ============================================

interface ParallaxProps {
  children: React.ReactNode
  className?: string
  offset?: number
}

export function Parallax({ children, className, offset = 50 }: ParallaxProps) {
  const ref = React.useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

// ============================================
// FLOATING ELEMENT
// ============================================

interface FloatingProps {
  children: React.ReactNode
  className?: string
  duration?: number
  distance?: number
}

export function Floating({
  children,
  className,
  duration = 3,
  distance = 10,
}: FloatingProps) {
  return (
    <motion.div
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// REVEAL ON SCROLL
// ============================================

interface RevealProps {
  children: React.ReactNode
  className?: string
  width?: 'fit' | 'full'
}

export function Reveal({ children, className, width = 'fit' }: RevealProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', width === 'full' ? 'w-full' : 'w-fit')}
    >
      <motion.div
        initial={{ opacity: 0, y: 75 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 75 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className={className}
      >
        {children}
      </motion.div>
      <motion.div
        initial={{ left: 0 }}
        animate={isInView ? { left: '100%' } : { left: 0 }}
        transition={{ duration: 0.5, ease: 'easeIn' }}
        className="absolute top-0 bottom-0 left-0 right-0 bg-neutral-900 z-10"
      />
    </div>
  )
}

// ============================================
// COUNTER ANIMATION
// ============================================

interface CounterProps {
  from?: number
  to: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function Counter({
  from = 0,
  to,
  duration = 2,
  className,
  suffix = '',
  prefix = '',
}: CounterProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [count, setCount] = React.useState(from)

  React.useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)

      setCount(Math.floor(from + (to - from) * easeOutQuart(progress)))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, from, to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4)
}

// ============================================
// MAGNETIC BUTTON
// ============================================

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  strength?: number
}

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  ...props
}: MagneticButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return

    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()

    const x = (clientX - left - width / 2) * strength
    const y = (clientY - top - height / 2) * strength

    setPosition({ x, y })
  }

  const reset = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}
