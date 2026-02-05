import React, { forwardRef } from 'react'
import { FieldError } from 'react-hook-form'

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: FieldError
  children: React.ReactNode
}

/**
 * FormSelect - Controlled select with validation styling
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ error, className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full h-11 px-3 text-base text-zinc-900 bg-white border rounded-lg transition-all duration-150 focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-600 focus:border-red-600 focus:ring-red-200'
            : 'border-zinc-300 focus:border-zinc-500 focus:ring-zinc-200'
        } disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {children}
      </select>
    )
  }
)

FormSelect.displayName = 'FormSelect'
