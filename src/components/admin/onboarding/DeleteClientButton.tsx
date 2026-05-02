'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteClient } from '@/app/admin/onboarding/actions'

interface DeleteClientButtonProps {
  clientId: string
  companyName: string
}

export default function DeleteClientButton({ clientId, companyName }: DeleteClientButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const expected = companyName.trim()
  const canConfirm = confirmText.trim() === expected

  function handleOpen() {
    setOpen(true)
    setConfirmText('')
    setError(null)
  }

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setConfirmText('')
    setError(null)
  }

  function handleDelete() {
    if (!canConfirm) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteClient(clientId)
        router.push('/admin/onboarding')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Client
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white shadow-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Delete client?</h2>
            <p className="text-sm text-gray-500 mb-4">
              This permanently deletes <strong>{companyName}</strong> and all associated data —
              files, checklists, copy, portal tokens, and automation logs. This cannot be undone.
            </p>

            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Type <span className="font-mono font-semibold text-gray-900">{expected}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canConfirm && handleDelete()}
              placeholder={expected}
              disabled={isPending}
              autoFocus
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 disabled:opacity-50 mb-4"
            />

            {error && (
              <p className="text-xs text-red-600 mb-3">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm || isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
