'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate ?? false
      }
    }, [indeterminate])

    const checkbox = (
      <input
        type="checkbox"
        ref={inputRef}
        className={cn(
          'h-4 w-4 rounded border-border text-primary',
          'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    )

    if (!label && !description) {
      return checkbox
    }

    return (
      <label className="flex gap-3">
        <div className="flex h-5 items-center">{checkbox}</div>
        <div className="text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
