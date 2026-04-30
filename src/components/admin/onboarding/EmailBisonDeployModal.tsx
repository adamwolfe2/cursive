'use client'

import { useState, useMemo, useCallback } from 'react'
import { Rocket, Copy, Check, X, ChevronDown } from 'lucide-react'

interface EmailBisonDeployModalProps {
  isOpen: boolean
  onClose: () => void
  client: {
    id: string
    company_name: string
    primary_contact_email: string
    reply_routing_email: string | null
    sender_names: string | null
  }
  sequences: {
    sequences: Array<{
      sequence_name: string
      strategy: string
      emails: Array<{
        step: number
        delay_days: number
        subject_line: string
        body: string
        purpose: string
      }>
    }>
  }
}

const RAMP_SCHEDULES = [
  { label: 'Conservative (10\u219230/day, 2 weeks)', value: 'conservative' },
  { label: 'Moderate (20\u219240/day, 1 week)', value: 'moderate' },
  { label: 'Aggressive (30\u219250/day, 3 days)', value: 'aggressive' },
] as const

type RampSchedule = (typeof RAMP_SCHEDULES)[number]['value']

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

function formatDateForName(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function EmailBisonDeployModal({
  isOpen,
  onClose,
  client,
  sequences,
}: EmailBisonDeployModalProps) {
  const sequenceList = sequences.sequences ?? []

  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0)
  const [dailySendLimit, setDailySendLimit] = useState(30)
  const [rampSchedule, setRampSchedule] = useState<RampSchedule>('conservative')
  const [startDate, setStartDate] = useState(getTomorrowDate)
  const [replyHandling, setReplyHandling] = useState<'auto_forward' | 'manage_in_emailbison'>(
    client.reply_routing_email ? 'auto_forward' : 'manage_in_emailbison'
  )
  const [copied, setCopied] = useState(false)
  const [specExpanded, setSpecExpanded] = useState(false)

  const selectedSequence = sequenceList[selectedSequenceIndex] ?? null

  const campaignNameDefault = useMemo(() => {
    const seqName = selectedSequence?.sequence_name ?? 'Sequence'
    const dateStr = formatDateForName(startDate)
    return `${client.company_name} - ${seqName} - ${dateStr}`
  }, [client.company_name, selectedSequence?.sequence_name, startDate])

  const [campaignNameOverride, setCampaignNameOverride] = useState('')
  const campaignName = campaignNameOverride || campaignNameDefault

  const rampLabel = RAMP_SCHEDULES.find((r) => r.value === rampSchedule)?.label ?? rampSchedule

  const campaignSpec = useMemo(() => {
    if (!selectedSequence) return null
    return {
      campaign_name: campaignName,
      client_id: client.id,
      sender_names: client.sender_names
        ? client.sender_names.split(',').map((n) => n.trim())
        : [],
      sequence: {
        sequence_name: selectedSequence.sequence_name,
        strategy: selectedSequence.strategy,
        emails: selectedSequence.emails.map((email) => ({
          step: email.step,
          delay_days: email.delay_days,
          subject_line: email.subject_line,
          body: email.body,
          purpose: email.purpose,
        })),
      },
      daily_limit: dailySendLimit,
      ramp_schedule: rampSchedule,
      start_date: startDate,
      reply_handling:
        replyHandling === 'auto_forward'
          ? {
              mode: 'auto_forward',
              forward_to: client.reply_routing_email,
            }
          : {
              mode: 'manage_in_emailbison',
            },
    }
  }, [
    campaignName,
    client.id,
    client.sender_names,
    client.reply_routing_email,
    selectedSequence,
    dailySendLimit,
    rampSchedule,
    startDate,
    replyHandling,
  ])

  const specJson = useMemo(() => {
    if (!campaignSpec) return ''
    return JSON.stringify(campaignSpec, null, 2)
  }, [campaignSpec])

  const handleCopy = useCallback(async () => {
    if (!specJson) return
    try {
      await navigator.clipboard.writeText(specJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = specJson
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [specJson])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl border border-gray-200 mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Rocket className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Deploy to EmailBison</h2>
              <p className="text-xs text-gray-500">{client.company_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {sequenceList.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No sequences available to deploy.
            </p>
          ) : (
            <>
              {/* Sequence Selector */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Sequence
                </label>
                <select
                  value={selectedSequenceIndex}
                  onChange={(e) => {
                    setSelectedSequenceIndex(Number(e.target.value))
                    setCampaignNameOverride('')
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {sequenceList.map((seq, idx) => (
                    <option key={idx} value={idx}>
                      {seq.sequence_name} ({seq.emails.length} emails) - {seq.strategy}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignNameOverride(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Daily Send Limit + Ramp Schedule - side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Daily Send Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={dailySendLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val) && val > 0) {
                        setDailySendLimit(val)
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Ramp Schedule
                  </label>
                  <select
                    value={rampSchedule}
                    onChange={(e) => setRampSchedule(e.target.value as RampSchedule)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {RAMP_SCHEDULES.map((schedule) => (
                      <option key={schedule.value} value={schedule.value}>
                        {schedule.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getTomorrowDate()}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Reply Handling */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Reply Handling
                </label>
                <select
                  value={replyHandling}
                  onChange={(e) =>
                    setReplyHandling(e.target.value as 'auto_forward' | 'manage_in_emailbison')
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {client.reply_routing_email && (
                    <option value="auto_forward">
                      Auto-forward to {client.reply_routing_email}
                    </option>
                  )}
                  <option value="manage_in_emailbison">Manage in EmailBison</option>
                </select>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Campaign Spec Preview */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSpecExpanded(!specExpanded)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      specExpanded ? '' : '-rotate-90'
                    }`}
                  />
                  Campaign Spec JSON
                </button>

                {specExpanded && (
                  <pre className="max-h-72 overflow-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-green-400 font-mono">
                    {specJson}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {sequenceList.length > 0 && (
          <div className="sticky bottom-0 flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-xl">
            <p className="text-xs text-gray-500">
              {selectedSequence
                ? `${selectedSequence.emails.length} emails \u00B7 ${rampLabel}`
                : ''}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Campaign Spec
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
