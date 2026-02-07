import React from 'react'

interface FormSuccessProps {
  message?: string
  className?: string
}

/**
 * FormSuccess - Styled success message display
 */
export function FormSuccess({ message, className = '' }: FormSuccessProps) {
  if (!message) return null

  return (
    <div
      className={`rounded-lg bg-primary/5 border border-primary/20 p-4 ${className}`}
      role="status"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-primary"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-[13px] text-primary">{message}</p>
        </div>
      </div>
    </div>
  )
}
