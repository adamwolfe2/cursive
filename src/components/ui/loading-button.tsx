'use client'

// Loading Button Component
// Button with loading state and spinner

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
}

export function LoadingButton({
  loading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  const variantStyles = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    outline: 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-zinc-700 hover:bg-zinc-100',
  }

  const sizeStyles = {
    sm: 'h-11 sm:h-8 px-3 text-sm sm:text-[12px]',
    md: 'h-11 sm:h-9 px-4 text-sm sm:text-[13px]',
    lg: 'h-11 sm:h-10 px-5 text-sm sm:text-[14px]',
  }

  return (
    <button
      type="button"
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 sm:gap-2 rounded-lg font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}
