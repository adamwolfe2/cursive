'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Clock,
  Plus,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDistanceToNow } from 'date-fns'
import type { Activity, ActivityType } from '@/types/crm.types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

const ACTIVITY_TYPES: ActivityType[] = ['call', 'email', 'meeting', 'note', 'task']

const TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  task: 'Task',
}

function ActivityIcon({ type, className }: { type: string; className?: string }) {
  const cls = className ?? 'h-4 w-4'
  switch (type) {
    case 'call':
      return <Phone className={cls} />
    case 'email':
      return <Mail className={cls} />
    case 'meeting':
      return <Calendar className={cls} />
    case 'note':
      return <FileText className={cls} />
    case 'task':
      return <CheckSquare className={cls} />
    default:
      return <FileText className={cls} />
  }
}

function typeColor(type: string): string {
  const map: Record<string, string> = {
    call: 'bg-blue-100 text-blue-700',
    email: 'bg-violet-100 text-violet-700',
    meeting: 'bg-amber-100 text-amber-700',
    note: 'bg-gray-100 text-gray-700',
    task: 'bg-green-100 text-green-700',
  }
  return map[type] ?? 'bg-gray-100 text-gray-700'
}

// ─── fetch ────────────────────────────────────────────────────────────────────

interface ActivitiesResponse {
  data: Activity[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

async function fetchActivities(params: {
  activity_type?: string
  is_completed?: string
  search?: string
  page?: number
  page_size?: number
}): Promise<ActivitiesResponse> {
  const url = new URL('/api/crm/activities', window.location.origin)
  if (params.activity_type) url.searchParams.set('activity_type', params.activity_type)
  if (params.is_completed) url.searchParams.set('is_completed', params.is_completed)
  if (params.search) url.searchParams.set('search', params.search)
  url.searchParams.set('page', String(params.page ?? 1))
  url.searchParams.set('page_size', String(params.page_size ?? 50))

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `Failed to fetch activities (${res.status})`)
  }
  return res.json()
}

// ─── new activity form ────────────────────────────────────────────────────────

interface NewActivityForm {
  activity_type: ActivityType
  subject: string
  body: string
  due_date: string
  company_id: string
  contact_id: string
  deal_id: string
}

const EMPTY_FORM: NewActivityForm = {
  activity_type: 'note',
  subject: '',
  body: '',
  due_date: '',
  company_id: '',
  contact_id: '',
  deal_id: '',
}

// ─── mark complete ────────────────────────────────────────────────────────────

async function markComplete(id: string, completed: boolean): Promise<void> {
  const res = await fetch(`/api/crm/activities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      completed_at: completed ? new Date().toISOString() : null,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? 'Failed to update activity')
  }
}

// ─── activity row ─────────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  onToggleComplete,
}: {
  activity: Activity
  onToggleComplete: (id: string, completed: boolean) => void
}) {
  const isCompleted = Boolean(activity.completed_at)

  return (
    <div
      className={`flex items-start gap-4 rounded-lg border px-4 py-3 transition-colors ${
        isCompleted ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Type icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${typeColor(activity.activity_type)}`}
      >
        <ActivityIcon type={activity.activity_type} className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`text-sm font-medium leading-5 ${
                isCompleted ? 'line-through text-muted-foreground' : 'text-gray-900'
              }`}
            >
              {activity.subject || TYPE_LABELS[activity.activity_type as ActivityType] || activity.activity_type}
            </p>
            {activity.body && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{activity.body}</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            {activity.due_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDate(activity.due_date)}
              </span>
            )}
            {/* Complete toggle */}
            <button
              onClick={() => onToggleComplete(activity.id, !isCompleted)}
              title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
              className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                isCompleted
                  ? 'border-green-400 bg-green-400 text-white'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {isCompleted && (
                <svg viewBox="0 0 10 8" className="h-3 w-3 fill-current">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="capitalize">{activity.activity_type}</span>
          {isCompleted && activity.completed_at && (
            <span className="text-green-600">Completed {formatDate(activity.completed_at)}</span>
          )}
          <span>Created {formatDate(activity.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 px-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <FileText className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">No activities yet</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Activities track calls, emails, meetings, and tasks. Connect your AudienceLab account in{' '}
        <a href="/settings/integrations" className="text-blue-600 hover:underline">
          Settings &rarr; Integrations
        </a>{' '}
        to sync activities automatically.
      </p>
      <div className="mt-6">
        <Button size="sm" onClick={onNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Activity
        </Button>
      </div>
    </div>
  )
}

// ─── tab types ────────────────────────────────────────────────────────────────

type TabValue = 'all' | ActivityType

const TABS: { label: string; value: TabValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Calls', value: 'call' },
  { label: 'Emails', value: 'email' },
  { label: 'Meetings', value: 'meeting' },
  { label: 'Notes', value: 'note' },
  { label: 'Tasks', value: 'task' },
]

// ─── main page ────────────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  const queryClient = useQueryClient()

  // filter state
  const [tab, setTab] = useState<TabValue>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // dialog state
  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm] = useState<NewActivityForm>({ ...EMPTY_FORM })

  // query
  const queryParams = {
    activity_type: tab === 'all' ? undefined : tab,
    is_completed: showCompleted ? 'true' : undefined,
    search: search || undefined,
    page: 1,
    page_size: 50,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['crm-activities', queryParams],
    queryFn: () => fetchActivities(queryParams),
  })

  // create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: NewActivityForm) => {
      const body: Record<string, string> = {
        activity_type: payload.activity_type,
      }
      if (payload.subject) body.subject = payload.subject
      if (payload.body) body.body = payload.body
      if (payload.due_date) body.due_date = payload.due_date
      if (payload.company_id) body.company_id = payload.company_id
      if (payload.contact_id) body.contact_id = payload.contact_id
      if (payload.deal_id) body.deal_id = payload.deal_id

      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to create activity')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Activity created')
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] })
      setNewOpen(false)
      setForm({ ...EMPTY_FORM })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // toggle complete mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      markComplete(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleCreate = () => {
    if (!form.company_id && !form.contact_id && !form.deal_id) {
      toast.error('At least one of Company ID, Contact ID, or Deal ID is required')
      return
    }
    createMutation.mutate(form)
  }

  const activities = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} {total === 1 ? 'activity' : 'activities'}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Activity
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Type tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-shrink-0 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + completed toggle */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 w-48 text-sm"
            />
          </form>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
              showCompleted
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Completed
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center">
          <p className="text-sm text-red-700">Failed to load activities. Please try again.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['crm-activities'] })}
          >
            Retry
          </Button>
        </div>
      ) : activities.length === 0 ? (
        <EmptyState onNew={() => setNewOpen(true)} />
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onToggleComplete={(id, completed) => toggleMutation.mutate({ id, completed })}
            />
          ))}
        </div>
      )}

      {/* New Activity dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Activity</DialogTitle>
            <DialogDescription>
              Log a call, email, meeting, note, or task. At least one linked record is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Activity Type</label>
              <Select
                value={form.activity_type}
                options={ACTIVITY_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
                onChange={(e) => setForm({ ...form, activity_type: e.target.value as ActivityType })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Input
                value={form.subject}
                placeholder="Enter a subject..."
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes / Body</label>
              <Textarea
                value={form.body}
                placeholder="Add notes..."
                rows={3}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Due Date</label>
              <Input
                type="datetime-local"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>

            <div className="rounded-lg border border-dashed border-gray-200 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Linked Record (at least one required)
              </p>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Link to Company ID</label>
                <Input
                  value={form.company_id}
                  placeholder="UUID"
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Link to Contact ID</label>
                <Input
                  value={form.contact_id}
                  placeholder="UUID"
                  onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Link to Deal ID</label>
                <Input
                  value={form.deal_id}
                  placeholder="UUID"
                  onChange={(e) => setForm({ ...form, deal_id: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewOpen(false)
                setForm({ ...EMPTY_FORM })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
