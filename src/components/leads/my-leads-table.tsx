'use client'

/**
 * My Leads Table Component
 *
 * Displays the user's assigned leads with status management.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/design-system'
import type { Database } from '@/types/database.types'

type UserLeadAssignmentUpdate = Database['public']['Tables']['user_lead_assignments']['Update']

interface MyLeadsTableProps {
  userId: string
  workspaceId: string
}

interface LeadAssignment {
  id: string
  lead_id: string
  status: string
  matched_industry: string | null
  matched_sic_code: string | null
  matched_geo: string | null
  assigned_at: string
  viewed_at: string | null
  leads: {
    id: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
    email: string | null
    phone: string | null
    company_name: string | null
    job_title: string | null
    city: string | null
    state: string | null
    state_code: string | null
    company_industry: string | null
    created_at: string
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700' },
  viewed: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
  contacted: { bg: 'bg-amber-50', text: 'text-amber-700' },
  converted: { bg: 'bg-green-50', text: 'text-green-700' },
  archived: { bg: 'bg-zinc-100', text: 'text-zinc-500' },
}

export function MyLeadsTable({ userId, workspaceId }: MyLeadsTableProps) {
  const [assignments, setAssignments] = useState<LeadAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<LeadAssignment | null>(null)

  useEffect(() => {
    fetchAssignments()
  }, [userId, workspaceId, filter])

  async function fetchAssignments() {
    const supabase = createClient()

    let query = supabase
      .from('user_lead_assignments')
      .select(
        `
        id,
        lead_id,
        status,
        matched_industry,
        matched_sic_code,
        matched_geo,
        assigned_at,
        viewed_at,
        leads (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          company_name,
          job_title,
          city,
          state,
          state_code,
          company_industry,
          created_at
        )
      `
      )
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('assigned_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Failed to fetch assignments:', error)
    } else {
      setAssignments((data as unknown as LeadAssignment[]) || [])
    }

    setLoading(false)
  }

  async function updateStatus(assignmentId: string, newStatus: string) {
    const supabase = createClient()

    const update: UserLeadAssignmentUpdate = {
      status: newStatus,
    }

    if (newStatus === 'viewed') {
      update.viewed_at = new Date().toISOString()
    } else if (newStatus === 'contacted') {
      update.contacted_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('user_lead_assignments')
      .update(update as never)
      .eq('id', assignmentId)

    if (!error) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, status: newStatus } : a))
      )
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getLeadName(lead: LeadAssignment['leads']) {
    return (
      lead.full_name ||
      [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
      'Unknown'
    )
  }

  function getLocation(lead: LeadAssignment['leads']) {
    return [lead.city, lead.state_code || lead.state].filter(Boolean).join(', ')
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-12">
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      {/* Filter tabs */}
      <div className="border-b border-zinc-200 px-4 py-3">
        <div className="flex gap-2">
          {['all', 'new', 'viewed', 'contacted', 'converted'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === status
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-zinc-600 hover:bg-zinc-100'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {assignments.length === 0 ? (
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-zinc-900">No leads found</p>
          <p className="mt-1 text-sm text-zinc-500">
            {filter === 'all'
              ? 'Leads will appear here when they match your targeting preferences.'
              : `No ${filter} leads at the moment.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-sm font-medium text-zinc-500">
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Matched On</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {assignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="hover:bg-zinc-50 cursor-pointer"
                  onClick={() => setSelectedLead(assignment)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-zinc-900">
                        {getLeadName(assignment.leads)}
                      </p>
                      {assignment.leads.email && (
                        <p className="text-sm text-zinc-500">
                          {assignment.leads.email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-zinc-900">
                        {assignment.leads.company_name || '-'}
                      </p>
                      {assignment.leads.job_title && (
                        <p className="text-sm text-zinc-500">
                          {assignment.leads.job_title}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {getLocation(assignment.leads) || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {assignment.matched_industry && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 mr-1">
                          {assignment.matched_industry}
                        </span>
                      )}
                      {assignment.matched_geo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {assignment.matched_geo}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        STATUS_COLORS[assignment.status]?.bg || 'bg-zinc-100',
                        STATUS_COLORS[assignment.status]?.text || 'text-zinc-700'
                      )}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {formatDate(assignment.assigned_at)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={assignment.status}
                      onChange={(e) => {
                        e.stopPropagation()
                        updateStatus(assignment.id, e.target.value)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm border border-zinc-200 rounded-md px-2 py-1 bg-white"
                    >
                      <option value="new">New</option>
                      <option value="viewed">Viewed</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead detail modal */}
      {selectedLead && (
        <LeadDetailModal
          assignment={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={(status) => {
            updateStatus(selectedLead.id, status)
            setSelectedLead({ ...selectedLead, status })
          }}
        />
      )}
    </div>
  )
}

function LeadDetailModal({
  assignment,
  onClose,
  onStatusChange,
}: {
  assignment: LeadAssignment
  onClose: () => void
  onStatusChange: (status: string) => void
}) {
  const lead = assignment.leads

  function getLeadName() {
    return (
      lead.full_name ||
      [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
      'Unknown'
    )
  }

  function getLocation() {
    return [lead.city, lead.state_code || lead.state].filter(Boolean).join(', ')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Lead Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-100"
          >
            <svg
              className="h-5 w-5 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact info */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Contact</h3>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-zinc-900">{getLeadName()}</p>
              {lead.job_title && (
                <p className="text-zinc-600">{lead.job_title}</p>
              )}
              {lead.email && (
                <p className="text-zinc-600">
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-violet-600 hover:underline"
                  >
                    {lead.email}
                  </a>
                </p>
              )}
              {lead.phone && (
                <p className="text-zinc-600">
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-violet-600 hover:underline"
                  >
                    {lead.phone}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Company info */}
          {lead.company_name && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-3">Company</h3>
              <div className="space-y-2">
                <p className="font-medium text-zinc-900">{lead.company_name}</p>
                {lead.company_industry && (
                  <p className="text-sm text-zinc-600">
                    Industry: {lead.company_industry}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {getLocation() && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-3">Location</h3>
              <p className="text-zinc-900">{getLocation()}</p>
            </div>
          )}

          {/* Match info */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Match Info</h3>
            <div className="flex flex-wrap gap-2">
              {assignment.matched_industry && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-sm">
                  Industry: {assignment.matched_industry}
                </span>
              )}
              {assignment.matched_sic_code && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm">
                  SIC: {assignment.matched_sic_code}
                </span>
              )}
              {assignment.matched_geo && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
                  Location: {assignment.matched_geo}
                </span>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Status</h3>
            <select
              value={assignment.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2"
            >
              <option value="new">New</option>
              <option value="viewed">Viewed</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
          >
            Close
          </button>
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
            >
              Send Email
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
