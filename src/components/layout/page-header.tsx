'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/design-system'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  tabs?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex items-center text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="mx-2 h-4 w-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Title and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {/* Tabs */}
      {tabs && <div className="mt-6">{tabs}</div>}
    </div>
  )
}

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'full'
}

const sizeClasses = {
  sm: 'max-w-4xl',
  default: 'max-w-7xl',
  lg: 'max-w-[1400px]',
  full: 'max-w-full',
}

export function PageContainer({
  children,
  className,
  size = 'default',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-8 sm:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  )
}

interface SectionProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn('', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
