'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import type { Lead } from '@/types'
import { IntentBadge } from './intent-badge'
import { formatDateTime, cn } from '@/lib/utils'

interface LeadDetailPanelProps {
  lead: Lead
  onClose: () => void
  onRefresh: () => void
}

export function LeadDetailPanel({
  lead,
  onClose,
  onRefresh,
}: LeadDetailPanelProps) {
  const companyData = (lead.company_data as any) || {}
  const contactData = (lead.contact_data as any) || {}
  const intentData = (lead.intent_data as any) || {}
  const query = (lead as any).queries || {}

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; ring: string }> = {
      completed: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        ring: 'ring-emerald-600/20',
      },
      pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        ring: 'ring-amber-600/20',
      },
      failed: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        ring: 'ring-red-600/20',
      },
    }
    return config[status] || config.pending
  }

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
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl">
                    {/* Header */}
                    <div className="bg-zinc-50 px-6 py-6 border-b border-zinc-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <Dialog.Title className="text-xl font-semibold text-zinc-900">
                            {companyData.name || 'Unknown Company'}
                          </Dialog.Title>
                          {companyData.domain && (
                            <p className="mt-1 text-[13px] text-zinc-500">
                              {companyData.domain}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <IntentBadge
                              score={intentData.score || 'cold'}
                              size="md"
                            />
                            {lead.enrichment_status && (
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-medium ring-1 ring-inset',
                                  getStatusBadge(lead.enrichment_status).bg,
                                  getStatusBadge(lead.enrichment_status).text,
                                  getStatusBadge(lead.enrichment_status).ring
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
                          <svg
                            className="h-5 w-5"
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
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-6 py-6 space-y-6">
                      {/* Company Info */}
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 mb-4">
                          Company Information
                        </h3>
                        <dl className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Industry
                            </dt>
                            <dd className="mt-1 text-[13px] text-zinc-900">
                              {companyData.industry || 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Employees
                            </dt>
                            <dd className="mt-1 text-[13px] text-zinc-900">
                              {companyData.employee_count
                                ? companyData.employee_count.toLocaleString()
                                : 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Revenue
                            </dt>
                            <dd className="mt-1 text-[13px] text-zinc-900">
                              {companyData.revenue
                                ? `$${companyData.revenue.toLocaleString()}`
                                : 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Location
                            </dt>
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
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Description
                            </dt>
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
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Contacts */}
                      {contactData.contacts && contactData.contacts.length > 0 && (
                        <div>
                          <h3 className="text-base font-semibold text-zinc-900 mb-4">
                            Contacts ({contactData.contacts.length})
                          </h3>
                          <div className="space-y-3">
                            {contactData.contacts
                              .slice(0, 5)
                              .map((contact: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                                >
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
                                      {contact.linkedin_url && (
                                        <a
                                          href={contact.linkedin_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-1 block text-[13px] text-emerald-600 hover:text-emerald-700"
                                        >
                                          LinkedIn →
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

                      {/* Query Info */}
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 mb-4">
                          Query Details
                        </h3>
                        <dl className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Topic
                            </dt>
                            <dd className="mt-1 text-[13px] text-zinc-900">
                              {query.global_topics?.topic || query.name || 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Category
                            </dt>
                            <dd className="mt-1 text-[13px] text-zinc-900">
                              {query.global_topics?.category || 'N/A'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Metadata */}
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 mb-4">
                          Metadata
                        </h3>
                        <dl className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Enrichment Status
                            </dt>
                            <dd className="mt-1 text-[13px] text-zinc-900">
                              {lead.enrichment_status}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Delivery Status
                            </dt>
                            <dd className="mt-1 text-[13px] text-zinc-900">
                              {lead.delivery_status}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[13px] font-medium text-zinc-500">
                              Created
                            </dt>
                            <dd className="mt-1 text-[13px] text-zinc-900">
                              {formatDateTime(lead.created_at)}
                            </dd>
                          </div>
                          {lead.enriched_at && (
                            <div>
                              <dt className="text-[13px] font-medium text-zinc-500">
                                Enriched
                              </dt>
                              <dd className="mt-1 text-[13px] text-zinc-900">
                                {formatDateTime(lead.enriched_at)}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>

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
