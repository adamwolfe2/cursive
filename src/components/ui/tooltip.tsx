'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delay?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  React.useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      let x = 0
      let y = 0

      switch (side) {
        case 'top':
          y = -tooltipRect.height - 8
          break
        case 'bottom':
          y = triggerRect.height + 8
          break
        case 'left':
          x = -tooltipRect.width - 8
          break
        case 'right':
          x = triggerRect.width + 8
          break
      }

      switch (align) {
        case 'start':
          if (side === 'top' || side === 'bottom') x = 0
          else y = 0
          break
        case 'center':
          if (side === 'top' || side === 'bottom') {
            x = (triggerRect.width - tooltipRect.width) / 2
          } else {
            y = (triggerRect.height - tooltipRect.height) / 2
          }
          break
        case 'end':
          if (side === 'top' || side === 'bottom') {
            x = triggerRect.width - tooltipRect.width
          } else {
            y = triggerRect.height - tooltipRect.height
          }
          break
      }

      setPosition({ x, y })
    }
  }, [isVisible, side, align])

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'absolute z-tooltip px-3 py-1.5 text-xs font-medium text-popover-foreground bg-popover border border-border rounded-md shadow-enterprise-md animate-fade-in',
            className
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
