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

// Use explicit Tailwind colors with HIGH contrast — the previous theme tokens
// (text-success-foreground on bg-success-muted) rendered green text on a soft
// green background which looked illegible / "ghosted" in screenshots. These
// styles guarantee readable text on every background.
const toastStyles = {
  success: {
    container: 'bg-green-50 border-green-200',
    title: 'text-green-900',
    message: 'text-green-800',
    icon: 'text-green-600',
    progress: 'bg-green-500',
    iconComponent: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200',
    title: 'text-red-900',
    message: 'text-red-800',
    icon: 'text-red-600',
    progress: 'bg-red-500',
    iconComponent: XCircle,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    title: 'text-amber-900',
    message: 'text-amber-800',
    icon: 'text-amber-600',
    progress: 'bg-amber-500',
    iconComponent: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    title: 'text-blue-900',
    message: 'text-blue-800',
    icon: 'text-blue-600',
    progress: 'bg-blue-500',
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
            <div className={`font-semibold text-sm mb-1 ${style.title}`}>{title}</div>
          )}
          <div className={`text-sm leading-snug ${style.message}`}>{message}</div>

          {/* Action Button */}
          {action && (
            <button
              onClick={() => {
                action.onClick()
                handleClose()
              }}
              className={`mt-3 text-sm font-medium underline hover:no-underline transition-all ${style.title}`}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`flex-shrink-0 rounded p-1 transition-colors hover:bg-black/5 ${style.icon}`}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1 rounded-b-lg transition-all ${style.progress}`}
          style={{
            width: `${progress}%`,
            transition: isPaused ? 'none' : 'width 100ms linear',
          }}
        />
      )}
    </motion.div>
  )
}
