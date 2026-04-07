'use client'

/**
 * Saved Prompts Bar — 4 quick-action chips above the chat input.
 *
 * Loads from /api/outbound/saved-prompts (returns globals + workspace customs).
 * Click a chip → injects template into chat input + auto-submits.
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Mail, Presentation, Activity, FileText, Sparkles } from 'lucide-react'
import type { OutboundSavedPrompt } from '@/types/outbound'

const ICONS: Record<string, React.ReactNode> = {
  mail: <Mail className="h-3.5 w-3.5" />,
  presentation: <Presentation className="h-3.5 w-3.5" />,
  activity: <Activity className="h-3.5 w-3.5" />,
  'file-text': <FileText className="h-3.5 w-3.5" />,
}

export interface SavedPromptsBarProps {
  onSelect: (label: string, template: string, id: string) => void
}

export function SavedPromptsBar({ onSelect }: SavedPromptsBarProps) {
  const [prompts, setPrompts] = useState<OutboundSavedPrompt[]>([])

  useEffect(() => {
    fetch('/api/outbound/saved-prompts')
      .then(r => r.json())
      .then((j: { data: OutboundSavedPrompt[] }) => setPrompts(j.data ?? []))
      .catch(() => setPrompts([]))
  }, [])

  if (prompts.length === 0) return null

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Saved prompts</p>
      <div className="grid grid-cols-2 gap-2">
        {prompts.slice(0, 4).map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.label, p.prompt_template, p.id)}
            className="text-left"
          >
            <Card className="p-2.5 hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <span className="text-primary">
                  {ICONS[p.icon_name ?? ''] ?? <Sparkles className="h-3.5 w-3.5" />}
                </span>
                {p.label}
              </div>
              {p.description && (
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground line-clamp-2">
                  {p.description}
                </p>
              )}
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
