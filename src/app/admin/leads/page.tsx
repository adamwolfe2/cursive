'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/use-toast'

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name: string
  company_industry: string
  company_location: { state: string; city?: string }
  intent_signal: string
  source: string
  lead_score: number
  workspace_id: string
  created_at: string
  workspace?: { name: string }
  verification_status_admin?: string
  rejection_reason?: string
  rejection_code?: string
  partner_id?: string
}

interface UploadResult {
  success: boolean
  total: number
  successful: number
  failed: number
  errors: string[]
  routing_summary: Record<string, number>
}

export default function AdminLeadsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'view' | 'upload' | 'verify'>('view')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectCode, setRejectCode] = useState<string>('invalid_data')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Admin role check - prevent non-admins from accessing
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  // Fetch leads
  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          workspace:workspaces(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as Lead[]
    },
    enabled: authChecked && isAdmin,
  })

  // Fetch verification queue
  const { data: verificationQueue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['admin', 'verification-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          workspace:workspaces(name)
        `)
        .in('verification_status_admin', ['pending', 'flagged'])
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as Lead[]
    },
    enabled: authChecked && isAdmin,
  })

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  // Handle approve lead
  const handleApprove = async (leadId: string) => {
    setActionLoading(leadId)
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve lead')
      }

      await refetchQueue()
      await refetch()
      toast({ type: 'success', message: 'Lead approved successfully' })
    } catch (error: any) {
      toast({ type: 'error', message: error.message || 'Failed to approve lead' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle reject lead
  const handleReject = async (leadId: string) => {
    if (!rejectReason.trim()) {
      toast({ type: 'warning', message: 'Please provide a rejection reason' })
      return
    }

    setActionLoading(leadId)
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason,
          reasonCode: rejectCode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject lead')
      }

      setRejectDialogOpen(null)
      setRejectReason('')
      setRejectCode('invalid_data')
      await refetchQueue()
      await refetch()
      toast({ type: 'success', message: 'Lead rejected successfully' })
    } catch (error: any) {
      toast({ type: 'error', message: error.message || 'Failed to reject lead' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle CSV upload
  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('source', 'admin_upload')

    try {
      const response = await fetch('/api/admin/leads/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      setUploadResult(result)

      if (result.success) {
        refetch()
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        total: 0,
        successful: 0,
        failed: 0,
        errors: [error.message || 'Upload failed'],
        routing_summary: {},
      })
    }

    setUploading(false)
  }

  // Sample CSV template
  const downloadTemplate = () => {
    const template = `first_name,last_name,email,phone,address,city,state,zip,industry,intent_signal,data_source
John,Doe,john@example.com,555-123-4567,123 Main St,Austin,TX,78701,hvac,searching for ac repair,manual
Jane,Smith,jane@example.com,555-987-6543,456 Oak Ave,Dallas,TX,75201,roofing,looking for roof replacement,manual`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lead-upload-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-zinc-900">Lead Management</h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          Upload and manage leads across all business accounts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('view')}
            className={`${
              activeTab === 'view'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
            } whitespace-nowrap border-b-2 py-4 px-1 text-[13px] font-medium transition-colors`}
          >
            All Leads
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`${
              activeTab === 'verify'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
            } whitespace-nowrap border-b-2 py-4 px-1 text-[13px] font-medium transition-colors relative`}
          >
            Verification Queue
            {verificationQueue && verificationQueue.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                {verificationQueue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`${
              activeTab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
            } whitespace-nowrap border-b-2 py-4 px-1 text-[13px] font-medium transition-colors`}
          >
            Bulk Upload
          </button>
        </nav>
      </div>

      {/* View Leads Tab */}
      {activeTab === 'view' && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-zinc-900">Recent Leads</h2>
            <span className="text-[13px] text-zinc-500">{leads?.length || 0} leads</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Name</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Contact</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Industry</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Location</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Intent</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Score</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Assigned To</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads?.map((lead) => (
                    <tr key={lead.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-medium text-zinc-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-[12px] text-zinc-500">{lead.company_name}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[13px] text-zinc-900">{lead.email}</div>
                        <div className="text-[12px] text-zinc-500">{lead.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600">
                        {lead.company_industry}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600">
                        {lead.company_location?.city && `${lead.company_location.city}, `}
                        {lead.company_location?.state}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600 max-w-xs truncate">
                        {lead.intent_signal}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                          lead.lead_score >= 80
                            ? 'bg-blue-100 text-blue-700'
                            : lead.lead_score >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {lead.lead_score}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600">
                        {lead.workspace?.name || 'Unassigned'}
                      </td>
                      <td className="px-5 py-3 text-[12px] text-zinc-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Verification Queue Tab */}
      {activeTab === 'verify' && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-medium text-zinc-900">Leads Pending Verification</h2>
              <p className="text-[12px] text-zinc-500 mt-0.5">Review and approve or reject leads from partners</p>
            </div>
            <span className="text-[13px] text-zinc-500">{verificationQueue?.length || 0} leads</span>
          </div>

          {queueLoading ? (
            <div className="p-8 text-center text-zinc-500">Loading...</div>
          ) : verificationQueue && verificationQueue.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[14px] font-medium text-zinc-900">All caught up!</p>
              <p className="text-[13px] text-zinc-500 mt-1">No leads pending verification</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Name</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Contact</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Industry</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Location</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Score</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Status</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationQueue?.map((lead) => (
                    <tr key={lead.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-medium text-zinc-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-[12px] text-zinc-500">{lead.company_name}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[13px] text-zinc-900">{lead.email}</div>
                        <div className="text-[12px] text-zinc-500">{lead.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600">
                        {lead.company_industry}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600">
                        {lead.company_location?.city && `${lead.company_location.city}, `}
                        {lead.company_location?.state}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                          lead.lead_score >= 80
                            ? 'bg-blue-100 text-blue-700'
                            : lead.lead_score >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {lead.lead_score}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                          lead.verification_status_admin === 'flagged'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {lead.verification_status_admin === 'flagged' ? 'Flagged' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(lead.id)}
                            disabled={actionLoading === lead.id}
                            className="h-8 px-3 text-[12px] font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === lead.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectDialogOpen(lead.id)}
                            disabled={actionLoading === lead.id}
                            className="h-8 px-3 text-[12px] font-medium border border-red-300 text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-zinc-200">
              <h3 className="text-[15px] font-medium text-zinc-900">Reject Lead</h3>
              <p className="text-[13px] text-zinc-500 mt-1">Provide a reason for rejecting this lead</p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Reason Code
                </label>
                <select
                  value={rejectCode}
                  onChange={(e) => setRejectCode(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="invalid_data">Invalid Data</option>
                  <option value="duplicate">Duplicate Lead</option>
                  <option value="low_quality">Low Quality</option>
                  <option value="incorrect_format">Incorrect Format</option>
                  <option value="missing_information">Missing Information</option>
                  <option value="outside_coverage">Outside Coverage Area</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Detailed Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a detailed explanation for the partner..."
                  rows={4}
                  className="w-full px-3 py-2 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-[12px] text-zinc-500 mt-1">
                  This will be sent to the partner via email
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectDialogOpen(null)
                  setRejectReason('')
                  setRejectCode('invalid_data')
                }}
                disabled={actionLoading !== null}
                className="h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectDialogOpen)}
                disabled={!rejectReason.trim() || actionLoading !== null}
                className="h-9 px-4 text-[13px] font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === rejectDialogOpen ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload Instructions */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <h2 className="text-[15px] font-medium text-zinc-900 mb-4">
              Bulk Lead Upload
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-[13px] font-medium text-blue-900 mb-2">Required Columns</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] text-blue-700">
                <span>first_name</span>
                <span>last_name</span>
                <span>email</span>
                <span>phone</span>
                <span>city</span>
                <span>state (2-letter code)</span>
                <span>industry</span>
                <span>intent_signal</span>
              </div>
              <p className="mt-3 text-[12px] text-blue-600">
                Optional: address, zip, data_source, utm_source, utm_medium, utm_campaign
              </p>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={downloadTemplate}
                className="h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all"
              >
                Download Template
              </button>
            </div>

            {/* Upload Zone */}
            <div
              className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />

              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>

              {uploading ? (
                <p className="text-[13px] text-zinc-600">Uploading and processing...</p>
              ) : (
                <>
                  <p className="text-[13px] font-medium text-zinc-900">Click to upload CSV</p>
                  <p className="text-[12px] text-zinc-500 mt-1">or drag and drop</p>
                </>
              )}
            </div>
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <div className={`bg-white border rounded-lg p-6 ${
              uploadResult.success ? 'border-blue-200' : 'border-red-200'
            }`}>
              <h3 className={`text-[15px] font-medium mb-4 ${
                uploadResult.success ? 'text-blue-900' : 'text-red-900'
              }`}>
                Upload {uploadResult.success ? 'Complete' : 'Failed'}
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-zinc-50 rounded-lg p-3">
                  <div className="text-[12px] text-zinc-600">Total Rows</div>
                  <div className="text-lg font-medium text-zinc-900">{uploadResult.total}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-[12px] text-blue-600">Successful</div>
                  <div className="text-lg font-medium text-blue-700">{uploadResult.successful}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-[12px] text-red-600">Failed</div>
                  <div className="text-lg font-medium text-red-700">{uploadResult.failed}</div>
                </div>
              </div>

              {Object.keys(uploadResult.routing_summary || {}).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-[13px] font-medium text-zinc-900 mb-2">Routing Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(uploadResult.routing_summary).map(([workspace, count]) => (
                      <div key={workspace} className="bg-zinc-50 rounded-lg p-2">
                        <div className="text-[12px] text-zinc-600 truncate">{workspace}</div>
                        <div className="text-[13px] font-medium text-zinc-900">{count} leads</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResult.errors.length > 0 && (
                <div>
                  <h4 className="text-[13px] font-medium text-red-900 mb-2">Errors</h4>
                  <ul className="text-[12px] text-red-700 space-y-1">
                    {uploadResult.errors.slice(0, 10).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li>...and {uploadResult.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
