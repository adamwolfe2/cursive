'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  RefreshCw,
  AlertCircle,
  X,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/lib/hooks/use-toast'

interface Note {
  id: string
  lead_id: string
  workspace_id: string
  content: string
  note_type: string
  created_by: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  created_by_user?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

interface LeadNotesProps {
  leadId: string
}

const NOTE_TYPE_OPTIONS = [
  { value: 'note', label: 'Note', icon: MessageSquare },
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'task', label: 'Task', icon: CheckSquare },
] as const

const NOTE_TYPE_COLORS: Record<string, string> = {
  note: 'bg-gray-100 text-gray-600',
  call: 'bg-amber-100 text-amber-700',
  email: 'bg-blue-100 text-blue-700',
  meeting: 'bg-indigo-100 text-indigo-700',
  task: 'bg-green-100 text-green-700',
}

export function LeadNotes({ leadId }: LeadNotesProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<string>('note')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Fetch notes
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lead-notes', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/notes`)
      if (!res.ok) throw new Error('Failed to fetch notes')
      const json = await res.json()
      return json.data.notes as Note[]
    },
  })

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: async (params: { content: string; note_type: string }) => {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create note')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] })
      setNoteContent('')
      setNoteType('note')
      setShowForm(false)
      toast.success('Note added')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update note mutation
  const updateMutation = useMutation({
    mutationFn: async (params: { noteId: string; content?: string; is_pinned?: boolean }) => {
      const { noteId, ...updates } = params
      const res = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update note')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] })
      setEditingNoteId(null)
      setEditContent('')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete note')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] })
      toast.success('Note deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = () => {
    if (!noteContent.trim()) return
    createMutation.mutate({ content: noteContent.trim(), note_type: noteType })
  }

  const handleUpdate = (noteId: string) => {
    if (!editContent.trim()) return
    updateMutation.mutate({ noteId, content: editContent.trim() })
  }

  const handleTogglePin = (noteId: string, currentPinned: boolean) => {
    updateMutation.mutate({ noteId, is_pinned: !currentPinned })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-gray-100 rounded-lg animate-pulse">
            <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-full bg-gray-100 rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load notes</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const notes = data || []

  return (
    <div className="space-y-4">
      {/* Add Note Button / Form */}
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-full justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          {/* Note Type Selector */}
          <div className="flex gap-1.5 flex-wrap">
            {NOTE_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setNoteType(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    noteType === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Text Area */}
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your note..."
            className="w-full min-h-[100px] px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            autoFocus
          />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setNoteContent('')
                setNoteType('note')
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!noteContent.trim() || createMutation.isPending}
            >
              <Send className="h-4 w-4 mr-1" />
              {createMutation.isPending ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">No notes yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add notes to track interactions with this lead
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const NoteIcon = NOTE_TYPE_OPTIONS.find((t) => t.value === note.note_type)?.icon || MessageSquare
            const colorClass = NOTE_TYPE_COLORS[note.note_type] || NOTE_TYPE_COLORS.note
            const isEditing = editingNoteId === note.id

            return (
              <div
                key={note.id}
                className={`border rounded-lg p-4 transition-colors ${
                  note.is_pinned
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] font-normal gap-1 ${colorClass}`}>
                      <NoteIcon className="h-3 w-3" />
                      {note.note_type}
                    </Badge>
                    {note.is_pinned && (
                      <Pin className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleTogglePin(note.id, note.is_pinned)}
                      title={note.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      {note.is_pinned ? (
                        <PinOff className="h-3 w-3 text-amber-500" />
                      ) : (
                        <Pin className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingNoteId(note.id)
                        setEditContent(note.content)
                      }}
                    >
                      <Edit2 className="h-3 w-3 text-gray-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        if (confirm('Delete this note?')) {
                          deleteMutation.mutate(note.id)
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNoteId(null)
                          setEditContent('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(note.id)}
                        disabled={!editContent.trim() || updateMutation.isPending}
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                )}

                {/* Footer */}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  {note.created_by_user && (
                    <span>{note.created_by_user.full_name}</span>
                  )}
                  <span>&middot;</span>
                  <span>
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
