'use client'

import { ReactNode, useState } from 'react'
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
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Plus, GripVertical } from 'lucide-react'

interface KanbanColumn<T> {
  id: string
  title: string
  color?: string
  count?: number
}

interface DragDropKanbanBoardProps<T> {
  columns: KanbanColumn<T>[]
  data: Record<string, T[]>
  renderCard: (item: T) => ReactNode
  onCardClick?: (item: T) => void
  onAddCard?: (columnId: string) => void
  onCardMove?: (itemId: string, fromColumn: string, toColumn: string) => void
  loading?: boolean
  className?: string
}

interface SortableCardProps<T> {
  item: T
  renderCard: (item: T) => ReactNode
  onClick?: (item: T) => void
}

function SortableCard<T extends { id: string }>({
  item,
  renderCard,
  onClick,
}: SortableCardProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all',
        isDragging && 'opacity-50',
        !isDragging && 'hover:shadow-md hover:ring-1 hover:ring-blue-200'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Card content */}
        <div
          onClick={() => onClick?.(item)}
          className={cn('flex-1', onClick && 'cursor-pointer')}
        >
          {renderCard(item)}
        </div>
      </div>
    </div>
  )
}

/**
 * Drag-and-drop Kanban board component
 * Twenty.com style with @dnd-kit for card movement
 */
export function DragDropKanbanBoard<T extends { id: string }>({
  columns,
  data,
  renderCard,
  onCardClick,
  onAddCard,
  onCardMove,
  loading = false,
  className,
}: DragDropKanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Find which column the active item is in
    let fromColumn = ''
    for (const [columnId, items] of Object.entries(data)) {
      if (items.some((item) => item.id === activeId)) {
        fromColumn = columnId
        break
      }
    }

    // If dropped on a column (not a card), move to that column
    const isColumnDrop = columns.some((col) => col.id === overId)
    const toColumn = isColumnDrop ? overId : fromColumn

    if (fromColumn && toColumn && fromColumn !== toColumn && onCardMove) {
      onCardMove(activeId, fromColumn, toColumn)
    }

    setActiveId(null)
  }

  // Get active item for drag overlay
  const activeItem = activeId
    ? Object.values(data)
        .flat()
        .find((item) => item.id === activeId)
    : null

  if (loading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className="h-full w-80 flex-shrink-0 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('flex h-full gap-3 sm:gap-4 overflow-x-auto p-3 sm:p-6 bg-gray-50', className)}>
        {columns.map((column) => {
          const columnData = data[column.id] || []

          return (
            <div
              key={column.id}
              id={column.id}
              className="flex h-full w-64 sm:w-72 md:w-80 flex-shrink-0 flex-col rounded-lg bg-white border border-gray-200 shadow-sm"
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {column.color && (
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                  )}
                  <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
                  {column.count !== undefined && (
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                      {column.count}
                    </span>
                  )}
                </div>

                {/* Add card button */}
                {onAddCard && (
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => onAddCard(column.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Cards - droppable area */}
              <SortableContext
                items={columnData.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {columnData.map((item) => (
                    <SortableCard
                      key={item.id}
                      item={item}
                      renderCard={renderCard}
                      onClick={onCardClick}
                    />
                  ))}

                  {/* Empty state */}
                  {columnData.length === 0 && (
                    <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
                      No items
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeId && activeItem ? (
          <div className="w-80 rounded-lg border border-gray-300 bg-white p-3 shadow-lg">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
