// Inline Status Editor
// Click to edit lead status with dropdown

'use client'

import { useState, useRef, useEffect } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react'
import { Check, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/app/crm/components/StatusBadge'
import { useUpdateLead } from '@/lib/hooks/use-leads'
import type { LeadStatus } from '@/types/crm.types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

interface InlineStatusEditProps {
  leadId: string
  currentStatus: LeadStatus
}

export function InlineStatusEdit({ leadId, currentStatus }: InlineStatusEditProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [showSuccess, setShowSuccess] = useState(false)
  const updateMutation = useUpdateLead()

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const handleStatusSelect = async (status: LeadStatus) => {
    if (status === selectedStatus) {
      setIsOpen(false)
      return
    }

    setSelectedStatus(status)
    setIsOpen(false)

    try {
      await updateMutation.mutateAsync({
        id: leadId,
        updates: { status },
      })

      // Show success checkmark briefly
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      // Revert on error
      setSelectedStatus(currentStatus)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, status: LeadStatus) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleStatusSelect(status)
    }
  }

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn(
          'inline-flex items-center gap-1 rounded-md transition-colors hover:bg-muted/50 px-1 -mx-1',
          updateMutation.isPending && 'opacity-50 cursor-wait'
        )}
        disabled={updateMutation.isPending}
        aria-label="Edit status"
      >
        <StatusBadge status={selectedStatus} />
        {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
        {showSuccess && !updateMutation.isPending && (
          <Check className="h-3.5 w-3.5 text-green-600 ml-1 animate-in fade-in zoom-in duration-200" />
        )}
      </button>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 min-w-[140px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            >
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, option.value)}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    selectedStatus === option.value && 'bg-accent/50'
                  )}
                >
                  <span className="flex-1">{option.label}</span>
                  {selectedStatus === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
