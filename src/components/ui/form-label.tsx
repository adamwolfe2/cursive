import React from 'react'

interface FormLabelProps {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
  optional?: boolean
  hint?: string
  className?: string
}

/**
 * FormLabel component with required/optional indicator
 */
export function FormLabel({
  htmlFor,
  children,
  required = false,
  optional = false,
  hint,
  className = '',
}: FormLabelProps) {
  return (
    <div className="mb-2">
      <label
        htmlFor={htmlFor}
        className={`block text-[13px] font-medium text-zinc-700 ${className}`}
      >
        {children}
        {required && <span className="text-red-600 ml-1">*</span>}
        {optional && !required && (
          <span className="text-zinc-500 ml-1 font-normal">(optional)</span>
        )}
      </label>
      {hint && <p className="mt-1 text-[12px] text-zinc-500">{hint}</p>}
    </div>
  )
}
