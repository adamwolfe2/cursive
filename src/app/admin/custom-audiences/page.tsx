'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Mail, CheckCircle2, XCircle, Clock, Package } from 'lucide-react'
import { safeError } from '@/lib/utils/log-sanitizer'
import { useToast } from '@/lib/hooks/use-toast'

interface CustomAudienceRequest {
  id: string
  workspace_id: string
  user_id: string
  industry: string
  geography: string
  company_size: string
  seniority_levels: string[]
  intent_signals: string | null
  desired_volume: string
  additional_notes: string | null
  status: string
  assigned_to: string | null
  sample_delivered_at: string | null
  full_delivered_at: string | null
  leads_delivered: number | null
  price_per_lead: number | null
  total_price: number | null
  created_at: string
  updated_at: string
  users?: {
    email: string
    full_name: string | null
  }
  workspaces?: {
    name: string
  }
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sample_sent: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  fulfilled: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
}

const STATUS_ICONS = {
  pending: Clock,
  sample_sent: Package,
  approved: CheckCircle2,
  fulfilled: CheckCircle2,
  rejected: XCircle,
  cancelled: XCircle,
}

export default function CustomAudiencesAdminPage() {
  const [requests, setRequests] = useState<CustomAudienceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<CustomAudienceRequest | null>(null)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('custom_audience_requests')
      .select(`
        *,
        users (email, full_name),
        workspaces (name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[CustomAudiences]', 'Failed to fetch requests:', error)
    } else {
      setRequests(data || [])
    }

    setLoading(false)
  }

  async function updateStatus(requestId: string, newStatus: string) {
    setUpdating(true)
    const supabase = createClient()

    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'sample_sent' && !selectedRequest?.sample_delivered_at) {
      updates.sample_delivered_at = new Date().toISOString()
    }

    if (newStatus === 'fulfilled' && !selectedRequest?.full_delivered_at) {
      updates.full_delivered_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('custom_audience_requests')
      .update(updates)
      .eq('id', requestId)

    if (error) {
      safeError('[CustomAudiences]', 'Failed to update status:', error)
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    } else {
      await fetchRequests()
      setSelectedRequest(null)
    }

    setUpdating(false)
  }

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter)

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    sample_sent: requests.filter(r => r.status === 'sample_sent').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading requests...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Custom Audience Requests</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.total} total • {stats.pending} pending • {stats.fulfilled} fulfilled
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filter === 'all'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filter === 'pending'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </button>

          <button
            onClick={() => setFilter('sample_sent')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filter === 'sample_sent'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-blue-600">{stats.sample_sent}</div>
            <div className="text-sm text-gray-600">Sample Sent</div>
          </button>

          <button
            onClick={() => setFilter('fulfilled')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filter === 'fulfilled'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-green-600">{stats.fulfilled}</div>
            <div className="text-sm text-gray-600">Fulfilled</div>
          </button>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geography
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const StatusIcon = STATUS_ICONS[request.status as keyof typeof STATUS_ICONS]

                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="font-medium">
                            {request.users?.full_name || 'N/A'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {request.users?.email}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.industry}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.geography}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.desired_volume} leads
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]
                          }`}>
                            {StatusIcon && <StatusIcon className="h-3 w-3" />}
                            {request.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Requester</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium text-gray-900">
                    {selectedRequest.users?.full_name || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {selectedRequest.users?.email}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Workspace: {selectedRequest.workspaces?.name || selectedRequest.workspace_id}
                  </div>
                </div>
              </div>

              {/* Criteria */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Criteria</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Industry</div>
                    <div className="font-medium text-gray-900">{selectedRequest.industry}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Geography</div>
                    <div className="font-medium text-gray-900">{selectedRequest.geography}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Company Size</div>
                    <div className="font-medium text-gray-900">{selectedRequest.company_size}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Volume</div>
                    <div className="font-medium text-gray-900">{selectedRequest.desired_volume} leads</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1">Seniority Levels</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.seniority_levels.map((level) => (
                      <span
                        key={level}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedRequest.intent_signals && (
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mb-1">Intent Signals</div>
                    <div className="text-sm text-gray-900 bg-gray-50 rounded p-3">
                      {selectedRequest.intent_signals}
                    </div>
                  </div>
                )}

                {selectedRequest.additional_notes && (
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mb-1">Additional Notes</div>
                    <div className="text-sm text-gray-900 bg-gray-50 rounded p-3">
                      {selectedRequest.additional_notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Dates */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status & Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      STATUS_COLORS[selectedRequest.status as keyof typeof STATUS_COLORS]
                    }`}>
                      {selectedRequest.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requested:</span>
                    <span className="text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</span>
                  </div>
                  {selectedRequest.sample_delivered_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sample Sent:</span>
                      <span className="text-gray-900">{new Date(selectedRequest.sample_delivered_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedRequest.full_delivered_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fulfilled:</span>
                      <span className="text-gray-900">{new Date(selectedRequest.full_delivered_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedRequest.leads_delivered && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leads Delivered:</span>
                      <span className="text-gray-900">{selectedRequest.leads_delivered}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Update Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRequest.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(selectedRequest.id, 'sample_sent')}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Mark Sample Sent
                    </button>
                  )}
                  {(selectedRequest.status === 'pending' || selectedRequest.status === 'sample_sent') && (
                    <button
                      onClick={() => updateStatus(selectedRequest.id, 'approved')}
                      disabled={updating}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Mark Approved
                    </button>
                  )}
                  {selectedRequest.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(selectedRequest.id, 'fulfilled')}
                      disabled={updating}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Mark Fulfilled
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                    disabled={updating}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
