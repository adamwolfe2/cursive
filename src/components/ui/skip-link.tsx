'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Skip Link component for keyboard navigation
 * Allows users to skip directly to main content
 */
export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4',
        'focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-lg focus:font-medium focus:shadow-enterprise-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Visually hidden text for screen readers
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
}: {
  children: React.ReactNode
  as?: React.ElementType
}) {
  return <Component className="sr-only">{children}</Component>
}

/**
 * Live region for screen reader announcements
 */
interface LiveRegionProps {
  children: React.ReactNode
  mode?: 'polite' | 'assertive'
  atomic?: boolean
  className?: string
}

export function LiveRegion({
  children,
  mode = 'polite',
  atomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

/**
 * Focus trap for modals and dialogs
 */
interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  onEscape?: () => void
}

export function FocusTrap({ children, active = true, onEscape }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current

    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus the first focusable element
    const focusableElements = getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape()
        return
      }

      if (event.key === 'Tab') {
        const focusable = getFocusableElements(container)
        if (focusable.length === 0) return

        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the previously focused element
      previouslyFocused?.focus()
    }
  }, [active, onEscape])

  return <div ref={containerRef}>{children}</div>
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
}
