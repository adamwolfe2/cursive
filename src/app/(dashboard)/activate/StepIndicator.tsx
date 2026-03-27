'use client'

import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/design-system'

export function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all',
            i < current ? 'bg-primary text-white' :
            i === current ? 'bg-primary text-white ring-4 ring-primary/20' :
            'bg-gray-100 text-gray-400'
          )}>
            {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span className={cn(
            'ml-1.5 text-xs hidden sm:block',
            i === current ? 'text-gray-900 font-medium' : 'text-gray-400'
          )}>
            {labels[i]}
          </span>
          {i < total - 1 && (
            <div className={cn('mx-2 h-px w-6 sm:w-10', i < current ? 'bg-primary' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  )
}
