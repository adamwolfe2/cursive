'use client'

/**
 * Premium Requests Client Component
 * Interactive table for viewing and managing premium feature requests
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { PremiumFeatureRequest, FeatureType } from '@/types/premium'
import { PREMIUM_FEATURES } from '@/types/premium'

interface PremiumRequestsClientProps {
  initialRequests: any[]
}

export function PremiumRequestsClient({ initialRequests }: PremiumRequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [processing, setProcessing] = useState(false)

  const filteredRequests = requests.filter((req) =>
    filter === 'all' ? true : req.status === filter
  )

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    reviewing: requests.filter((r) => r.status === 'reviewing').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }

  async function handleApprove(requestId: string) {
    const notes = prompt('Add approval notes (optional):')
    if (notes === null) return // User cancelled

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/premium-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve request')
      }

      toast.success('Request approved and feature access granted!')

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: 'approved', reviewed_at: new Date().toISOString() }
            : req
        )
      )
      setSelectedRequest(null)
    } catch (error) {
      console.error('Failed to approve request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve request')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject(requestId: string) {
    const notes = prompt('Rejection reason:')
    if (!notes) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/premium-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject request')
      }

      toast.success('Request rejected')

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: 'rejected', reviewed_at: new Date().toISOString() }
            : req
        )
      )
      setSelectedRequest(null)
    } catch (error) {
      console.error('Failed to reject request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject request')
    } finally {
      setProcessing(false)
    }
  }

  const featureInfo = selectedRequest ? PREMIUM_FEATURES[selectedRequest.feature_type as FeatureType] : null

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        {[
          { label: 'All', value: 'all', count: statusCounts.all },
          { label: 'Pending', value: 'pending', count: statusCounts.pending },
          { label: 'Reviewing', value: 'reviewing', count: statusCounts.reviewing },
          { label: 'Approved', value: 'approved', count: statusCounts.approved },
          { label: 'Rejected', value: 'rejected', count: statusCounts.rejected },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              filter === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border border-zinc-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">
                Feature
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">
                Workspace
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 uppercase">
                Requested
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => {
                const featureInfo = PREMIUM_FEATURES[request.feature_type as FeatureType]
                return (
                  <tr
                    key={request.id}
                    className="hover:bg-zinc-50 cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{featureInfo?.icon}</span>
                        <span className="text-sm font-medium text-zinc-900">
                          {featureInfo?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {request.workspace?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {request.user?.full_name || request.user?.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : request.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : request.status === 'reviewing'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(request.id)
                            }}
                            disabled={processing}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(request.id)
                            }}
                            disabled={processing}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{featureInfo?.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    {selectedRequest.title}
                  </h2>
                  <p className="text-sm text-zinc-600">{featureInfo?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-2 hover:bg-zinc-100"
              >
                <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-600">Workspace</p>
                <p className="text-sm text-zinc-900">
                  {selectedRequest.workspace?.name} ({selectedRequest.workspace?.slug})
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-600">Requested by</p>
                <p className="text-sm text-zinc-900">
                  {selectedRequest.user?.full_name || selectedRequest.user?.email}
                </p>
              </div>

              {selectedRequest.use_case && (
                <div>
                  <p className="text-sm font-medium text-zinc-600">Use Case</p>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                    {selectedRequest.use_case}
                  </p>
                </div>
              )}

              {selectedRequest.expected_volume && (
                <div>
                  <p className="text-sm font-medium text-zinc-600">Expected Volume</p>
                  <p className="text-sm text-zinc-700">{selectedRequest.expected_volume}</p>
                </div>
              )}

              {selectedRequest.budget_range && (
                <div>
                  <p className="text-sm font-medium text-zinc-600">Budget Range</p>
                  <p className="text-sm text-zinc-700">{selectedRequest.budget_range}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-zinc-600">Contact Preference</p>
                <p className="text-sm text-zinc-700">{selectedRequest.contact_preference}</p>
              </div>

              {selectedRequest.description && (
                <div>
                  <p className="text-sm font-medium text-zinc-600">Additional Notes</p>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                    {selectedRequest.description}
                  </p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={processing}
                  >
                    Reject Request
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={processing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Approve & Grant Access
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
