'use client'

import { useState, useMemo } from 'react'
import type { WinningPattern, ElementType } from '@/types/autoresearch'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Trophy, Copy, Check } from 'lucide-react'

interface Props {
  patterns: WinningPattern[]
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  subject: 'Subject',
  opening_line: 'Opening Line',
  body: 'Body',
  cta: 'CTA',
  angle: 'Angle',
  full_template: 'Full Template',
  send_time: 'Send Time',
}

const ALL_ELEMENTS: ElementType[] = [
  'subject',
  'opening_line',
  'body',
  'cta',
  'angle',
  'full_template',
  'send_time',
]

export default function WinningPatternsLibrary({ patterns }: Props) {
  const [search, setSearch] = useState('')
  const [selectedElement, setSelectedElement] = useState<ElementType | 'all'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const availableElements = useMemo(() => {
    const elements = new Set(patterns.map((p) => p.element_type))
    return ALL_ELEMENTS.filter((e) => elements.has(e))
  }, [patterns])

  const filtered = useMemo(() => {
    return patterns.filter((p) => {
      if (selectedElement !== 'all' && p.element_type !== selectedElement) return false
      if (search) {
        const q = search.toLowerCase()
        const matchesSearch =
          p.pattern_description.toLowerCase().includes(q) ||
          p.winning_copy.toLowerCase().includes(q) ||
          (p.niche ?? '').toLowerCase().includes(q) ||
          (p.persona ?? '').toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      return true
    })
  }, [patterns, selectedElement, search])

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patterns..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedElement('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedElement === 'all'
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {availableElements.map((element) => (
            <button
              key={element}
              onClick={() => setSelectedElement(element)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedElement === element
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {ELEMENT_LABELS[element]}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern cards */}
      {filtered.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No patterns match your filters.</p>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((pattern) => (
            <Card key={pattern.id} padding="sm">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {pattern.pattern_description}
                    </p>
                  </div>
                  <Badge variant="outline" size="sm" className="flex-shrink-0">
                    {ELEMENT_LABELS[pattern.element_type]}
                  </Badge>
                </div>

                <div className="relative group">
                  <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">
                    <p className="line-clamp-4">{pattern.winning_copy}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(pattern.winning_copy, pattern.id)}
                    className="absolute top-2 right-2 p-1 rounded-md bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy winning copy"
                  >
                    {copiedId === pattern.id ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {pattern.lift_percent !== null && (
                    <span className="font-medium text-green-600">
                      +{pattern.lift_percent.toFixed(1)}% lift
                    </span>
                  )}
                  {pattern.confidence_level !== null && (
                    <span>{(pattern.confidence_level * 100).toFixed(0)}% confidence</span>
                  )}
                  {pattern.replication_count > 0 && (
                    <span>{pattern.replication_count}x replicated</span>
                  )}
                </div>

                {(pattern.niche || pattern.persona || pattern.tags.length > 0) && (
                  <div className="flex gap-1.5 flex-wrap">
                    {pattern.niche && (
                      <Badge variant="muted" size="sm">{pattern.niche}</Badge>
                    )}
                    {pattern.persona && (
                      <Badge variant="muted" size="sm">{pattern.persona}</Badge>
                    )}
                    {pattern.tags.map((tag) => (
                      <Badge key={tag} variant="muted" size="sm">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
