'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'
import type { FieldError, Merge, FieldErrorsImpl } from 'react-hook-form'

type FormFieldError = string | FieldError | Merge<FieldError, FieldErrorsImpl<Record<string, unknown>>> | undefined

interface FormFieldProps {
  label?: string
  description?: string
  error?: FormFieldError
  required?: boolean
  children: React.ReactNode
  className?: string
  htmlFor?: string
}

function getErrorMessage(error: FormFieldError): string | null {
  if (!error) return null
  if (typeof error === 'string') return error
  if (error.message) return typeof error.message === 'string' ? error.message : 'Validation error'
  return 'Validation error'
}

function FormField({
  label,
  description,
  error,
  required,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  const errorMessage = getErrorMessage(error)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {errorMessage ? (
        <p className="text-sm text-destructive flex items-center gap-1">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="border-b border-border pb-4">
          {title && (
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

interface FormActionsProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center' | 'between'
}

const alignClasses = {
  left: 'justify-start',
  right: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
}

function FormActions({ children, className, align = 'right' }: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-6 border-t border-border',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

export { FormField, FormSection, FormActions }
