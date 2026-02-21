'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { safeError } from '@/lib/utils/log-sanitizer'

interface BulkActionToolbarProps {
  selectedCount: number
  selectedIds: Set<string>
  onClear: () => void
  onSuccess?: () => void
}

type ActionState = 'idle' | 'archive' | 'unarchive' | 'tag' | 'export_csv' | 'delete_confirm' | 'delete'

export function BulkActionToolbar({
  selectedCount,
  selectedIds,
  onClear,
  onSuccess,
}: BulkActionToolbarProps) {
  const [actionState, setActionState] = useState<ActionState>('idle')
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function callBulkAPI(action: string, extra?: Record<string, unknown>) {
    const body = {
      lead_ids: Array.from(selectedIds),
      action,
      ...extra,
    }

    const res = await fetch('/api/leads/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error((json as any).error || 'Request failed')
    }

    return res
  }

  async function handleArchive() {
    setLoading(true)
    setActionState('archive')
    try {
      await callBulkAPI('archive')
      toast.success(`Archived ${selectedCount} lead${selectedCount !== 1 ? 's' : ''}`)
      onClear()
      onSuccess?.()
    } catch (err) {
      safeError('[BulkActionToolbar] archive error:', err)
      toast.error('Failed to archive leads. Please try again.')
    } finally {
      setLoading(false)
      setActionState('idle')
    }
  }

  async function handleUnarchive() {
    setLoading(true)
    setActionState('unarchive')
    try {
      await callBulkAPI('unarchive')
      toast.success(`Unarchived ${selectedCount} lead${selectedCount !== 1 ? 's' : ''}`)
      onClear()
      onSuccess?.()
    } catch (err) {
      safeError('[BulkActionToolbar] unarchive error:', err)
      toast.error('Failed to unarchive leads. Please try again.')
    } finally {
      setLoading(false)
      setActionState('idle')
    }
  }

  async function handleTag() {
    const name = tagInput.trim()
    if (!name) return
    setLoading(true)
    try {
      await callBulkAPI('tag', { tag_name: name })
      toast.success(`Tagged ${selectedCount} lead${selectedCount !== 1 ? 's' : ''} with "${name}"`)
      setTagInput('')
      setActionState('idle')
      onSuccess?.()
    } catch (err) {
      safeError('[BulkActionToolbar] tag error:', err)
      toast.error('Failed to apply tag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setActionState('delete')
    try {
      await callBulkAPI('delete')
      toast.success(`Deleted ${selectedCount} lead${selectedCount !== 1 ? 's' : ''}`)
      onClear()
      onSuccess?.()
    } catch (err) {
      safeError('[BulkActionToolbar] delete error:', err)
      toast.error('Failed to delete leads. You may not have permission.')
    } finally {
      setLoading(false)
      setActionState('idle')
    }
  }

  async function handleExportCSV() {
    setLoading(true)
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_ids: Array.from(selectedIds),
          action: 'export_csv',
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as any).error || 'Export failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-leads-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${selectedCount} lead${selectedCount !== 1 ? 's' : ''} to CSV`)
      onClear()
    } catch (err) {
      safeError('[BulkActionToolbar] export_csv error:', err)
      toast.error('Failed to export leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          key="bulk-toolbar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg shadow-black/10">
            {/* Lead count */}
            <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap">
              {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'} selected
            </span>

            <div className="h-4 w-px bg-zinc-200" />

            {/* Inline delete confirmation — shown when actionState === 'delete_confirm' */}
            {actionState === 'delete_confirm' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-700">
                  Permanently delete {selectedCount} lead{selectedCount !== 1 ? 's' : ''}?
                </span>
                <button
                  onClick={() => { void handleDelete() }}
                  disabled={loading}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Deleting…' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setActionState('idle')}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                >
                  Cancel
                </button>
              </div>
            ) : actionState === 'tag' ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Tag name…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { void handleTag() }
                    if (e.key === 'Escape') { setActionState('idle'); setTagInput('') }
                  }}
                  className="h-8 w-40 rounded-md border border-zinc-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={() => { void handleTag() }}
                  disabled={loading || !tagInput.trim()}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Applying…' : 'Apply'}
                </button>
                <button
                  onClick={() => { setActionState('idle'); setTagInput('') }}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Archive */}
                <button
                  onClick={() => { void handleArchive() }}
                  disabled={loading}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                >
                  {loading && actionState === 'archive' ? 'Archiving…' : 'Archive'}
                </button>

                {/* Unarchive */}
                <button
                  onClick={() => { void handleUnarchive() }}
                  disabled={loading}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                >
                  {loading && actionState === 'unarchive' ? 'Unarchiving…' : 'Unarchive'}
                </button>

                {/* Tag */}
                <button
                  onClick={() => setActionState('tag')}
                  disabled={loading}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                >
                  Tag
                </button>

                {/* Export CSV */}
                <button
                  onClick={() => { void handleExportCSV() }}
                  disabled={loading}
                  className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Exporting…' : 'Export CSV'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => setActionState('delete_confirm')}
                  disabled={loading}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>

                {/* Clear */}
                <button
                  onClick={onClear}
                  disabled={loading}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
