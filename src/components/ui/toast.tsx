'use client'

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastProps {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  action?: ToastAction
  onClose: (id: string) => void
}

const toastStyles = {
  success: {
    container: 'bg-success-muted border-success/30 text-success-foreground',
    icon: 'text-success',
    iconComponent: CheckCircle,
  },
  error: {
    container: 'bg-destructive-muted border-destructive/30 text-destructive-foreground',
    icon: 'text-destructive',
    iconComponent: XCircle,
  },
  warning: {
    container: 'bg-warning-muted border-warning/30 text-warning-foreground',
    icon: 'text-warning',
    iconComponent: AlertTriangle,
  },
  info: {
    container: 'bg-info-muted border-info/30 text-info-foreground',
    icon: 'text-info',
    iconComponent: Info,
  },
}

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  action,
  onClose,
}: ToastProps) {
  const [_isExiting, setIsExiting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)

  const style = toastStyles[type]
  const Icon = style.iconComponent

  // Track close timeout for cleanup
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (duration <= 0) return

    let startTime = Date.now()
    let remainingTime = duration
    let animationFrame: number

    const updateProgress = () => {
      if (isPaused) {
        startTime = Date.now()
        animationFrame = requestAnimationFrame(updateProgress)
        return
      }

      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, remainingTime - elapsed)
      const newProgress = (remaining / duration) * 100

      setProgress(newProgress)

      if (remaining <= 0) {
        handleClose()
      } else {
        animationFrame = requestAnimationFrame(updateProgress)
      }
    }

    animationFrame = requestAnimationFrame(updateProgress)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, isPaused])

  // Cleanup close timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout)
      }
    }
  }, [closeTimeout])

  const handleClose = () => {
    setIsExiting(true)
    const timeout = setTimeout(() => {
      onClose(id)
    }, 300) // Match animation duration
    setCloseTimeout(timeout)
  }

  const safeAnimation = useSafeAnimation()

  return (
    <motion.div
      className={`
        relative w-[380px] rounded-lg border shadow-lg p-4
        ${style.container}
      `}
      initial={safeAnimation ? { x: 400, opacity: 0, scale: 0.9 } : { x: 400, opacity: 0 }}
      animate={safeAnimation ? { x: 0, opacity: 1, scale: 1 } : { x: 0, opacity: 1 }}
      exit={safeAnimation ? { x: 400, opacity: 0, scale: 0.9 } : { x: 400, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${style.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-[13px] mb-1">{title}</div>
          )}
          <div className="text-[13px] leading-relaxed">{message}</div>

          {/* Action Button */}
          {action && (
            <button
              onClick={() => {
                action.onClick()
                handleClose()
              }}
              className="mt-3 text-[13px] font-medium underline hover:no-underline transition-all opacity-80 hover:opacity-100"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded p-1 transition-colors hover:bg-black/10"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div
          className={`
            absolute bottom-0 left-0 h-1 rounded-b-lg transition-all
            ${
              type === 'success'
                ? 'bg-success'
                : type === 'error'
                  ? 'bg-destructive'
                  : type === 'warning'
                    ? 'bg-warning'
                    : 'bg-info'
            }
          `}
          style={{
            width: `${progress}%`,
            transition: isPaused ? 'none' : 'width 100ms linear',
          }}
        />
      )}
    </motion.div>
  )
}
