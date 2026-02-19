'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Workspace } from '@/types'

interface DncEntry {
  id: string
  workspace_id: string
  email: string
  reason: string | null
  added_by: string | null
  added_at: string
}

function timeAgo(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DncClient({ workspaces }: { workspaces: Workspace[] }) {
  const [filterWorkspace, setFilterWorkspace] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  // Add modal state
  const [addEmail, setAddEmail] = useState('')
  const [addWorkspaceId, setAddWorkspaceId] = useState('')
  const [addReason, setAddReason] = useState('')

  // CSV modal state
  const [csvWorkspaceId, setCsvWorkspaceId] = useState('')
  const [csvReason, setCsvReason] = useState('')
  const [csvEmails, setCsvEmails] = useState<string[]>([])
  const [csvPreview, setCsvPreview] = useState(false)

  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dnc'] })

  const { data, isLoading } = useQuery({
    queryKey: ['dnc'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sdr/dnc')
      return res.json() as Promise<{ entries: DncEntry[] }>
    },
  })

  const filtered = useMemo(() => {
    const entries = data?.entries || []
    if (!filterWorkspace) return entries
    return entries.filter((e) => e.workspace_id === filterWorkspace)
  }, [data, filterWorkspace])

  const addMutation = useMutation({
    mutationFn: async ({ workspace_id, emails, reason }: { workspace_id: string; emails: string[]; reason?: string }) => {
      const res = await fetch('/api/admin/sdr/dnc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id, emails, reason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add')
      }
    },
    onSuccess: () => {
      invalidate()
      // Reset both single and CSV modal states
      setShowAddModal(false)
      setShowCsvModal(false)
      setAddEmail('')
      setAddReason('')
      setAddWorkspaceId('')
      setCsvEmails([])
      setCsvReason('')
      setCsvPreview(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/sdr/dnc/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to remove')
      }
    },
    onSuccess: () => {
      invalidate()
      setRemoveId(null)
    },
  })

  const handleCsvFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      // Extract first column (email), validate format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const emails = lines
        .map((l) => l.split(',')[0].replace(/["']/g, '').trim())
        .filter((e) => emailRegex.test(e))
      setCsvEmails(emails)
      setCsvPreview(true)
    }
    reader.readAsText(file)
  }

  const wsName = (id: string) => workspaces.find((w) => w.id === id)?.name || id

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Do Not Contact List</h1>
          <p className="text-sm text-zinc-500 mt-1">{(data?.entries || []).length} total entries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50 text-zinc-700 transition-colors"
          >
            Upload CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Email
          </button>
        </div>
      </div>

      {/* Workspace filter */}
      <div className="mb-4">
        <select
          value={filterWorkspace}
          onChange={(e) => setFilterWorkspace(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">All workspaces</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Workspace</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Added By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Date</th>
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">No entries found.</td></tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-sm text-zinc-700 font-mono">{entry.email}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{wsName(entry.workspace_id)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{entry.reason || '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{entry.added_by || '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{timeAgo(entry.added_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setRemoveId(entry.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Add Email to DNC</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="person@example.com"
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Workspace</label>
                <select
                  value={addWorkspaceId}
                  onChange={(e) => setAddWorkspaceId(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select workspace...</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  placeholder="e.g. Requested removal"
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  addMutation.mutate({
                    workspace_id: addWorkspaceId,
                    emails: [addEmail],
                    reason: addReason || undefined,
                  })
                }
                disabled={!addEmail || !addWorkspaceId || addMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {addMutation.isPending ? 'Adding...' : 'Add to DNC'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Upload CSV</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Workspace</label>
                <select
                  value={csvWorkspaceId}
                  onChange={(e) => setCsvWorkspaceId(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select workspace...</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={csvReason}
                  onChange={(e) => setCsvReason(e.target.value)}
                  placeholder="e.g. Bulk unsubscribe"
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {!csvPreview ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">CSV File (one email per row)</label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleCsvFile(file)
                    }}
                    className="w-full text-sm text-zinc-600"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-700">
                    Found <strong>{csvEmails.length}</strong> emails. Preview:
                  </p>
                  <div className="bg-zinc-50 border rounded p-2 text-xs font-mono space-y-0.5 max-h-32 overflow-y-auto">
                    {csvEmails.slice(0, 5).map((e) => (
                      <div key={e}>{e}</div>
                    ))}
                    {csvEmails.length > 5 && (
                      <div className="text-zinc-400">...and {csvEmails.length - 5} more</div>
                    )}
                  </div>
                  <button
                    onClick={() => setCsvPreview(false)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Upload different file
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCsvModal(false)
                  setCsvEmails([])
                  setCsvPreview(false)
                }}
                className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  addMutation.mutate({ workspace_id: csvWorkspaceId, emails: csvEmails, reason: csvReason || undefined })
                }
                disabled={!csvWorkspaceId || csvEmails.length === 0 || addMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {addMutation.isPending ? 'Adding...' : `Add ${csvEmails.length} Emails`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirm dialog */}
      {removeId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-semibold mb-2">Remove from DNC?</h2>
            <p className="text-sm text-zinc-500 mb-5">
              This email will no longer be blocked from receiving automated responses.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRemoveId(null)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() => removeMutation.mutate(removeId)}
                disabled={removeMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
