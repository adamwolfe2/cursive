'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupProps {
  name: string
  options: RadioOption[]
  value?: string
  onChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'flex gap-4',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex gap-3 cursor-pointer',
            option.disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div className="flex h-5 items-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              disabled={option.disabled}
              className={cn(
                'h-4 w-4 border-border text-primary',
                'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                'disabled:cursor-not-allowed'
              )}
            />
          </div>
          <div className="text-sm">
            <span className="font-medium text-foreground">{option.label}</span>
            {option.description && (
              <p className="text-muted-foreground">{option.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}

export { RadioGroup }
export type { RadioOption, RadioGroupProps }
