'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

interface IntentScoreBadgeProps {
  score: number | null
  showExplanation?: boolean
}

interface ScoreConfig {
  label: string
  bg: string
  dot: string
  description: string
  signals: string[]
}

function getScoreConfig(score: number): ScoreConfig {
  if (score >= 70) return {
    label: 'Hot',
    bg: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    description: 'High purchase intent. This contact is actively researching solutions in your space. Prioritize immediate outreach.',
    signals: [
      'Recent website visits to competitor pages',
      'Job posting for roles in your product area',
      'Recent funding or growth event',
      'Active LinkedIn engagement on relevant topics',
    ],
  }
  if (score >= 40) return {
    label: 'Warm',
    bg: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    description: 'Moderate purchase intent. This contact shows signs of interest but may not be actively buying yet.',
    signals: [
      'Company size and industry match your ICP',
      'Some recent relevant activity signals',
      'Title suggests budget authority',
    ],
  }
  return {
    label: 'Cold',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    description: 'Low immediate intent. This contact matches your ICP but shows limited active buying signals right now.',
    signals: [
      'Good ICP fit on firmographic data',
      'Limited recent activity signals',
      'May be worth nurturing over time',
    ],
  }
}

export function IntentScoreBadge({ score, showExplanation = true }: IntentScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (score === null || score === undefined) return null

  const config = getScoreConfig(score)

  return (
    <div className="relative inline-flex items-center gap-1">
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${config.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
        <span className="font-normal opacity-70">·{score}</span>
      </span>

      {showExplanation && (
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          aria-label="Intent score explanation"
        >
          <Info className="h-3 w-3" />
        </button>
      )}

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-popover border border-border rounded-xl shadow-lg p-3 text-left">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground">Intent Score: {score}/100</p>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${config.bg}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
            {config.description}
          </p>
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Contributing signals:</p>
            <ul className="space-y-1">
              {config.signals.map((signal, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">·</span>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-3 border-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  )
}
