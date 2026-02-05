import React, { forwardRef } from 'react'
import { FieldError } from 'react-hook-form'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError
}

/**
 * FormInput - Controlled input with validation styling
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full h-11 px-3 text-base text-zinc-900 placeholder:text-zinc-400 bg-white border rounded-lg transition-all duration-150 focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-600 focus:border-red-600 focus:ring-red-200'
            : 'border-zinc-300 focus:border-zinc-500 focus:ring-zinc-200'
        } disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    )
  }
)

FormInput.displayName = 'FormInput'
