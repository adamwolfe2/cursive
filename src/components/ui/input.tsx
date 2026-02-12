'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/design-system'
import { motion } from 'framer-motion'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'

const inputVariants = cva(
  'flex w-full rounded-lg border bg-background text-foreground ring-offset-background transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-success focus-visual:ring-success',
      },
      inputSize: {
        // Mobile-first: 44px minimum for touch targets, smaller on desktop
        sm: 'h-11 sm:h-8 px-3 text-sm',
        default: 'h-11 sm:h-10 px-3 py-2 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, leftIcon, rightIcon, error, ...props }, ref) => {
    const inputVariant = error ? 'error' : variant
    const safeAnimation = useSafeAnimation()
    const [isFocused, setIsFocused] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }

    if (leftIcon || rightIcon) {
      return (
        <motion.div
          className="relative"
          animate={safeAnimation && isFocused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: inputVariant, inputSize, className }),
              leftIcon ? 'pl-10' : undefined,
              rightIcon ? 'pr-10' : undefined
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </motion.div>
      )
    }

    return (
      <motion.input
        type={type}
        className={cn(inputVariants({ variant: inputVariant, inputSize, className }))}
        ref={ref}
        animate={safeAnimation && isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props as any}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
