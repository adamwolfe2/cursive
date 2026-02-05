'use client'

import React from 'react'
import { Toast, ToastProps } from './toast'

interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  // Only show the most recent 5 toasts
  const visibleToasts = toasts.slice(-5)

  return (
    <div
      className="fixed top-safe top-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}
