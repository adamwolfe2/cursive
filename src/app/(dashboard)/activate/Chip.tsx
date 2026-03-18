'use client'

import { cn } from '@/lib/design-system'

export function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3.5 py-2 rounded-full text-sm border transition-all',
        selected
          ? 'bg-primary text-white border-primary font-medium shadow-sm'
          : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40 hover:text-primary'
      )}
    >
      {label}
    </button>
  )
}
