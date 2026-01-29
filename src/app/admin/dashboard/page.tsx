'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavBar } from '@/components/nav-bar'
import { useToast } from '@/lib/hooks/use-toast'

interface RoutingRule {
  id: string
  rule_name: string
  priority: number
  conditions: {
    industries: string[]
    us_states: string[]
  }
  destination_workspace_id: string
  is_active: boolean
}

interface Lead {
  id: string
  company_name: string
  company_industry: string
  company_location: { state: string; country: string }
  workspace_id: string
  created_at: string
}

interface BulkUploadJob {
  id: string
  status: string
  total_records: number
  successful_records: number
  failed_records: number
  routing_summary: any
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsStats, setLeadsStats] = useState<Record<string, number>>({})
  const [uploadJob, setUploadJob] = useState<BulkUploadJob | null>(null)
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)
  const [webhookResponse, setWebhookResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const fetchRules = async () => {
    const { data } = await supabase
      .from('lead_routing_rules')
      .select('*')
      .order('priority', { ascending: false })
    if (data) setRules(data)
  }

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setLeads(data)

    const stats: Record<string, number> = {}
    data?.forEach((lead) => {
      stats[lead.workspace_id] = (stats[lead.workspace_id] || 0) + 1
    })
    setLeadsStats(stats)
  }

  useEffect(() => {
    fetchRules()
    fetchLeads()
    const interval = setInterval(fetchLeads, 5000)
    return () => clearInterval(interval)
  }, [])

  const deleteRule = async (id: string) => {
    await supabase.from('lead_routing_rules').delete().eq('id', id)
    fetchRules()
  }

  const testWebhook = async (type: 'datashopper' | 'clay' | 'audience-labs') => {
    setLoading(true)
    setWebhookResponse('Sending...')

    const payloads = {
      datashopper: {
        event_type: 'leads.single',
        workspace_id: Object.keys(leadsStats)[0],
        lead: {
          email: 'test@datashopper.com',
          first_name: 'Test',
          last_name: 'DataShopper',
          company_name: 'DataShopper Test Co',
          company_industry: 'Healthcare',
          company_location: { state: 'CA', country: 'US' },
          job_title: 'CEO',
          datashopper_id: 'ds_' + Date.now()
        }
      },
      clay: {
        event_type: 'enrichment.completed',
        clay_record_id: 'clay_' + Date.now(),
        person: {
          full_name: 'Test Clay User',
          email: 'test@clay.com',
          phone: '+1-555-0123',
          linkedin_url: 'https://linkedin.com/in/test'
        },
        company: {
          name: 'Clay Test Company',
          domain: 'claytest.com',
          industry: 'Healthcare'
        },
        enrichment_status: 'completed'
      },
      'audience-labs': {
        event_type: 'import.batch',
        import_job_id: 'import_' + Date.now(),
        workspace_id: Object.keys(leadsStats)[0],
        leads: [
          {
            id: 'al_' + Date.now(),
            first_name: 'Test',
            last_name: 'AudienceLabs',
            email: 'test@audiencelabs.com',
            company_name: 'AudienceLabs Test',
            company_industry: 'HVAC',
            location: { state: 'TX', country: 'US' },
            job_title: 'Manager'
          }
        ],
        timestamp: new Date().toISOString()
      }
    }

    try {
      const response = await fetch(`/api/webhooks/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads[type])
      })
      const data = await response.json()
      setWebhookResponse(JSON.stringify(data, null, 2))
      fetchLeads()
    } catch (error: any) {
      setWebhookResponse(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const uploadCSV = async (file: File) => {
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('source', 'csv')

    try {
      const response = await fetch('/api/leads/bulk-upload', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setUploadJob(data)
      fetchLeads()
      toast({
        title: 'Upload successful',
        message: 'CSV file uploaded and processed successfully',
        type: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        message: error.message || 'Failed to upload CSV file. Please try again.',
        type: 'error',
      })
    }
    setLoading(false)
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-xl font-medium text-zinc-900">Admin Dashboard</h1>
            <p className="text-[13px] text-zinc-500 mt-1">
              Manage routing rules, monitor leads, and test integrations
            </p>
          </div>

          {/* Routing Rules Section */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm mb-6">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-[15px] font-medium text-zinc-900">Routing Rules</h2>
              <button
                onClick={() => setShowAddRuleModal(true)}
                className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150"
              >
                + Add Rule
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Rule Name</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Priority</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Industries</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">States</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Status</th>
                    <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3 text-[13px] text-zinc-900">{rule.rule_name}</td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600">{rule.priority}</td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600">
                        {rule.conditions.industries.join(', ') || 'All'}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-zinc-600">
                        {rule.conditions.us_states.join(', ') || 'All'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                            rule.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="text-[13px] text-red-600 hover:text-red-700 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leads Overview */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm mb-6">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-[15px] font-medium text-zinc-900">Leads Overview</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                  <div className="text-[13px] text-zinc-600 mb-1">Total Leads</div>
                  <div className="text-2xl font-medium text-zinc-900 tracking-tight">{leads.length}</div>
                </div>
                {Object.entries(leadsStats).slice(0, 3).map(([workspace, count]) => (
                  <div key={workspace} className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                    <div className="text-[13px] text-zinc-600 mb-1">Workspace</div>
                    <div className="text-2xl font-medium text-zinc-900 tracking-tight">{count}</div>
                    <div className="text-[12px] text-zinc-500 mt-1">{workspace.slice(0, 8)}</div>
                  </div>
                ))}
              </div>

              <h3 className="text-[15px] font-medium text-zinc-900 mb-3">Recent 20 Leads</h3>
              <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Company</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Industry</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">State</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Workspace</th>
                      <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 text-[13px] text-zinc-900">{lead.company_name}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-600">{lead.company_industry || 'N/A'}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-600">{lead.company_location?.state || 'N/A'}</td>
                        <td className="px-4 py-3 text-[12px] text-zinc-500">{lead.workspace_id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-[12px] text-zinc-500">
                          {new Date(lead.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bulk Upload Testing */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm mb-6">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-[15px] font-medium text-zinc-900">Bulk Upload Testing</h2>
            </div>
            <div className="p-5">
              <div className="border-2 border-dashed border-zinc-200 rounded-lg p-8 text-center bg-zinc-50/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && uploadCSV(e.target.files[0])}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer h-9 px-6 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 inline-block leading-9"
                >
                  Upload CSV
                </label>
                <p className="mt-3 text-[13px] text-zinc-500">
                  <a href="/sample-leads.csv" className="text-zinc-900 hover:underline font-medium">
                    Download sample CSV template
                  </a>
                </p>
              </div>
              {uploadJob && (
                <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <h3 className="text-[14px] font-medium text-zinc-900 mb-2">Upload Results</h3>
                  <div className="space-y-1 text-[13px]">
                    <p className="text-zinc-600">Status: <span className="text-zinc-900 font-medium">{uploadJob.status}</span></p>
                    <p className="text-zinc-600">Total: <span className="text-zinc-900 font-medium">{uploadJob.total_records}</span></p>
                    <p className="text-zinc-600">Successful: <span className="text-emerald-600 font-medium">{uploadJob.successful_records}</span></p>
                    <p className="text-zinc-600">Failed: <span className="text-red-600 font-medium">{uploadJob.failed_records}</span></p>
                  </div>
                  {uploadJob.routing_summary && (
                    <pre className="mt-3 text-[12px] text-zinc-600 overflow-auto">
                      {JSON.stringify(uploadJob.routing_summary, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Webhook Testing Panel */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-[15px] font-medium text-zinc-900">Webhook Testing</h2>
            </div>
            <div className="p-5">
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => testWebhook('datashopper')}
                  disabled={loading}
                  className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  Simulate DataShopper
                </button>
                <button
                  onClick={() => testWebhook('clay')}
                  disabled={loading}
                  className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  Simulate Clay Enrichment
                </button>
                <button
                  onClick={() => testWebhook('audience-labs')}
                  disabled={loading}
                  className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  Simulate Audience Labs
                </button>
              </div>
              {webhookResponse && (
                <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-[12px] overflow-auto max-h-96">
                  <pre>{webhookResponse}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-[15px] font-medium text-zinc-900 mb-2">Add Routing Rule</h3>
            <p className="text-[13px] text-zinc-600 mb-6">
              Use Supabase SQL Editor to add rules for now
            </p>
            <button
              onClick={() => setShowAddRuleModal(false)}
              className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
