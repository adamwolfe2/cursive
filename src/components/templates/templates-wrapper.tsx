'use client'

import { useFeature } from '@/lib/hooks/use-tier'
import { InlineFeatureLock } from '@/components/gates/FeatureLock'
import { ReactNode } from 'react'

interface TemplatesWrapperProps {
  children: ReactNode
}

export function TemplatesWrapper({ children }: TemplatesWrapperProps) {
  const { hasAccess, isLoading } = useFeature('templates')

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-zinc-200 rounded-lg" />
        <div className="h-64 bg-zinc-200 rounded-lg" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <InlineFeatureLock
          feature="templates"
          requiredTier="Cursive Outbound"
          requiredTierSlug="cursive-outbound"
        />
        <div className="opacity-50 pointer-events-none blur-sm">
          {children}
        </div>
      </>
    )
  }

  return <>{children}</>
}
