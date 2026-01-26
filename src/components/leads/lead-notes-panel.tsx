'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils'
import type { LeadNote, NoteType } from '@/types'
import { NOTE_TYPES } from '@/types'

interface LeadNotesPanelProps {
  leadId: string
  className?: string
}

const noteTypeIcons: Record<NoteType, React.ReactNode> = {
  note: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  call: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  email: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  meeting: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  task: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
}

const noteTypeColors: Record<NoteType, string> = {
  note: 'bg-zinc-100 text-zinc-600',
  call: 'bg-blue-100 text-blue-600',
  email: 'bg-purple-100 text-purple-600',
  meeting: 'bg-orange-100 text-orange-600',
  task: 'bg-emerald-100 text-emerald-600',
}

async function fetchNotes(leadId: string): Promise<{ notes: LeadNote[] }> {
  const res = await fetch(`/api/leads/${leadId}/notes`)
  if (!res.ok) throw new Error('Failed to fetch notes')
  return res.json()
}

async function createNote(leadId: string, data: { content: string; note_type: NoteType; is_pinned?: boolean }) {
  const res = await fetch(`/api/leads/${leadId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create note')
  return res.json()
}

async function deleteNote(leadId: string, noteId: string) {
  const res = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete note')
  return res.json()
}

async function togglePin(leadId: string, noteId: string, isPinned: boolean) {
  const res = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_pinned: !isPinned }),
  })
  if (!res.ok) throw new Error('Failed to update note')
  return res.json()
}

export function LeadNotesPanel({ leadId, className }: LeadNotesPanelProps) {
  const [newNoteContent, setNewNoteContent] = useState('')
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>('note')
  const [isExpanded, setIsExpanded] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['lead-notes', leadId],
    queryFn: () => fetchNotes(leadId),
  })

  const createMutation = useMutation({
    mutationFn: (noteData: { content: string; note_type: NoteType }) => createNote(leadId, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] })
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] })
      setNewNoteContent('')
      setIsExpanded(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => deleteNote(leadId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] })
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] })
    },
  })

  const pinMutation = useMutation({
    mutationFn: ({ noteId, isPinned }: { noteId: string; isPinned: boolean }) => togglePin(leadId, noteId, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteContent.trim()) return
    createMutation.mutate({ content: newNoteContent, note_type: selectedNoteType })
  }

  const notes = data?.notes || []

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Note Form */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h4 className="text-sm font-medium text-zinc-900">Add Note</h4>
          <svg
            className={cn('h-4 w-4 text-zinc-400 transition-transform', isExpanded && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isExpanded && (
          <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-4 space-y-3">
            {/* Note Type Selector */}
            <div className="flex gap-1">
              {NOTE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedNoteType(type.value as NoteType)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    selectedNoteType === type.value
                      ? noteTypeColors[type.value as NoteType]
                      : 'text-zinc-500 hover:bg-zinc-100'
                  )}
                >
                  {noteTypeIcons[type.value as NoteType]}
                  {type.label}
                </button>
              ))}
            </div>

            {/* Content Input */}
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder={`Add a ${selectedNoteType}...`}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newNoteContent.trim() || createMutation.isPending}
                className={cn(
                  'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700',
                  (!newNoteContent.trim() || createMutation.isPending) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {createMutation.isPending ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="h-5 w-5 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            No notes yet. Add your first note above.
          </div>
        ) : (
          notes.map((note: any) => (
            <div
              key={note.id}
              className={cn(
                'rounded-lg border bg-white p-4',
                note.is_pinned ? 'border-amber-200 bg-amber-50/50' : 'border-zinc-200'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-md p-1.5', noteTypeColors[note.note_type as NoteType])}>
                    {noteTypeIcons[note.note_type as NoteType]}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-zinc-900">
                      {note.created_by_user?.full_name || 'Unknown'}
                    </span>
                    <span className="mx-1.5 text-zinc-300">·</span>
                    <span className="text-xs text-zinc-500" title={formatDateTime(note.created_at)}>
                      {formatRelativeTime(note.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => pinMutation.mutate({ noteId: note.id, isPinned: note.is_pinned })}
                    className={cn(
                      'rounded p-1 transition-colors',
                      note.is_pinned ? 'text-amber-500 hover:text-amber-600' : 'text-zinc-400 hover:text-zinc-600'
                    )}
                    title={note.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    <svg className="h-4 w-4" fill={note.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this note?')) {
                        deleteMutation.mutate(note.id)
                      }
                    }}
                    className="rounded p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <p className="mt-3 text-sm text-zinc-700 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
