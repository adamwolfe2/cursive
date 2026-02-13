// Password Strength Indicator Component
// Visual feedback for password requirements
// Shows real-time validation as user types

import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
  className?: string
}

interface PasswordCheck {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_CHECKS: PasswordCheck[] = [
  {
    label: 'At least 8 characters',
    test: (p) => p.length >= 8,
  },
  {
    label: 'Lowercase letter (a-z)',
    test: (p) => /[a-z]/.test(p),
  },
  {
    label: 'Uppercase letter (A-Z)',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    label: 'Number (0-9)',
    test: (p) => /[0-9]/.test(p),
  },
]

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const checks = PASSWORD_CHECKS.map((check) => ({
    ...check,
    passed: check.test(password),
  }))

  const passedCount = checks.filter((c) => c.passed).length
  const strength = passedCount === 0 ? 0 : passedCount

  // Strength levels: 1=weak, 2=fair, 3=good, 4=strong
  const strengthColors = [
    'bg-red-500',     // 1 check: weak
    'bg-orange-500',  // 2 checks: fair
    'bg-yellow-500',  // 3 checks: good
    'bg-green-500',   // 4 checks: strong
  ]

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bars */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index < strength ? strengthColors[strength - 1] : 'bg-gray-200 dark:bg-gray-700'
            )}
          />
        ))}
      </div>

      {/* Strength label */}
      {password.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Password strength:{' '}
          <span
            className={cn(
              'font-medium',
              strength === 1 && 'text-red-600 dark:text-red-400',
              strength === 2 && 'text-orange-600 dark:text-orange-400',
              strength === 3 && 'text-yellow-600 dark:text-yellow-400',
              strength === 4 && 'text-green-600 dark:text-green-400'
            )}
          >
            {strengthLabels[strength - 1] || 'Too weak'}
          </span>
        </p>
      )}

      {/* Requirements checklist */}
      <ul className="space-y-1.5 text-xs">
        {checks.map((check, index) => (
          <li
            key={index}
            className={cn(
              'flex items-center gap-2 transition-colors',
              check.passed
                ? 'text-green-600 dark:text-green-400'
                : 'text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold transition-colors',
                check.passed
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              )}
            >
              {check.passed ? '✓' : '○'}
            </span>
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Compact version without checklist - just the bars
 */
export function PasswordStrengthCompact({ password, className }: PasswordStrengthProps) {
  const checks = PASSWORD_CHECKS.map((check) => ({
    passed: check.test(password),
  }))

  const passedCount = checks.filter((c) => c.passed).length
  const strength = passedCount === 0 ? 0 : passedCount

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']

  if (!password) return null

  return (
    <div className={cn('flex gap-1.5', className)}>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            index < strength ? strengthColors[strength - 1] : 'bg-gray-200 dark:bg-gray-700'
          )}
        />
      ))}
    </div>
  )
}

/**
 * Check if password meets all requirements
 */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_CHECKS.every((check) => check.test(password))
}

/**
 * Get password strength score (0-4)
 */
export function getPasswordStrength(password: string): number {
  return PASSWORD_CHECKS.filter((check) => check.test(password)).length
}
