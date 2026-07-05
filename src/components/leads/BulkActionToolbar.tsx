'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { safeError } from '@/lib/utils/log-sanitizer'
import { BulkIntelligenceAction } from '@/components/intelligence'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-enterprise-lg">
            {/* Lead count */}
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'} selected
            </span>

            <div className="h-4 w-px bg-border" />

            {/* Inline delete confirmation — shown when actionState === 'delete_confirm' */}
            {actionState === 'delete_confirm' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-destructive">
                  Permanently delete {selectedCount} lead{selectedCount !== 1 ? 's' : ''}?
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { void handleDelete() }}
                  disabled={loading}
                >
                  {loading ? 'Deleting…' : 'Yes, Delete'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActionState('idle')}>
                  Cancel
                </Button>
              </div>
            ) : actionState === 'tag' ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  type="text"
                  inputSize="sm"
                  placeholder="Tag name…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { void handleTag() }
                    if (e.key === 'Escape') { setActionState('idle'); setTagInput('') }
                  }}
                  className="w-40"
                  disabled={loading}
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => { void handleTag() }}
                  disabled={loading || !tagInput.trim()}
                >
                  {loading ? 'Applying…' : 'Apply'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setActionState('idle'); setTagInput('') }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Archive */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { void handleArchive() }}
                  disabled={loading}
                >
                  {loading && actionState === 'archive' ? 'Archiving…' : 'Archive'}
                </Button>

                {/* Unarchive */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { void handleUnarchive() }}
                  disabled={loading}
                >
                  {loading && actionState === 'unarchive' ? 'Unarchiving…' : 'Unarchive'}
                </Button>

                {/* Tag */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionState('tag')}
                  disabled={loading}
                >
                  Tag
                </Button>

                {/* Export CSV */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { void handleExportCSV() }}
                  disabled={loading}
                  className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                >
                  {loading ? 'Exporting…' : 'Export CSV'}
                </Button>

                {/* Bulk Intelligence Enrichment */}
                <BulkIntelligenceAction
                  selectedLeadIds={Array.from(selectedIds)}
                  onComplete={onSuccess ?? (() => {})}
                />

                {/* Delete */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionState('delete_confirm')}
                  disabled={loading}
                  className="border-destructive/30 text-destructive hover:bg-destructive-muted hover:text-destructive"
                >
                  Delete
                </Button>

                {/* Clear */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  disabled={loading}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
