'use client'

import { useState } from 'react'
import type { SdrConfiguration } from '@/lib/repositories/sdr-config.repository'

const TABS = ['Objective', 'Email Integration', 'Calendar', 'Company Info', 'Response Config'] as const
type Tab = (typeof TABS)[number]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
]

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian']

interface ClientProfile {
  workspace_id: string
  company_name?: string | null
  primary_offering?: string | null
  value_propositions?: string | null
  pain_points?: string | null
  target_titles?: string | null
  website_url?: string | null
}

interface ConfigWizardProps {
  workspaceId: string
  workspaceName: string
  initialConfig: SdrConfiguration | null
  clientProfile: ClientProfile | null
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-blue-400 hover:text-blue-700 font-bold leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 text-sm bg-zinc-100 border rounded-md hover:bg-zinc-200"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function ConfigWizard({ workspaceId, workspaceName, initialConfig, clientProfile }: ConfigWizardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Objective')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  const [form, setForm] = useState<Partial<SdrConfiguration>>({
    objective: initialConfig?.objective ?? 'Set up a meeting',
    language: initialConfig?.language ?? 'English',
    do_not_contact_enabled: initialConfig?.do_not_contact_enabled ?? false,
    human_in_the_loop: initialConfig?.human_in_the_loop ?? true,
    trigger_phrases: initialConfig?.trigger_phrases ?? [],
    warmup_exclusion_keywords: initialConfig?.warmup_exclusion_keywords ?? [],
    follow_up_enabled: initialConfig?.follow_up_enabled ?? false,
    follow_up_count: initialConfig?.follow_up_count ?? 2,
    follow_up_interval_days: initialConfig?.follow_up_interval_days ?? 3,
    reply_to_no_thanks: initialConfig?.reply_to_no_thanks ?? false,
    no_thanks_template: initialConfig?.no_thanks_template ?? null,
    enable_signature: initialConfig?.enable_signature ?? true,
    auto_bcc_address: initialConfig?.auto_bcc_address ?? null,
    notification_email: initialConfig?.notification_email ?? null,
    cal_booking_url: initialConfig?.cal_booking_url ?? null,
    timezone: initialConfig?.timezone ?? 'America/Chicago',
    availability_start: initialConfig?.availability_start ?? '08:00',
    availability_end: initialConfig?.availability_end ?? '17:00',
    exclude_weekends: initialConfig?.exclude_weekends ?? true,
    exclude_holidays: initialConfig?.exclude_holidays ?? true,
    agent_first_name: initialConfig?.agent_first_name ?? null,
    agent_last_name: initialConfig?.agent_last_name ?? null,
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const loadFromProfile = () => {
    if (!clientProfile) return
    setForm((prev) => ({
      ...prev,
      ...(clientProfile.company_name && !prev.agent_last_name
        ? { agent_last_name: clientProfile.company_name }
        : {}),
    }))
  }

  const save = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch(`/api/admin/sdr/config/${workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const previewFromName = [form.agent_first_name, form.agent_last_name].filter(Boolean).join(' ') || 'Your Agent'
  const previewBody = `Hi [First Name],\n\nThanks for getting back to me...\n\n${form.cal_booking_url ? `Book a time: ${form.cal_booking_url}` : ''}\n\nBest,\n${previewFromName}`

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Main wizard */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-zinc-900">SDR Configuration</h1>
            <p className="text-sm text-zinc-500 mt-1">{workspaceName}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b mb-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab 1: Objective */}
          {activeTab === 'Objective' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Campaign Objective</label>
                <div className="space-y-2">
                  {['Set up a meeting', 'Generate leads', 'Custom'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="objective"
                        value={opt}
                        checked={form.objective === opt}
                        onChange={() => set('objective', opt)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-zinc-700">{opt}</span>
                    </label>
                  ))}
                  {form.objective === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Describe your objective..."
                      className="w-full mt-1 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => set('language', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-zinc-700">Do Not Contact List</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Skip replies from blocked emails</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('do_not_contact_enabled', !form.do_not_contact_enabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    form.do_not_contact_enabled ? 'bg-blue-600' : 'bg-zinc-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      form.do_not_contact_enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Email Integration */}
          {activeTab === 'Email Integration' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-lg">✓</span>
                <div>
                  <p className="text-sm font-medium text-green-800">EmailBison Connected</p>
                  <p className="text-xs text-green-600 mt-0.5">Replies are automatically routed to this inbox</p>
                </div>
              </div>
              <div className="p-4 bg-zinc-50 border rounded-lg text-sm text-zinc-600">
                <p className="font-medium text-zinc-700 mb-1">How it works</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>EmailBison delivers reply events to Cursive via webhook</li>
                  <li>Claude classifies and drafts a response</li>
                  <li>Drafts route to this inbox for your approval (when HiL is ON)</li>
                  <li>High-intent replies auto-send when HiL is OFF</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Calendar */}
          {activeTab === 'Calendar' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Cal.com Booking URL</label>
                <input
                  type="url"
                  value={form.cal_booking_url || ''}
                  onChange={(e) => set('cal_booking_url', e.target.value || null)}
                  placeholder="https://cal.com/yourname/30min"
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => set('timezone', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Available From</label>
                  <input
                    type="time"
                    value={form.availability_start}
                    onChange={(e) => set('availability_start', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Available Until</label>
                  <input
                    type="time"
                    value={form.availability_end}
                    onChange={(e) => set('availability_end', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'exclude_weekends' as const, label: 'Exclude weekends' },
                  { key: 'exclude_holidays' as const, label: 'Exclude holidays' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-zinc-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Company Info */}
          {activeTab === 'Company Info' && (
            <div className="space-y-5">
              {clientProfile && (
                <button
                  type="button"
                  onClick={loadFromProfile}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Load from existing profile
                </button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Agent First Name</label>
                  <input
                    type="text"
                    value={form.agent_first_name || ''}
                    onChange={(e) => set('agent_first_name', e.target.value || null)}
                    placeholder="Alex"
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Agent Last Name</label>
                  <input
                    type="text"
                    value={form.agent_last_name || ''}
                    onChange={(e) => set('agent_last_name', e.target.value || null)}
                    placeholder="Johnson"
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {clientProfile && (
                <div className="p-3 bg-zinc-50 border rounded-lg space-y-1">
                  <p className="text-xs font-medium text-zinc-600">From client profile:</p>
                  {clientProfile.company_name && (
                    <p className="text-xs text-zinc-500">Company: {clientProfile.company_name}</p>
                  )}
                  {clientProfile.primary_offering && (
                    <p className="text-xs text-zinc-500">Offering: {clientProfile.primary_offering}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Response Config */}
          {activeTab === 'Response Config' && (
            <div className="space-y-6">
              {/* HiL Toggle */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Human in the Loop</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Drafts wait for admin approval before sending</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('human_in_the_loop', !form.human_in_the_loop)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      form.human_in_the_loop ? 'bg-blue-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        form.human_in_the_loop ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {form.human_in_the_loop && (
                  <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded">
                    When ON, all AI drafts appear in the &ldquo;Needs Approval&rdquo; inbox before being sent.
                  </div>
                )}
              </div>

              {/* Trigger Phrases */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Trigger Phrases</label>
                <p className="text-xs text-zinc-500 mb-2">
                  Only draft responses if the reply contains at least one of these phrases. Leave empty to respond to all.
                </p>
                <TagInput
                  value={form.trigger_phrases || []}
                  onChange={(v) => set('trigger_phrases', v)}
                  placeholder="e.g. interested, tell me more"
                />
              </div>

              {/* Notification email */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Reply-From Email</label>
                <input
                  type="email"
                  value={form.notification_email || ''}
                  onChange={(e) => set('notification_email', e.target.value || null)}
                  placeholder="replies@example.com"
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Auto BCC */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Auto BCC Address</label>
                <input
                  type="email"
                  value={form.auto_bcc_address || ''}
                  onChange={(e) => set('auto_bcc_address', e.target.value || null)}
                  placeholder="bcc@example.com"
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Follow-up */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Follow-up Automation</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Auto-send follow-ups to unanswered replied leads</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('follow_up_enabled', !form.follow_up_enabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      form.follow_up_enabled ? 'bg-blue-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        form.follow_up_enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {form.follow_up_enabled && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs text-zinc-600 mb-1">Number of follow-ups (1–5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={form.follow_up_count}
                        onChange={(e) => set('follow_up_count', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-600 mb-1">Interval (days between)</label>
                      <input
                        type="number"
                        min={1}
                        value={form.follow_up_interval_days}
                        onChange={(e) => set('follow_up_interval_days', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Warmup exclusion keywords */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Warmup Exclusion Keywords</label>
                <p className="text-xs text-zinc-500 mb-2">
                  Skip replies that contain these keywords (e.g., spam traps)
                </p>
                <TagInput
                  value={form.warmup_exclusion_keywords || []}
                  onChange={(v) => set('warmup_exclusion_keywords', v)}
                  placeholder="e.g. unsubscribe, opt-out"
                />
              </div>

              {/* Reply to no thanks */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Reply to &ldquo;No Thanks&rdquo;</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Send a polite closing message</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('reply_to_no_thanks', !form.reply_to_no_thanks)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      form.reply_to_no_thanks ? 'bg-blue-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        form.reply_to_no_thanks ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {form.reply_to_no_thanks && (
                  <textarea
                    rows={3}
                    value={form.no_thanks_template || ''}
                    onChange={(e) => set('no_thanks_template', e.target.value || null)}
                    placeholder="Thanks for letting me know! I'll remove you from our list..."
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Signature toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.enable_signature}
                  onChange={(e) => set('enable_signature', e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-zinc-700">Include email signature</span>
              </label>
            </div>
          )}

          {/* Save button */}
          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600 font-medium">✓ Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600">Failed to save. Try again.</span>
            )}
          </div>
        </div>
      </div>

      {/* Preview panel */}
      <div className="w-72 border-l bg-zinc-50 p-4 flex-shrink-0 overflow-y-auto">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Example Email Preview
        </p>
        <div className="bg-white border rounded-lg p-3 text-xs font-mono space-y-2">
          <div className="text-zinc-500">
            <span className="text-zinc-400">From:</span> {previewFromName}
          </div>
          <div className="text-zinc-500">
            <span className="text-zinc-400">Subject:</span> Re: [Original Subject]
          </div>
          <div className="border-t pt-2">
            <pre className="whitespace-pre-wrap text-zinc-700 text-[11px] leading-relaxed font-sans">
              {previewBody}
            </pre>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Human in the Loop</span>
            <span className={`font-medium ${form.human_in_the_loop ? 'text-blue-600' : 'text-zinc-400'}`}>
              {form.human_in_the_loop ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Language</span>
            <span className="font-medium text-zinc-700">{form.language}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Follow-up</span>
            <span className={`font-medium ${form.follow_up_enabled ? 'text-blue-600' : 'text-zinc-400'}`}>
              {form.follow_up_enabled ? `${form.follow_up_count}x / ${form.follow_up_interval_days}d` : 'OFF'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Trigger phrases</span>
            <span className="font-medium text-zinc-700">{(form.trigger_phrases || []).length || 'None'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
