/**
 * Cursive-branded Gradient Card
 * Consistent gradient styling for Cursive brand
 */

import { cn } from '@/lib/design-system'
import { Card } from './card'

interface GradientCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'subtle' | 'primary' | 'accent'
  noPadding?: boolean
}

export function GradientCard({
  children,
  className,
  variant = 'subtle',
  noPadding = false,
}: GradientCardProps) {
  const variants = {
    subtle: 'bg-gradient-to-br from-background via-background to-primary/5',
    primary: 'bg-gradient-to-br from-primary/10 via-primary/5 to-background',
    accent: 'bg-gradient-to-br from-accent/10 via-background to-accent/5',
  }

  return (
    <Card
      className={cn(
        variants[variant],
        'border-border/50 backdrop-blur-sm',
        !noPadding && 'p-6',
        className
      )}
    >
      {children}
    </Card>
  )
}

interface GradientBadgeProps {
  children: React.ReactNode
  className?: string
}

export function GradientBadge({ children, className }: GradientBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        'bg-gradient-to-r from-primary/20 to-primary/10',
        'text-primary border border-primary/20',
        className
      )}
    >
      {children}
    </span>
  )
}

interface GradientButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function GradientButton({
  children,
  className,
  onClick,
  disabled,
  type = 'button',
}: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium',
        'bg-gradient-to-r from-primary to-primary/90',
        'text-primary-foreground shadow-sm',
        'hover:shadow-md hover:from-primary/90 hover:to-primary',
        'active:scale-[0.98] transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm',
        'touch-manipulation', // Better mobile interaction
        className
      )}
    >
      {children}
    </button>
  )
}
