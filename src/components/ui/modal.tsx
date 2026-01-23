'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Button } from './button'
import { generateAriaId, trapFocus, getFocusableElements } from '@/lib/accessibility'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  // Store the previously focused element and restore it on close
  React.useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'

      // Focus the first focusable element in the modal
      requestAnimationFrame(() => {
        if (modalRef.current) {
          const focusable = getFocusableElements(modalRef.current)
          if (focusable.length > 0) {
            focusable[0].focus()
          } else {
            modalRef.current.focus()
          }
        }
      })
    } else {
      document.body.style.overflow = 'unset'
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle keyboard events
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }

      // Trap focus within the modal
      if (event.key === 'Tab' && modalRef.current) {
        trapFocus(modalRef.current, event)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Content */}
      <div
        ref={modalRef}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-enterprise-xl animate-scale-in',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
  onClose?: () => void
}

export function ModalHeader({ children, className, onClose }: ModalHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export function ModalTitle({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <h2 id={id} className={cn('text-lg font-semibold text-foreground', className)}>
      {children}
    </h2>
  )
}

export function ModalDescription({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <p id={id} className={cn('text-sm text-muted-foreground mt-1', className)}>
      {children}
    </p>
  )
}

export function ModalContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('', className)}>{children}</div>
}

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-end gap-3 mt-6', className)}>
      {children}
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <ModalHeader onClose={onClose}>
        <ModalTitle>{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
