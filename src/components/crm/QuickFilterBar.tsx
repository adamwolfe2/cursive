'use client'

interface QuickFilterBarProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts?: Record<string, number>
}

const FILTERS = [
  { id: 'all', label: 'All Contacts' },
  { id: 'recent', label: 'Recently Added' },
  { id: 'no_email', label: 'Missing Email' },
  { id: 'no_phone', label: 'Missing Phone' },
  { id: 'enriched', label: 'Enriched' },
  { id: 'not_enriched', label: 'Not Yet Enriched' },
]

export function QuickFilterBar({ activeFilter, onFilterChange, counts }: QuickFilterBarProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activeFilter === filter.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
          }`}
        >
          {filter.label}
          {counts?.[filter.id] != null && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeFilter === filter.id ? 'bg-white/20' : 'bg-muted'
            }`}>
              {counts[filter.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
