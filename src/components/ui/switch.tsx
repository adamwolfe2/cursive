'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  size?: 'sm' | 'default' | 'lg'
}

const sizeClasses = {
  sm: {
    switch: 'h-4 w-7',
    thumb: 'h-3 w-3',
    translateChecked: 'translate-x-3',
  },
  default: {
    switch: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translateChecked: 'translate-x-4',
  },
  lg: {
    switch: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translateChecked: 'translate-x-5',
  },
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = 'default', checked, ...props }, ref) => {
    const sizeStyles = sizeClasses[size]

    const switchElement = (
      <label className="relative inline-flex cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            'rounded-full bg-muted transition-colors duration-200',
            'peer-checked:bg-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            sizeStyles.switch,
            className
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200',
              'peer-checked:' + sizeStyles.translateChecked,
              sizeStyles.thumb
            )}
            style={{
              transform: checked ? sizeStyles.translateChecked.replace('translate-x-', 'translateX(') + 'px)' : 'translateX(0)',
            }}
          />
        </div>
      </label>
    )

    if (!label && !description) {
      return switchElement
    }

    return (
      <div className="flex items-start gap-3">
        <div className="flex h-5 items-center">{switchElement}</div>
        <div className="text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
