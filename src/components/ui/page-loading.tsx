'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Spinner } from './spinner'
import { Skeleton } from './skeleton'

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message, className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        'flex min-h-[60vh] flex-col items-center justify-center',
        className
      )}
    >
      <Spinner size="xl" className="text-primary" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-5">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-6">
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-2 pt-4 border-t border-border">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="rounded-lg border border-border p-6 animate-pulse">
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="space-y-6 max-w-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <div className="pt-6 border-t border-border flex justify-end">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-lg border border-border p-6 animate-pulse">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="rounded-lg" style={{ height }} />
    </div>
  )
}

interface InlineLoadingProps {
  text?: string
  className?: string
}

export function InlineLoading({ text = 'Loading...', className }: InlineLoadingProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Spinner size="sm" />
      {text}
    </span>
  )
}
