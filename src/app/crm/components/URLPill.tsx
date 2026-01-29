// URL Pill Component
// Displays URLs in a pill shape with external link indicator

'use client'

import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface URLPillProps {
  url: string
  maxWidth?: number
  className?: string
  showIcon?: boolean
}

export function URLPill({
  url,
  maxWidth = 200,
  className,
  showIcon = true,
}: URLPillProps) {
  // Extract display text (remove protocol and www)
  const displayText = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 h-6 px-2 rounded-full border border-border bg-muted/50 hover:bg-muted/80 text-xs text-foreground transition-colors',
        className
      )}
      style={{ maxWidth: maxWidth ? `${maxWidth}px` : undefined }}
    >
      <span className="truncate">{displayText}</span>
      {showIcon && (
        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
      )}
    </a>
  )
}
