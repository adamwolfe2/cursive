'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FeatureRequest {
  id: string
  workspace_id: string
  user_id: string
  feature_type: string
  status: string
  priority: string
  request_title: string
  request_description: string | null
  request_data: Record<string, any>
  created_at: string
  reviewed_by: string | null
  admin_notes: string | null
  slack_message_ts: string | null
  workspace: {
    id: string
    name: string
    slug: string
  } | null
  user: {
    id: string
    email: string
    full_name: string | null
  } | null
  reviewed_by_user: {
    id: string
    email: string
    full_name: string | null
  } | null
}

interface RequestsManagementClientProps {
  initialRequests: FeatureRequest[]
}

export function RequestsManagementClient({ initialRequests }: RequestsManagementClientProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    if (filter !== 'all' && req.status !== filter) return false
    if (typeFilter !== 'all' && req.feature_type !== typeFilter) return false
    return true
  })

  // Get unique feature types
  const featureTypes = Array.from(new Set(requests.map((r) => r.feature_type)))

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_review':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200'
    }
  }

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
    return <Clock className="h-4 w-4 text-zinc-400" />
  }

  // Update request status
  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/requests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          status: newStatus,
          admin_notes: adminNotes || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update request')
      }

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: newStatus, admin_notes: adminNotes || r.admin_notes }
            : r
        )
      )

      setSelectedRequest(null)
      setAdminNotes('')
      router.refresh()
    } catch (error) {
      console.error('Failed to update request:', error)
      alert('Failed to update request')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border-zinc-300 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Feature Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border-zinc-300 text-sm"
            >
              <option value="all">All Types</option>
              {featureTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-zinc-600">
              Showing <span className="font-semibold">{filteredRequests.length}</span> of{' '}
              <span className="font-semibold">{requests.length}</span> requests
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Workspace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-zinc-900">{request.request_title}</p>
                        <p className="text-sm text-zinc-500 truncate max-w-md">
                          {request.request_description}
                        </p>
                        {request.user && (
                          <p className="text-xs text-zinc-400 mt-1">
                            by {request.user.full_name || request.user.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {request.workspace?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-zinc-500">{request.workspace?.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-900">
                        {request.feature_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                          request.status
                        )}`}
                      >
                        {request.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getPriorityIcon(request.priority)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setAdminNotes(request.admin_notes || '')
                        }}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedRequest.request_title}</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Submitted {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Workspace & User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Workspace</label>
                  <p className="text-sm text-zinc-900 mt-1">{selectedRequest.workspace?.name}</p>
                  <p className="text-xs text-zinc-500">{selectedRequest.workspace?.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Requested By</label>
                  <p className="text-sm text-zinc-900 mt-1">
                    {selectedRequest.user?.full_name || selectedRequest.user?.email}
                  </p>
                  <p className="text-xs text-zinc-500">{selectedRequest.user?.email}</p>
                </div>
              </div>

              {/* Feature Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Feature Type</label>
                  <p className="text-sm text-zinc-900 mt-1">
                    {selectedRequest.feature_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Priority</label>
                  <p className="text-sm text-zinc-900 mt-1 capitalize">{selectedRequest.priority}</p>
                </div>
              </div>

              {/* Description */}
              {selectedRequest.request_description && (
                <div>
                  <label className="text-sm font-medium text-zinc-700">Description</label>
                  <p className="text-sm text-zinc-600 mt-1">{selectedRequest.request_description}</p>
                </div>
              )}

              {/* Request Data */}
              {Object.keys(selectedRequest.request_data || {}).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-zinc-700">Request Details</label>
                  <div className="mt-2 bg-zinc-50 rounded-lg p-4 space-y-2">
                    {Object.entries(selectedRequest.request_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm font-medium text-zinc-600">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:
                        </span>
                        <span className="text-sm text-zinc-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slack Link */}
              {selectedRequest.slack_message_ts && (
                <div>
                  <a
                    href={`https://slack.com/app_redirect?channel=CHANNEL_ID&message_ts=${selectedRequest.slack_message_ts}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                  >
                    <MessageSquare className="h-4 w-4" />
                    View in Slack
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium text-zinc-700">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-2 block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
                  rows={3}
                  placeholder="Add notes about this request..."
                />
              </div>

              {/* Status Update Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                  disabled={updating || selectedRequest.status === 'approved'}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'in_review')}
                  disabled={updating || selectedRequest.status === 'in_review'}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="h-4 w-4" />
                  In Review
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  disabled={updating || selectedRequest.status === 'rejected'}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                  disabled={updating || selectedRequest.status === 'completed'}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
