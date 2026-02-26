'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'

interface BulkIntelligenceActionProps {
  selectedLeadIds: string[]
  onComplete?: () => void
}

export function BulkIntelligenceAction({ selectedLeadIds, onComplete }: BulkIntelligenceActionProps) {
  const toast = useToast()
  const [show, setShow] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/leads/bulk-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: selectedLeadIds, tier: 'intel' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      return data
    },
    onSuccess: (data) => {
      setShow(false)
      onComplete?.()
      toast.success(
        `Enrichment queued for ${data.leads_queued ?? selectedLeadIds.length} leads. ${data.credits_deducted ?? selectedLeadIds.length * 2} credits used.`
      )
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Bulk enrichment failed. Please try again.')
    },
  })

  if (selectedLeadIds.length === 0) return null

  const creditsNeeded = selectedLeadIds.length * 2

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
      >
        Intel Pack ({selectedLeadIds.length} leads)
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900">Run Intelligence Pack</h3>
            <p className="text-xs text-gray-500 mt-1">
              Enrich {selectedLeadIds.length} selected leads with LinkedIn profiles, social handles, and
              news mentions.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mt-3 border border-gray-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Credits per lead</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-600">Total leads</span>
                <span className="font-medium">{selectedLeadIds.length}</span>
              </div>
              <div className="flex justify-between text-xs mt-1 pt-1 border-t border-gray-200">
                <span className="font-medium text-gray-700">Total credits</span>
                <span className="font-semibold">{creditsNeeded}</span>
              </div>
            </div>
            {mutation.error && (
              <p className="text-xs text-red-600 mt-2">{(mutation.error as Error).message}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShow(false)}
                className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {mutation.isPending ? 'Queuing...' : `Enrich ${selectedLeadIds.length} Leads`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
