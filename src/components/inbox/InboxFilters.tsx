'use client'

import { useState, useEffect } from 'react'
import type { InboxFilters as InboxFiltersType, ConversationStage } from '@/types/sdr'

interface InboxFiltersProps {
  readonly filters: InboxFiltersType
  readonly onChange: (filters: InboxFiltersType) => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'waiting_reply', label: 'Waiting Reply' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
]

const STAGE_OPTIONS: { value: '' | ConversationStage; label: string }[] = [
  { value: '', label: 'All stages' },
  { value: 'new', label: 'New' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'qualifying', label: 'Qualifying' },
  { value: 'scheduling', label: 'Scheduling' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' },
]

export function InboxFilters({ filters, onChange }: InboxFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      if (next !== (filters.search ?? '')) {
        onChange({ ...filters, search: next || undefined })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleStatusChange = (value: string) => {
    onChange({ ...filters, status: value || undefined })
  }

  const handleStageChange = (value: string) => {
    onChange({
      ...filters,
      conversationStage: (value as ConversationStage) || undefined,
    })
  }

  const handleDraftToggle = () => {
    onChange({
      ...filters,
      hasPendingDraft: filters.hasPendingDraft ? undefined : true,
    })
  }

  return (
    <div className="p-3 border-b bg-white space-y-2">
      <input
        type="text"
        placeholder="Search conversations..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <select
          value={(filters.status as string) ?? ''}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={(filters.conversationStage as string) ?? ''}
          onChange={(e) => handleStageChange(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleDraftToggle}
        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
          filters.hasPendingDraft
            ? 'bg-amber-50 border-amber-300 text-amber-700'
            : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
        }`}
      >
        Has pending draft
      </button>
    </div>
  )
}
