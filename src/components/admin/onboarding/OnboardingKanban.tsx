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
import { cn } from '@/lib/design-system'
import { Badge } from '@/components/ui/badge'
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

  return (
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
                  <SortableCard key={client.id} client={client} />
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

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[calc(100vh-360px)] min-h-[60px]">
        {children}
        {count === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-8">
            No clients
          </div>
        )}
      </div>
    </div>
  )
}
