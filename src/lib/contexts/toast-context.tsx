'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ToastContainer } from '@/components/ui/toast-container'
import { ToastProps, ToastType, ToastAction } from '@/components/ui/toast'

interface ToastOptions {
  type?: ToastType
  title?: string
  message: string
  duration?: number
  action?: ToastAction
}

interface ToastContextValue {
  success: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => void
  error: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => void
  warning: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => void
  info: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => void
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let toastCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  // Define removeToast first since addToast depends on it
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${++toastCounter}-${Date.now()}`

      const newToast: ToastProps = {
        id,
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        duration: options.duration ?? 5000,
        action: options.action,
        onClose: removeToast,
      }

      setToasts((prev) => [...prev, newToast])
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
      addToast({ ...options, type: 'success', message })
    },
    [addToast]
  )

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
      addToast({ ...options, type: 'error', message })
    },
    [addToast]
  )

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
      addToast({ ...options, type: 'warning', message })
    },
    [addToast]
  )

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
      addToast({ ...options, type: 'info', message })
    },
    [addToast]
  )

  const toast = useCallback(
    (options: ToastOptions) => {
      addToast(options)
    },
    [addToast]
  )

  const value: ToastContextValue = {
    success,
    error,
    warning,
    info,
    toast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
