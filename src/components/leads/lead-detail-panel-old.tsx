'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import type { Lead } from '@/types'

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

  const getIntentBadge = (score: string) => {
    const badges: Record<string, { bg: string; text: string; emoji: string }> = {
      hot: { bg: 'bg-red-100', text: 'text-red-800', emoji: '🔥' },
      warm: { bg: 'bg-orange-100', text: 'text-orange-800', emoji: '⚡' },
      cold: { bg: 'bg-blue-100', text: 'text-blue-800', emoji: '❄️' },
    }
    return badges[score] || badges.cold
  }

  const badge = getIntentBadge(intentData.score || 'cold')

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-gray-50 px-6 py-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <Dialog.Title className="text-xl font-semibold text-gray-900">
                            {companyData.name || 'Unknown Company'}
                          </Dialog.Title>
                          {companyData.domain && (
                            <p className="mt-1 text-sm text-gray-500">
                              {companyData.domain}
                            </p>
                          )}
                          <div className="mt-3">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}
                            >
                              {badge.emoji} {intentData.score?.toUpperCase() || 'COLD'} INTENT
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={onClose}
                          className="ml-3 rounded-md bg-white text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Close</span>
                          <svg
                            className="h-6 w-6"
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Company Information
                        </h3>
                        <dl className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Industry
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {companyData.industry || 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Employees
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {companyData.employee_count
                                ? companyData.employee_count.toLocaleString()
                                : 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Revenue
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {companyData.revenue
                                ? `$${companyData.revenue.toLocaleString()}`
                                : 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Location
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
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
                            <dt className="text-sm font-medium text-gray-500">
                              Description
                            </dt>
                            <dd className="mt-2 text-sm text-gray-900">
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
                              className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                              Visit website →
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Contacts */}
                      {contactData.contacts && contactData.contacts.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Contacts ({contactData.contacts.length})
                          </h3>
                          <div className="space-y-4">
                            {contactData.contacts.slice(0, 5).map((contact: any, idx: number) => (
                              <div
                                key={idx}
                                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {contact.full_name}
                                    </h4>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {contact.title || 'N/A'}
                                    </p>
                                    {contact.email && (
                                      <a
                                        href={`mailto:${contact.email}`}
                                        className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
                                      >
                                        {contact.email}
                                      </a>
                                    )}
                                    {contact.linkedin_url && (
                                      <a
                                        href={contact.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 block text-sm text-blue-600 hover:text-blue-500"
                                      >
                                        LinkedIn →
                                      </a>
                                    )}
                                  </div>
                                  {contact.verified_email && (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Intent Signals ({intentData.signals.length})
                          </h3>
                          <div className="space-y-2">
                            {intentData.signals.map((signal: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {signal.signal_type}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(signal.detected_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    signal.signal_strength === 'high'
                                      ? 'bg-red-100 text-red-800'
                                      : signal.signal_strength === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Query Details
                        </h3>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Topic
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {query.global_topics?.topic || query.name || 'N/A'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Category
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {query.global_topics?.category || 'N/A'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Metadata */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Metadata
                        </h3>
                        <dl className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Enrichment Status
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {lead.enrichment_status}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Delivery Status
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {lead.delivery_status}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Created
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(lead.created_at).toLocaleString()}
                            </dd>
                          </div>
                          {lead.enriched_at && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Enriched
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {new Date(lead.enriched_at).toLocaleString()}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
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
