'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition, Tab } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Lead, LeadStatus } from '@/types'
import { IntentBadge } from './intent-badge'
import { LeadStatusSelector } from './lead-status-selector'
import { LeadNotesPanel } from './lead-notes-panel'
import { LeadActivityTimeline } from './lead-activity-timeline'
import { formatDateTime, cn } from '@/lib/utils'

interface LeadDetailPanelProps {
  lead: Lead
  onClose: () => void
  onRefresh: () => void
}

async function updateLeadStatus(leadId: string, status: LeadStatus, note?: string) {
  const res = await fetch(`/api/leads/${leadId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}

export function LeadDetailPanel({
  lead,
  onClose,
  onRefresh,
}: LeadDetailPanelProps) {
  const queryClient = useQueryClient()
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>((lead as any).status || 'new')

  const companyData = (lead.company_data as any) || {}
  const contactData = (lead.contact_data as any) || {}
  const intentData = (lead.intent_data as any) || {}
  const query = (lead as any).queries || {}

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: LeadStatus; note?: string }) =>
      updateLeadStatus(lead.id, status, note),
    onSuccess: (_, variables) => {
      setCurrentStatus(variables.status)
      queryClient.invalidateQueries({ queryKey: ['lead-activities', lead.id] })
      onRefresh()
    },
  })

  const handleStatusChange = async (status: LeadStatus, note?: string) => {
    await statusMutation.mutateAsync({ status, note })
  }

  const getEnrichmentBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; ring: string }> = {
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20' },
      enriched: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20' },
    }
    return config[status] || config.pending
  }

  const tabs = [
    { name: 'Details', icon: 'info' },
    { name: 'Notes', icon: 'notes' },
    { name: 'Activity', icon: 'activity' },
  ]

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col bg-white shadow-2xl">
                    {/* Header */}
                    <div className="bg-zinc-50 px-6 py-6 border-b border-zinc-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <Dialog.Title className="text-xl font-semibold text-zinc-900">
                            {companyData.name || lead.company_name || 'Unknown Company'}
                          </Dialog.Title>
                          {(companyData.domain || lead.company_domain) && (
                            <p className="mt-1 text-[13px] text-zinc-500">
                              {companyData.domain || lead.company_domain}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-3 flex-wrap">
                            <IntentBadge
                              score={intentData.score || 'cold'}
                              size="md"
                            />
                            {lead.enrichment_status && (
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-medium ring-1 ring-inset',
                                  getEnrichmentBadge(lead.enrichment_status).bg,
                                  getEnrichmentBadge(lead.enrichment_status).text,
                                  getEnrichmentBadge(lead.enrichment_status).ring
                                )}
                              >
                                {lead.enrichment_status}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={onClose}
                          className="ml-3 rounded-md bg-white p-2 text-zinc-400 hover:text-zinc-500 hover:bg-zinc-100 transition-colors"
                        >
                          <span className="sr-only">Close</span>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Status Selector */}
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                          Lead Status
                        </label>
                        <div className="max-w-xs">
                          <LeadStatusSelector
                            currentStatus={currentStatus}
                            onStatusChange={handleStatusChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <Tab.Group>
                      <Tab.List className="flex border-b border-zinc-200 px-6">
                        {tabs.map((tab) => (
                          <Tab
                            key={tab.name}
                            className={({ selected }) =>
                              cn(
                                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
                                selected
                                  ? 'border-emerald-500 text-emerald-600'
                                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                              )
                            }
                          >
                            {tab.name}
                          </Tab>
                        ))}
                      </Tab.List>

                      <Tab.Panels className="flex-1 overflow-y-auto">
                        {/* Details Tab */}
                        <Tab.Panel className="px-6 py-6 space-y-6">
                          {/* Company Info */}
                          <div>
                            <h3 className="text-base font-semibold text-zinc-900 mb-4">
                              Company Information
                            </h3>
                            <dl className="grid grid-cols-2 gap-4">
                              <div>
                                <dt className="text-[13px] font-medium text-zinc-500">Industry</dt>
                                <dd className="mt-1 text-[13px] text-zinc-900">
                                  {companyData.industry || lead.company_industry || 'N/A'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[13px] font-medium text-zinc-500">Employees</dt>
                                <dd className="mt-1 text-[13px] text-zinc-900">
                                  {companyData.employee_count
                                    ? companyData.employee_count.toLocaleString()
                                    : 'N/A'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[13px] font-medium text-zinc-500">Revenue</dt>
                                <dd className="mt-1 text-[13px] text-zinc-900">
                                  {companyData.revenue
                                    ? `$${companyData.revenue.toLocaleString()}`
                                    : 'N/A'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[13px] font-medium text-zinc-500">Location</dt>
                                <dd className="mt-1 text-[13px] text-zinc-900">
                                  {[
                                    companyData.location?.city,
                                    companyData.location?.state,
                                    companyData.location?.country,
                                  ]
                                    .filter(Boolean)
                                    .join(', ') || 'N/A'}
                                </dd>
                              </div>
                            </dl>

                            {companyData.description && (
                              <div className="mt-4">
                                <dt className="text-[13px] font-medium text-zinc-500">Description</dt>
                                <dd className="mt-2 text-[13px] text-zinc-900 leading-relaxed">
                                  {companyData.description}
                                </dd>
                              </div>
                            )}

                            {companyData.website && (
                              <div className="mt-4">
                                <a
                                  href={companyData.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[13px] font-medium text-emerald-600 hover:text-emerald-700"
                                >
                                  Visit website
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Primary Contact */}
                          {(lead.email || lead.full_name) && (
                            <div>
                              <h3 className="text-base font-semibold text-zinc-900 mb-4">
                                Primary Contact
                              </h3>
                              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-zinc-900 text-[13px]">
                                      {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                                    </h4>
                                    <p className="mt-1 text-[13px] text-zinc-500">
                                      {lead.job_title || 'N/A'}
                                    </p>
                                    {lead.email && (
                                      <a
                                        href={`mailto:${lead.email}`}
                                        className="mt-2 inline-block text-[13px] text-emerald-600 hover:text-emerald-700"
                                      >
                                        {lead.email}
                                      </a>
                                    )}
                                    {lead.phone && (
                                      <p className="mt-1 text-[13px] text-zinc-600">
                                        {lead.phone}
                                      </p>
                                    )}
                                    {lead.linkedin_url && (
                                      <a
                                        href={lead.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 block text-[13px] text-emerald-600 hover:text-emerald-700"
                                      >
                                        LinkedIn →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Additional Contacts */}
                          {contactData.contacts && contactData.contacts.length > 0 && (
                            <div>
                              <h3 className="text-base font-semibold text-zinc-900 mb-4">
                                Additional Contacts ({contactData.contacts.length})
                              </h3>
                              <div className="space-y-3">
                                {contactData.contacts.slice(0, 5).map((contact: any, idx: number) => (
                                  <div key={idx} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-zinc-900 text-[13px]">
                                          {contact.full_name}
                                        </h4>
                                        <p className="mt-1 text-[13px] text-zinc-500">
                                          {contact.title || 'N/A'}
                                        </p>
                                        {contact.email && (
                                          <a
                                            href={`mailto:${contact.email}`}
                                            className="mt-2 inline-block text-[13px] text-emerald-600 hover:text-emerald-700"
                                          >
                                            {contact.email}
                                          </a>
                                        )}
                                      </div>
                                      {contact.verified_email && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                          Verified
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Intent Signals */}
                          {intentData.signals && intentData.signals.length > 0 && (
                            <div>
                              <h3 className="text-base font-semibold text-zinc-900 mb-4">
                                Intent Signals ({intentData.signals.length})
                              </h3>
                              <div className="space-y-2">
                                {intentData.signals.map((signal: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3"
                                  >
                                    <div className="flex-1">
                                      <p className="text-[13px] font-medium text-zinc-900">
                                        {signal.signal_type}
                                      </p>
                                      <p className="text-xs text-zinc-500">
                                        {new Date(signal.detected_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <span
                                      className={cn(
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                                        signal.signal_strength === 'high'
                                          ? 'bg-red-50 text-red-700 ring-red-600/20'
                                          : signal.signal_strength === 'medium'
                                            ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                                            : 'bg-zinc-50 text-zinc-700 ring-zinc-600/20'
                                      )}
                                    >
                                      {signal.signal_strength}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div>
                            <h3 className="text-base font-semibold text-zinc-900 mb-4">Metadata</h3>
                            <dl className="grid grid-cols-2 gap-4">
                              <div>
                                <dt className="text-[13px] font-medium text-zinc-500">Source</dt>
                                <dd className="mt-1 text-[13px] text-zinc-900">
                                  {lead.source || 'N/A'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[13px] font-medium text-zinc-500">Delivery Status</dt>
                                <dd className="mt-1 text-[13px] text-zinc-900">
                                  {lead.delivery_status}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[13px] font-medium text-zinc-500">Created</dt>
                                <dd className="mt-1 text-[13px] text-zinc-900">
                                  {formatDateTime(lead.created_at)}
                                </dd>
                              </div>
                              {(lead as any).enriched_at && (
                                <div>
                                  <dt className="text-[13px] font-medium text-zinc-500">Enriched</dt>
                                  <dd className="mt-1 text-[13px] text-zinc-900">
                                    {formatDateTime((lead as any).enriched_at)}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </Tab.Panel>

                        {/* Notes Tab */}
                        <Tab.Panel className="px-6 py-6">
                          <LeadNotesPanel leadId={lead.id} />
                        </Tab.Panel>

                        {/* Activity Tab */}
                        <Tab.Panel className="px-6 py-6">
                          <LeadActivityTimeline leadId={lead.id} />
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>

                    {/* Footer */}
                    <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
                      <button
                        onClick={onClose}
                        className="w-full rounded-md bg-white px-4 py-2 text-[13px] font-medium text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
