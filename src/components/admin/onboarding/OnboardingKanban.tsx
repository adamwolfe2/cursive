'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { cn } from '@/lib/design-system'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckSquare, Square, Download, X, ClipboardList, Inbox, Plus } from 'lucide-react'
import ClientCard from './ClientCard'
import { updateClientStatus } from '@/app/admin/onboarding/actions'
import type { OnboardingClient, ClientStatus } from '@/types/onboarding'
import { CLIENT_STATUSES, STATUS_LABELS } from '@/types/onboarding'

const COLUMN_COLORS: Record<ClientStatus, string> = {
  lead: 'bg-slate-50 border-slate-200',
  booked: 'bg-blue-50 border-blue-200',
  discovery: 'bg-purple-50 border-purple-200',
  closed: 'bg-yellow-50 border-yellow-200',
  onboarding: 'bg-orange-50 border-orange-200',
  setup: 'bg-cyan-50 border-cyan-200',
  active: 'bg-green-50 border-green-200',
  reporting: 'bg-indigo-50 border-indigo-200',
  churned: 'bg-red-50 border-red-200',
}

const COLUMN_DOT_COLORS: Record<ClientStatus, string> = {
  lead: 'bg-slate-400',
  booked: 'bg-blue-400',
  discovery: 'bg-purple-400',
  closed: 'bg-yellow-500',
  onboarding: 'bg-orange-400',
  setup: 'bg-cyan-400',
  active: 'bg-green-500',
  reporting: 'bg-indigo-400',
  churned: 'bg-red-400',
}

interface SortableCardProps {
  client: OnboardingClient
}

function SortableCard({ client }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id, data: { status: client.status } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ClientCard client={client} />
    </div>
  )
}

interface OnboardingKanbanProps {
  clients: OnboardingClient[]
}

export default function OnboardingKanban({ clients: initialClients }: OnboardingKanbanProps) {
  const [clients, setClients] = useState(initialClients)
  const [activeClient, setActiveClient] = useState<OnboardingClient | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMoving, setBulkMoving] = useState(false)

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkMove = useCallback(async (targetStatus: ClientStatus) => {
    if (selectedIds.size === 0) return
    setBulkMoving(true)

    const idsToMove = Array.from(selectedIds)
    // Optimistic update
    setClients((prev) =>
      prev.map((c) => idsToMove.includes(c.id) ? { ...c, status: targetStatus } : c)
    )

    try {
      await Promise.all(idsToMove.map((id) => updateClientStatus(id, targetStatus)))
      setSelectedIds(new Set())
      setSelectMode(false)
    } catch {
      setClients(initialClients) // Revert all on failure
    } finally {
      setBulkMoving(false)
    }
  }, [selectedIds, initialClients])

  const handleExportCSV = useCallback(() => {
    const toExport = selectedIds.size > 0
      ? clients.filter((c) => selectedIds.has(c.id))
      : clients

    const headers = ['Company', 'Contact', 'Email', 'Packages', 'Status', 'Created']
    const rows = toExport.map((c) => [
      c.company_name,
      c.primary_contact_name,
      c.primary_contact_email,
      (c.packages_selected || []).join('; '),
      c.status,
      new Date(c.created_at).toLocaleDateString(),
    ])

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cursive-clients-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [clients, selectedIds])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const clientsByStatus = CLIENT_STATUSES.reduce<Record<ClientStatus, OnboardingClient[]>>(
    (acc, status) => {
      acc[status] = clients.filter((c) => c.status === status)
      return acc
    },
    {} as Record<ClientStatus, OnboardingClient[]>
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const client = clients.find((c) => c.id === event.active.id)
    setActiveClient(client ?? null)
  }, [clients])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveClient(null)
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Determine the target status
    let targetStatus: ClientStatus | null = null

    // If dropped on a column droppable
    if (CLIENT_STATUSES.includes(overId as ClientStatus)) {
      targetStatus = overId as ClientStatus
    } else {
      // Dropped on another card -- find that card's status
      const overClient = clients.find((c) => c.id === overId)
      if (overClient) {
        targetStatus = overClient.status
      }
    }

    if (!targetStatus) return

    const movedClient = clients.find((c) => c.id === activeId)
    if (!movedClient || movedClient.status === targetStatus) return

    // Optimistic update
    setClients((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, status: targetStatus as ClientStatus } : c
      )
    )

    try {
      await updateClientStatus(activeId, targetStatus)
    } catch {
      // Revert on failure
      setClients((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, status: movedClient.status } : c
        )
      )
    }
  }, [clients])

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">
          No onboarding clients yet
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          Send a client the link at{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
            /client-onboarding
          </code>{' '}
          or create one manually via &apos;New Client&apos;.
        </p>
        <Link href="/admin/onboarding/new" className="mt-5">
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Create first client
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Bulk toolbar */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <button
          type="button"
          onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()) }}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            selectMode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          {selectMode ? `${selectedIds.size} selected` : 'Select'}
        </button>

        {selectMode && selectedIds.size > 0 && (
          <>
            <select
              onChange={(e) => { if (e.target.value) handleBulkMove(e.target.value as ClientStatus) }}
              disabled={bulkMoving}
              className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
              defaultValue=""
            >
              <option value="" disabled>Move to...</option>
              {CLIENT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setSelectedIds(new Set()); setSelectMode(false) }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 ml-auto"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV {selectedIds.size > 0 ? `(${selectedIds.size})` : `(${clients.length})`}
        </button>
      </div>

    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
        {CLIENT_STATUSES.map((status) => {
          const columnClients = clientsByStatus[status]
          const ids = columnClients.map((c) => c.id)

          return (
            <SortableContext
              key={status}
              id={status}
              items={ids}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                status={status}
                count={columnClients.length}
              >
                {columnClients.map((client) => (
                  <div
                    key={client.id}
                    className="relative"
                    aria-label={`${client.company_name} — ${STATUS_LABELS[client.status]}`}
                  >
                    {selectMode && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSelect(client.id) }}
                        className="absolute top-2 left-2 z-10"
                        aria-label={
                          selectedIds.has(client.id)
                            ? `Deselect ${client.company_name}`
                            : `Select ${client.company_name}`
                        }
                      >
                        {selectedIds.has(client.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                    )}
                    <SortableCard client={client} />
                  </div>
                ))}
              </KanbanColumn>
            </SortableContext>
          )
        })}
      </div>

      <DragOverlay>
        {activeClient ? (
          <div className="rotate-2 opacity-90">
            <ClientCard client={activeClient} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </div>
  )
}

interface KanbanColumnProps {
  status: ClientStatus
  count: number
  children: React.ReactNode
}

function KanbanColumn({ status, count, children }: KanbanColumnProps) {
  const {
    setNodeRef,
  } = useSortable({
    id: status,
    data: { type: 'column', status },
    disabled: true,
  })

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`${STATUS_LABELS[status]} clients (${count})`}
      className={cn(
        'flex flex-col shrink-0 w-[260px] rounded-lg border p-2',
        COLUMN_COLORS[status]
      )}
    >
      <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', COLUMN_DOT_COLORS[status])} />
          <span className="text-xs font-semibold text-foreground">
            {STATUS_LABELS[status]}
          </span>
        </div>
        <Badge size="sm" variant="muted">
          {count}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[calc(100vh-360px)] min-h-[80px]">
        {children}
        {count === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 bg-background/40 px-3 py-5 min-h-[80px] text-muted-foreground/70"
            aria-hidden="true"
          >
            <Inbox className="h-4 w-4" />
            <span className="text-[11px] font-medium">No clients</span>
          </div>
        )}
      </div>
    </div>
  )
}
