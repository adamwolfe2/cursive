'use client'

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: 'text-blue-600',
    iconComponent: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: 'text-red-600',
    iconComponent: XCircle,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    iconComponent: AlertTriangle,
  },
  info: {
    container: 'bg-zinc-50 border-zinc-200 text-zinc-900',
    icon: 'text-zinc-600',
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
  const [isExiting, setIsExiting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)

  const style = toastStyles[type]
  const Icon = style.iconComponent

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

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300) // Match animation duration
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
              className={`
                mt-3 text-[13px] font-medium underline
                hover:no-underline transition-all
                ${
                  type === 'success'
                    ? 'text-blue-700 hover:text-blue-800'
                    : type === 'error'
                      ? 'text-red-700 hover:text-red-800'
                      : type === 'warning'
                        ? 'text-amber-700 hover:text-amber-800'
                        : 'text-zinc-700 hover:text-zinc-800'
                }
              `}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 rounded p-1 transition-colors
            ${
              type === 'success'
                ? 'hover:bg-blue-100'
                : type === 'error'
                  ? 'hover:bg-red-100'
                  : type === 'warning'
                    ? 'hover:bg-amber-100'
                    : 'hover:bg-zinc-100'
            }
          `}
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
                ? 'bg-blue-600'
                : type === 'error'
                  ? 'bg-red-600'
                  : type === 'warning'
                    ? 'bg-amber-600'
                    : 'bg-zinc-600'
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
