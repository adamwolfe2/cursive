'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition, Tab } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Lead, LeadStatus } from '@/types'
import { LeadStatusSelector } from './lead-status-selector'
import { LeadNotesPanel } from './lead-notes-panel'
import { LeadActivityTimeline } from './lead-activity-timeline'
import { formatDate, cn } from '@/lib/utils'

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

// Icon components for the detail panel
function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function CurrencyDollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function LightBulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

export function LeadDetailPanel({
  lead,
  onClose,
  onRefresh,
}: LeadDetailPanelProps) {
  const queryClient = useQueryClient()
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>((lead.status as LeadStatus) || 'new')

  // Get display values from lead data
  const personName = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
  const jobTitle = lead.contact_title || lead.job_title || ''
  const companyName = lead.company_name || ''
  const email = lead.email || ''
  const phone = lead.phone || lead.mobile_phone || lead.work_phone || ''
  const linkedinUrl = lead.linkedin_url || ''
  const location = [lead.city, lead.state_code || lead.state].filter(Boolean).join(', ') || 'N/A'
  const industry = lead.company_industry || 'N/A'
  const companySize = lead.company_size || 'N/A'
  const revenue = lead.company_revenue || 'N/A'
  const intentTopic = lead.intent_topic || 'N/A'
  const companyWebsite = lead.company_website || lead.company_domain ? `https://${lead.company_domain}` : ''

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

  // Generate initials for avatar
  const initials = personName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-2xl overflow-y-auto">
                    {/* Header with person name and close button */}
                    <div className="px-6 py-5 border-b border-zinc-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <Dialog.Title className="text-xl font-semibold text-zinc-900">
                            {personName}
                          </Dialog.Title>
                          {jobTitle && (
                            <p className="mt-1 text-sm text-zinc-500">
                              {jobTitle}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={onClose}
                          className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-500 hover:bg-zinc-100 transition-colors"
                        >
                          <span className="sr-only">Close</span>
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 px-6 py-5 space-y-6">
                      {/* CONTACT Section */}
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                          Contact
                        </h3>
                        <div className="space-y-3">
                          {email && (
                            <div className="flex items-center gap-3">
                              <EnvelopeIcon className="h-5 w-5 text-zinc-400" />
                              <a
                                href={`mailto:${email}`}
                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {email}
                              </a>
                            </div>
                          )}
                          {phone && (
                            <div className="flex items-center gap-3">
                              <PhoneIcon className="h-5 w-5 text-zinc-400" />
                              <a
                                href={`tel:${phone}`}
                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {phone}
                              </a>
                            </div>
                          )}
                          {linkedinUrl && (
                            <div className="flex items-center gap-3">
                              <LinkedInIcon className="h-5 w-5 text-blue-600" />
                              <a
                                href={linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                          {!email && !phone && !linkedinUrl && (
                            <p className="text-sm text-zinc-400 italic">No contact information available</p>
                          )}
                        </div>
                      </div>

                      {/* PROFESSIONAL DETAILS Section */}
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                          Professional Details
                        </h3>
                        <div className="space-y-4">
                          {companyName && (
                            <div className="flex items-start gap-3">
                              <BuildingIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-zinc-500">Company</p>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-zinc-900">{companyName}</p>
                                  {companyWebsite && (
                                    <a
                                      href={companyWebsite}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <ExternalLinkIcon className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          {jobTitle && (
                            <div className="flex items-start gap-3">
                              <BriefcaseIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-zinc-500">Title</p>
                                <p className="text-sm font-medium text-zinc-900">{jobTitle}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <MapPinIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-zinc-500">Location</p>
                              <p className="text-sm font-medium text-zinc-900">{location}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* COMPANY DETAILS Section */}
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                          Company Details
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <BuildingIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-zinc-500">Industry</p>
                              <p className="text-sm font-medium text-zinc-900">{industry}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <UsersIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-zinc-500">Company Size</p>
                              <p className="text-sm font-medium text-zinc-900">{companySize}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CurrencyDollarIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-zinc-500">Revenue</p>
                              <p className="text-sm font-medium text-zinc-900">{revenue}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <LightBulbIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-zinc-500">Intent Topic</p>
                              <p className="text-sm font-medium text-zinc-900">{intentTopic}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CalendarIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-zinc-500">Added</p>
                              <p className="text-sm font-medium text-zinc-900">
                                {formatDate(lead.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="border-t border-zinc-200 pt-5">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                          Lead Status
                        </label>
                        <LeadStatusSelector
                          currentStatus={currentStatus}
                          onStatusChange={handleStatusChange}
                        />
                      </div>

                      {/* Additional Tabs: Notes & Activity */}
                      <Tab.Group>
                        <Tab.List className="flex border-b border-zinc-200 -mx-6 px-6">
                          <Tab
                            className={({ selected }) =>
                              cn(
                                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
                                selected
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                              )
                            }
                          >
                            Notes
                          </Tab>
                          <Tab
                            className={({ selected }) =>
                              cn(
                                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
                                selected
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                              )
                            }
                          >
                            Activity
                          </Tab>
                        </Tab.List>

                        <Tab.Panels className="mt-4">
                          <Tab.Panel>
                            <LeadNotesPanel leadId={lead.id} />
                          </Tab.Panel>
                          <Tab.Panel>
                            <LeadActivityTimeline leadId={lead.id} />
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>
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
