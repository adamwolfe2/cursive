'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StatCard, Skeleton } from '@/components/ui'
import type { SdrKnowledgeEntry, KnowledgeCategory } from '@/types/sdr'

const CATEGORIES: KnowledgeCategory[] = [
  'product',
  'objection_handling',
  'pricing',
  'scheduling',
  'competitor',
  'case_study',
  'faq',
  'custom',
]

interface KnowledgeFormData {
  title: string
  content: string
  category: KnowledgeCategory
  keywords: string
  priority: number
  is_active: boolean
}

const EMPTY_FORM: KnowledgeFormData = {
  title: '',
  content: '',
  category: 'product',
  keywords: '',
  priority: 5,
  is_active: true,
}

export default function SdrKnowledgePage() {
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<KnowledgeFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sdr-knowledge', filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterCategory) params.set('category', filterCategory)
      const res = await fetch(`/api/sdr/knowledge?${params}`)
      if (!res.ok) throw new Error('Failed to load knowledge entries')
      return res.json() as Promise<{ entries: SdrKnowledgeEntry[]; total: number }>
    },
    staleTime: 30_000,
  })

  const entries = data?.entries ?? []

  const saveMutation = useMutation({
    mutationFn: async (payload: KnowledgeFormData & { id?: string }) => {
      const { id, keywords, ...rest } = payload
      const body = { ...rest, keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean) }
      const url = id ? `/api/sdr/knowledge/${id}` : '/api/sdr/knowledge'
      const method = id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-knowledge'] })
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      setFormError(null)
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sdr/knowledge/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sdr-knowledge'] }),
  })

  const handleEdit = (entry: SdrKnowledgeEntry) => {
    setEditingId(entry.id)
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      keywords: entry.keywords.join(', '),
      priority: entry.priority,
      is_active: entry.is_active,
    })
    setShowForm(true)
    setFormError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(editingId ? { ...form, id: editingId } : form)
  }

  const totalUsage = entries.reduce((sum, e) => sum + e.usage_count, 0)
  const avgSuccessRate =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.success_rate, 0) / entries.length
      : 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Knowledge Base</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setForm(EMPTY_FORM)
            setFormError(null)
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Entry
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Entries" value={entries.length} />
        <StatCard label="Total Usage" value={totalUsage} />
        <StatCard label="Avg Success Rate" value={`${Math.round(avgSuccessRate * 100)}%`} />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700">
            {editingId ? 'Edit Entry' : 'New Entry'}
          </h3>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
              {formError}
            </div>
          )}
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <textarea
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            rows={4}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as KnowledgeCategory })}
              className="px-3 py-2 text-sm border rounded-md bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Keywords (comma separated)"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="number"
              min={1}
              max={10}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              className="w-20 px-3 py-2 text-sm border rounded-md"
              title="Priority (1-10)"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null) }}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">
          No knowledge entries found. Add your first entry above.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-zinc-600">Title</th>
                <th className="text-left px-4 py-2 font-medium text-zinc-600">Category</th>
                <th className="text-left px-4 py-2 font-medium text-zinc-600">Keywords</th>
                <th className="text-right px-4 py-2 font-medium text-zinc-600">Usage</th>
                <th className="text-right px-4 py-2 font-medium text-zinc-600">Success</th>
                <th className="text-right px-4 py-2 font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.id} className={`hover:bg-zinc-50 ${!entry.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 font-medium text-zinc-800">{entry.title}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded">
                      {entry.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-zinc-500 text-xs">
                    {entry.keywords.slice(0, 3).join(', ')}
                    {entry.keywords.length > 3 && ` +${entry.keywords.length - 3}`}
                  </td>
                  <td className="px-4 py-2 text-right text-zinc-600">{entry.usage_count}</td>
                  <td className="px-4 py-2 text-right text-zinc-600">
                    {Math.round(entry.success_rate * 100)}%
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-blue-600 hover:text-blue-800 text-xs mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(entry.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
