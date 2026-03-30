'use client'

import { useState } from 'react'
import type { PackageSlug } from '@/types/onboarding'
import { PACKAGES } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PortalClient {
  // Identity
  company_name: string
  primary_contact_name?: string | null

  // Status
  status?: string | null

  // Packages & pricing
  packages_selected?: PackageSlug[] | null
  setup_fee?: number | null
  recurring_fee?: number | null

  // Contract
  rabbitsign_status?: string | null
  rabbitsign_folder_id?: string | null

  // Invoice
  stripe_invoice_status?: string | null
  stripe_invoice_url?: string | null

  // Domain / sender setup — stored as JSON array or newline-separated string
  domain_variations?: string | string[] | null
  sender_names?: string | string[] | null

  // Copy
  copy_generation_status?: string | null
  draft_sequences?: DraftSequenceData | null

  // Timeline & stats
  start_timeline?: string | null
  campaign_stats?: Record<string, unknown> | null
}

interface DraftSequenceData {
  sequences: Array<{
    sequence_name: string
    strategy: string
    emails: Array<{
      step: number
      subject_line: string
      body: string
      purpose: string
    }>
  }>
}

export interface PortalApprovals {
  domains?: 'pending' | 'approved' | 'changes_requested' | null
  copy?: 'pending' | 'approved' | 'changes_requested' | null
}

interface ClientPortalProps {
  client: PortalClient
  approvals: PortalApprovals
  tokenId: string
  token: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getFirstName(fullName: string | null | undefined, fallback: string): string {
  if (!fullName) return fallback
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

function parseStringArray(raw: string | string[] | null | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as string[]
  } catch {
    // not JSON — treat as newline/comma separated
  }
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Step state icons
// ---------------------------------------------------------------------------

function StepIcon({ state }: { state: 'complete' | 'active' | 'pending' | 'locked' }) {
  if (state === 'complete') {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    )
  }

  if (state === 'active') {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-50">
        <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
      </div>
    )
  }

  if (state === 'locked') {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50">
        <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
    )
  }

  // pending
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
      <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Generic step shell
// ---------------------------------------------------------------------------

function StepShell({
  number,
  title,
  state,
  locked,
  children,
}: {
  number: number
  title: string
  state: 'complete' | 'active' | 'pending' | 'locked'
  locked: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex gap-4 ${locked ? 'opacity-60' : ''}`}>
      <StepIcon state={state} />
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Step {number}
          </span>
          {state === 'complete' && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Complete
            </span>
          )}
          {state === 'active' && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Action needed
            </span>
          )}
        </div>
        <h3 className={`text-base font-semibold mb-3 ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Sign Contract
// ---------------------------------------------------------------------------

function ContractStep({ client }: { client: PortalClient }) {
  const status = client.rabbitsign_status
  const isDone = status === 'signed' || status === 'completed'
  const isSent = status === 'sent'

  const stepState: 'complete' | 'active' | 'pending' = isDone
    ? 'complete'
    : isSent
      ? 'active'
      : 'pending'

  return (
    <StepShell number={1} title="Sign Your Contract" state={stepState} locked={false}>
      {isDone ? (
        <p className="text-sm font-medium text-emerald-700">Contract signed — you&apos;re all set.</p>
      ) : client.rabbitsign_folder_id ? (
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <p className="text-sm text-gray-500 flex-1">
            Your contract is ready to sign. Click to review and sign electronically — takes under 2 minutes.
          </p>
          <a
            href="https://app.rabbitsign.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Sign Contract
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Your contract is being prepared — we&apos;ll email you when it&apos;s ready to sign.
        </p>
      )}
    </StepShell>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Pay Invoice
// ---------------------------------------------------------------------------

function InvoiceStep({ client }: { client: PortalClient }) {
  const status = client.stripe_invoice_status
  const isPaid = status === 'paid'
  const isOpen = status === 'open'

  const stepState: 'complete' | 'active' | 'pending' = isPaid
    ? 'complete'
    : isOpen
      ? 'active'
      : 'pending'

  return (
    <StepShell number={2} title="Pay Your Setup Invoice" state={stepState} locked={false}>
      {isPaid ? (
        <p className="text-sm font-medium text-emerald-700">Invoice paid — thank you!</p>
      ) : isOpen && client.stripe_invoice_url ? (
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <p className="text-sm text-gray-500 flex-1">
            Your invoice is ready. Pay securely via Stripe to unlock the next steps.
          </p>
          <a
            href={client.stripe_invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            {client.setup_fee != null
              ? `Pay Invoice (${formatCurrency(client.setup_fee)})`
              : 'Pay Invoice'}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Your invoice is being prepared — we&apos;ll send it to you shortly.
        </p>
      )}
    </StepShell>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Approve Domains & Senders
// ---------------------------------------------------------------------------

function DomainsStep({
  client,
  approvalStatus,
  token,
  onApprovalUpdate,
  locked,
}: {
  client: PortalClient
  approvalStatus: 'pending' | 'approved' | 'changes_requested' | null | undefined
  token: string
  onApprovalUpdate: (step: 'domains' | 'copy', status: 'approved' | 'changes_requested') => void
  locked: boolean
}) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isApproved = approvalStatus === 'approved'
  const isChangesRequested = approvalStatus === 'changes_requested'

  const stepState: 'complete' | 'active' | 'pending' | 'locked' = locked
    ? 'locked'
    : isApproved
      ? 'complete'
      : isChangesRequested
        ? 'pending'
        : 'active'

  const domains = parseStringArray(client.domain_variations)
  const senders = parseStringArray(client.sender_names)

  async function handleApprove() {
    setSubmitting(true)
    try {
      await fetch(`/api/portal/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepType: 'domains', status: 'approved' }),
      })
      onApprovalUpdate('domains', 'approved')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequestChanges() {
    if (!showNotes) {
      setShowNotes(true)
      return
    }
    setSubmitting(true)
    try {
      await fetch(`/api/portal/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepType: 'domains', status: 'changes_requested', notes }),
      })
      onApprovalUpdate('domains', 'changes_requested')
      setShowNotes(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StepShell number={3} title="Approve Domains & Sender Names" state={stepState} locked={locked}>
      {locked ? (
        <p className="text-sm text-gray-400">Complete Step 2 (pay invoice) to unlock this step.</p>
      ) : isApproved ? (
        <p className="text-sm font-medium text-emerald-700">Domains and sender names approved.</p>
      ) : isChangesRequested ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            Changes requested — our team will update the setup and resubmit for your review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            These are the domains and sender identities we&apos;ll use for your campaign. Approve
            them or request changes.
          </p>

          {domains.length > 0 ? (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Sending Inbox
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                      Sender Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {domains.map((domain, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-mono text-sm text-gray-800">
                        inbox@{domain}
                        {senders[i] && (
                          <span className="sm:hidden ml-2 text-gray-400 font-sans text-xs">
                            · {senders[i]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                        {senders[i] ?? senders[0] ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Domain and sender details are being finalized.</p>
          )}

          {showNotes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What would you like changed?
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Please use first name only, or change domain to example.io..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Approve All
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {showNotes ? 'Submit Changes' : 'Request Changes'}
            </button>
            {showNotes && (
              <button
                type="button"
                onClick={() => setShowNotes(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors self-center"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </StepShell>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Review & Approve Email Copy
// ---------------------------------------------------------------------------

function CopyStep({
  client,
  approvalStatus,
  token,
  onApprovalUpdate,
}: {
  client: PortalClient
  approvalStatus: 'pending' | 'approved' | 'changes_requested' | null | undefined
  token: string
  onApprovalUpdate: (step: 'domains' | 'copy', status: 'approved' | 'changes_requested') => void
}) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedSeqs, setExpandedSeqs] = useState<Set<number>>(new Set([0]))

  const isApproved = approvalStatus === 'approved'
  const isChangesRequested = approvalStatus === 'changes_requested'
  const copyStatus = client.copy_generation_status
  const isGenerating =
    !copyStatus || copyStatus === 'pending' || copyStatus === 'processing'
  const hasCopy =
    client.draft_sequences?.sequences && client.draft_sequences.sequences.length > 0

  const stepState: 'complete' | 'active' | 'pending' = isApproved
    ? 'complete'
    : isChangesRequested
      ? 'pending'
      : hasCopy
        ? 'active'
        : 'pending'

  function toggleSeq(i: number) {
    setExpandedSeqs((prev) => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
      }
      return next
    })
  }

  async function handleApprove() {
    setSubmitting(true)
    try {
      await fetch(`/api/portal/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepType: 'copy', status: 'approved' }),
      })
      onApprovalUpdate('copy', 'approved')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequestChanges() {
    if (!showNotes) {
      setShowNotes(true)
      return
    }
    setSubmitting(true)
    try {
      await fetch(`/api/portal/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepType: 'copy', status: 'changes_requested', notes }),
      })
      onApprovalUpdate('copy', 'changes_requested')
      setShowNotes(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StepShell number={4} title="Review & Approve Email Copy" state={stepState} locked={false}>
      {isApproved ? (
        <p className="text-sm font-medium text-emerald-700">
          Email copy approved — campaigns are ready to launch.
        </p>
      ) : isChangesRequested ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            Changes requested — our team is revising your email copy and will resubmit for approval.
          </p>
        </div>
      ) : isGenerating ? (
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">
            Our AI is writing personalized email sequences tailored to your business — check back soon.
          </p>
        </div>
      ) : !hasCopy ? (
        <p className="text-sm text-gray-500">
          Email copy will appear here once it&apos;s been generated.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Review the sequences below. Approve to proceed, or let us know what you&apos;d like changed.
          </p>

          <div className="space-y-2">
            {client.draft_sequences!.sequences.map((seq, seqIdx) => (
              <div key={seqIdx} className="rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSeq(seqIdx)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{seq.sequence_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {seq.emails.length} email{seq.emails.length !== 1 ? 's' : ''} — {seq.strategy}
                    </p>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-3 ${expandedSeqs.has(seqIdx) ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {expandedSeqs.has(seqIdx) && (
                  <div className="divide-y divide-gray-100">
                    {seq.emails.map((email, emailIdx) => (
                      <div key={emailIdx} className="px-4 py-4">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Email {email.step}
                          </span>
                          <span className="text-xs text-gray-400">{email.purpose}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          Subject: {email.subject_line}
                        </p>
                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed line-clamp-6">
                          {email.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {showNotes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What would you like changed?
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="e.g. Make the tone more conversational. Also update the CTA in email 2 to book a call instead..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Approve Copy
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {showNotes ? 'Submit Changes' : 'Request Changes'}
            </button>
            {showNotes && (
              <button
                type="button"
                onClick={() => setShowNotes(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors self-center"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </StepShell>
  )
}

// ---------------------------------------------------------------------------
// Step 5: Setup in Progress
// ---------------------------------------------------------------------------

function SetupStep({
  client,
  allStepsComplete,
}: {
  client: PortalClient
  allStepsComplete: boolean
}) {
  const stepState: 'active' | 'locked' = allStepsComplete ? 'active' : 'locked'

  return (
    <StepShell
      number={5}
      title="Setup in Progress"
      state={stepState}
      locked={!allStepsComplete}
    >
      {!allStepsComplete ? (
        <p className="text-sm text-gray-400">
          Complete the steps above to begin your infrastructure setup.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            We&apos;re setting up your email infrastructure and warming your inboxes for maximum
            deliverability. This typically takes{' '}
            <span className="font-medium text-gray-900">14–21 days</span>.
          </p>
          {client.start_timeline && (
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <svg
                className="h-4 w-4 flex-shrink-0 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-sm text-blue-900">
                <span className="font-medium">Expected launch: </span>
                {client.start_timeline}
              </p>
            </div>
          )}
        </div>
      )}
    </StepShell>
  )
}

// ---------------------------------------------------------------------------
// Step 6: Campaign Live
// ---------------------------------------------------------------------------

function CampaignLiveStep({ client }: { client: PortalClient }) {
  const isLive = client.status === 'active' || client.status === 'reporting'
  const stepState: 'complete' | 'locked' = isLive ? 'complete' : 'locked'
  const stats = client.campaign_stats as Record<string, string | number> | null | undefined

  return (
    <StepShell
      number={6}
      title="Campaign Live"
      state={stepState}
      locked={!isLive}
    >
      {!isLive ? (
        <p className="text-sm text-gray-400">
          Your campaign will go live after setup is complete.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-emerald-700">
            Your campaign is live and generating results!
          </p>
          {stats && Object.keys(stats).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(stats).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-gray-200 bg-white p-3 text-center"
                >
                  <p className="text-lg font-bold text-gray-900">{String(value)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </StepShell>
  )
}

// ---------------------------------------------------------------------------
// Package sidebar
// ---------------------------------------------------------------------------

function PackageSidebar({ client }: { client: PortalClient }) {
  const packages = (client.packages_selected ?? []) as PackageSlug[]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sticky top-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Your Package</h2>

      {packages.length > 0 ? (
        <ul className="space-y-3 mb-5">
          {packages.map((slug) => {
            const pkg = PACKAGES[slug]
            if (!pkg) return null
            return (
              <li key={slug} className="flex items-start gap-2.5">
                <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="h-2.5 w-2.5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{pkg.label}</p>
                  <p className="text-xs text-gray-400 leading-snug mt-0.5">{pkg.description}</p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 mb-5">Packages not yet assigned.</p>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600">Setup Fee</p>
            <p className="text-xs text-gray-400">One-time</p>
          </div>
          <p className="text-base font-bold text-gray-900">
            {client.setup_fee != null ? formatCurrency(client.setup_fee) : '—'}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600">Monthly</p>
            <p className="text-xs text-gray-400">Recurring</p>
          </div>
          <p className="text-base font-bold text-gray-900">
            {client.recurring_fee != null ? formatCurrency(client.recurring_fee) : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ClientPortal({
  client,
  approvals: initialApprovals,
  tokenId: _tokenId,
  token,
}: ClientPortalProps) {
  const [approvals, setApprovals] = useState<PortalApprovals>(initialApprovals)

  function handleApprovalUpdate(
    step: 'domains' | 'copy',
    status: 'approved' | 'changes_requested'
  ) {
    setApprovals((prev) => ({ ...prev, [step]: status }))
  }

  const invoicePaid = client.stripe_invoice_status === 'paid'
  const domainsApproved = approvals.domains === 'approved'
  const copyApproved = approvals.copy === 'approved'
  const contractDone =
    client.rabbitsign_status === 'signed' || client.rabbitsign_status === 'completed'

  const allStepsComplete = contractDone && invoicePaid && domainsApproved && copyApproved

  const firstName = getFirstName(client.primary_contact_name, client.company_name)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName}!</h1>
        <p className="mt-1 text-sm text-gray-500">
          {client.company_name} — complete the steps below to launch your Cursive campaign.
        </p>
      </div>

      {/* Two-column layout: steps + sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Steps (main column) */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Relative container for the connector line */}
            <div className="relative">
              {/* Vertical connector line behind the icons */}
              <div
                className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-gray-100 z-0"
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-0">
                <ContractStep client={client} />
                <InvoiceStep client={client} />
                <DomainsStep
                  client={client}
                  approvalStatus={approvals.domains}
                  token={token}
                  onApprovalUpdate={handleApprovalUpdate}
                  locked={!invoicePaid}
                />
                <CopyStep
                  client={client}
                  approvalStatus={approvals.copy}
                  token={token}
                  onApprovalUpdate={handleApprovalUpdate}
                />
                <SetupStep client={client} allStepsComplete={allStepsComplete} />
                <CampaignLiveStep client={client} />
              </div>
            </div>
          </div>

          {/* Support footer */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
            <p className="text-sm text-gray-500">
              Questions? Our team is here to help.{' '}
              <a
                href="mailto:support@meetcursive.com"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                support@meetcursive.com
              </a>
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <PackageSidebar client={client} />
        </div>
      </div>
    </div>
  )
}
