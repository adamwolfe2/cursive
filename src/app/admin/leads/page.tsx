'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

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
  const [activeTab, setActiveTab] = useState<'view' | 'upload'>('view')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

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
  })

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
                            ? 'bg-emerald-100 text-emerald-700'
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
              uploadResult.success ? 'border-emerald-200' : 'border-red-200'
            }`}>
              <h3 className={`text-[15px] font-medium mb-4 ${
                uploadResult.success ? 'text-emerald-900' : 'text-red-900'
              }`}>
                Upload {uploadResult.success ? 'Complete' : 'Failed'}
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-zinc-50 rounded-lg p-3">
                  <div className="text-[12px] text-zinc-600">Total Rows</div>
                  <div className="text-lg font-medium text-zinc-900">{uploadResult.total}</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="text-[12px] text-emerald-600">Successful</div>
                  <div className="text-lg font-medium text-emerald-700">{uploadResult.successful}</div>
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
