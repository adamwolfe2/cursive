/**
 * Standardized Page Container
 * Enforces consistent layout, spacing, and responsive design across all pages
 */

import { cn } from '@/lib/design-system'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'narrow' | 'default' | 'wide' | 'full'
  noPadding?: boolean
}

export function PageContainer({
  children,
  className,
  maxWidth = 'default',
  noPadding = false,
}: PageContainerProps) {
  const maxWidthClasses = {
    narrow: 'max-w-3xl',
    default: 'max-w-7xl',
    wide: 'max-w-[1600px]',
    full: 'max-w-full',
  }

  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        !noPadding && 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
        className
      )}
    >
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

interface PageSectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  action?: React.ReactNode
}

export function PageSection({ children, className, title, description, action }: PageSectionProps) {
  return (
    <section className={cn('mb-6 sm:mb-8', className)}>
      {(title || description || action) && (
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </div>
      )}
      {children}
    </section>
  )
}
