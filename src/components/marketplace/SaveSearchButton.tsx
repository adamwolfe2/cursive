/**
 * SaveSearchButton
 *
 * Opens a small popover to name the current filter combo, then POSTs it
 * to /api/marketplace/saved-searches and invalidates the saved-searches query.
 *
 * Disabled when no filters are active.
 */

'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/hooks/use-toast'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { MarketplaceFilters } from '@/lib/hooks/use-marketplace-leads'

interface SaveSearchButtonProps {
  filters: MarketplaceFilters
  activeFilterCount: number
  onSaved?: () => void
}

export function SaveSearchButton({ filters, activeFilterCount, onSaved }: SaveSearchButtonProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isDisabled = activeFilterCount === 0

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/marketplace/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, filters }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save search')
      }

      await queryClient.invalidateQueries({ queryKey: ['saved-searches'] })

      toast({
        title: 'Search saved',
        message: `"${trimmedName}" has been saved to your searches`,
        type: 'success',
      })

      setName('')
      setOpen(false)
      onSaved?.()
    } catch (error) {
      safeError('[SaveSearchButton] Failed to save search:', error)
      toast({
        title: 'Failed to save search',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleSave()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={isDisabled}
          className={`h-9 px-3 text-[13px] font-medium border rounded-lg inline-flex items-center gap-1.5 transition-all duration-150 ${
            isDisabled
              ? 'border-zinc-200 bg-white text-zinc-300 cursor-not-allowed'
              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer'
          }`}
          aria-label="Save current search filters"
          title={isDisabled ? 'Apply at least one filter to save' : 'Save current filters'}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Save Search
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <p className="text-[13px] font-medium text-zinc-800 mb-2">Name this search</p>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. CA Tech Directors"
          inputSize="sm"
          className="mb-2"
          autoFocus
          maxLength={100}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className={`flex-1 h-8 text-[12px] font-medium rounded-md transition-all ${
              isSaving || !name.trim()
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => { setOpen(false); setName('') }}
            className="flex-1 h-8 text-[12px] font-medium text-zinc-600 hover:text-zinc-800 border border-zinc-200 rounded-md transition-all"
          >
            Cancel
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
