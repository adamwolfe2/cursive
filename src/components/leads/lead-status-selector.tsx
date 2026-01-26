'use client'

import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/types'
import { LEAD_STATUSES } from '@/types'

interface LeadStatusSelectorProps {
  currentStatus: LeadStatus
  onStatusChange: (status: LeadStatus, note?: string) => Promise<void>
  disabled?: boolean
  size?: 'sm' | 'md'
}

const statusColors: Record<LeadStatus, { bg: string; text: string; ring: string; dot: string }> = {
  new: { bg: 'bg-zinc-50', text: 'text-zinc-700', ring: 'ring-zinc-200', dot: 'bg-zinc-400' },
  contacted: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  qualified: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200', dot: 'bg-purple-500' },
  proposal: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-200', dot: 'bg-yellow-500' },
  negotiation: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', dot: 'bg-orange-500' },
  won: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  lost: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', dot: 'bg-red-500' },
}

export function LeadStatusSelector({
  currentStatus,
  onStatusChange,
  disabled = false,
  size = 'md',
}: LeadStatusSelectorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null)
  const [note, setNote] = useState('')

  const currentStatusConfig = LEAD_STATUSES.find(s => s.value === currentStatus)
  const colors = statusColors[currentStatus]

  const handleSelect = async (status: LeadStatus) => {
    if (status === currentStatus) return

    // For won/lost, ask for a note
    if (status === 'won' || status === 'lost') {
      setPendingStatus(status)
      setShowNoteModal(true)
      return
    }

    await performStatusChange(status)
  }

  const performStatusChange = async (status: LeadStatus, statusNote?: string) => {
    setIsLoading(true)
    try {
      await onStatusChange(status, statusNote)
    } finally {
      setIsLoading(false)
      setShowNoteModal(false)
      setPendingStatus(null)
      setNote('')
    }
  }

  const handleNoteSubmit = () => {
    if (pendingStatus) {
      performStatusChange(pendingStatus, note)
    }
  }

  return (
    <>
      <Listbox value={currentStatus} onChange={handleSelect} disabled={disabled || isLoading}>
        <div className="relative">
          <Listbox.Button
            className={cn(
              'relative w-full cursor-pointer rounded-lg py-2 pl-3 pr-10 text-left ring-1 ring-inset transition-all',
              colors.bg,
              colors.text,
              colors.ring,
              size === 'sm' ? 'text-xs' : 'text-sm',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
              <span className="font-medium">{currentStatusConfig?.label || currentStatus}</span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              {isLoading ? (
                <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              )}
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {LEAD_STATUSES.map((status) => {
                const statusColor = statusColors[status.value as LeadStatus]
                return (
                  <Listbox.Option
                    key={status.value}
                    value={status.value}
                    className={({ active }) =>
                      cn(
                        'relative cursor-pointer select-none py-2 pl-3 pr-9',
                        active ? 'bg-zinc-50' : ''
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', statusColor.dot)} />
                          <span className={cn('font-medium', selected && 'text-zinc-900')}>
                            {status.label}
                          </span>
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                )
              })}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {/* Note Modal for Won/Lost */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setShowNoteModal(false)} />
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-zinc-900">
                {pendingStatus === 'won' ? 'Mark as Won' : 'Mark as Lost'}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                {pendingStatus === 'won'
                  ? 'Congratulations! Add a note about this win.'
                  : 'Add a reason for losing this lead.'}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={pendingStatus === 'won' ? 'What made this deal successful?' : 'Why did we lose this lead?'}
                className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                rows={3}
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNoteSubmit}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white',
                    pendingStatus === 'won' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isLoading ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
