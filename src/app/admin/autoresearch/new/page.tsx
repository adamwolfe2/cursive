'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const DEFAULT_CONFIG = {
  targetNiche: '',
  targetPersona: '',
  maxVariantsPerExperiment: 3,
  testDurationHours: 72,
  minSampleSize: 100,
  successMetric: 'positive_reply_rate' as const,
  maxConcurrentExperiments: 1,
  autoApplyWinner: true,
  elementRotation: ['subject', 'opening_line', 'body', 'cta'],
  qualityConstraints: {
    maxWordCount: 120,
    minWordCount: 50,
    maxSubjectLength: 60,
    requirePersonalization: true,
  },
}

export default function NewAutoresearchProgramPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [targetNiche, setTargetNiche] = useState('')
  const [targetPersona, setTargetPersona] = useState('')
  const [baselineSubject, setBaselineSubject] = useState('')
  const [baselineBody, setBaselineBody] = useState('')
  const [emailbisonCampaignId, setEmailbisonCampaignId] = useState('')
  const [testDurationHours, setTestDurationHours] = useState(72)
  const [minSampleSize, setMinSampleSize] = useState(100)
  const [maxVariants, setMaxVariants] = useState(3)
  const [successMetric, setSuccessMetric] = useState<string>('positive_reply_rate')
  const [autoApplyWinner, setAutoApplyWinner] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Program name is required')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/autoresearch/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          config: {
            ...DEFAULT_CONFIG,
            targetNiche: targetNiche.trim(),
            targetPersona: targetPersona.trim(),
            maxVariantsPerExperiment: maxVariants,
            testDurationHours,
            minSampleSize,
            successMetric,
            autoApplyWinner,
          },
          baseline_subject: baselineSubject.trim() || null,
          baseline_body: baselineBody.trim() || null,
          emailbison_campaign_id: emailbisonCampaignId.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to create program (${res.status})`)
      }

      const { data } = await res.json()
      router.push(`/admin/autoresearch/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href="/admin/autoresearch"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Programs
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">New Autoresearch Program</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Program Identity */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Program Identity</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Program Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Corp — SaaS Founders Outbound"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>
        </section>

        {/* Target Audience */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Target Audience</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Target Niche</label>
              <input
                type="text"
                value={targetNiche}
                onChange={(e) => setTargetNiche(e.target.value)}
                placeholder="e.g., B2B SaaS"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Target Persona</label>
              <input
                type="text"
                value={targetPersona}
                onChange={(e) => setTargetPersona(e.target.value)}
                placeholder="e.g., Seed to Series A founders"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Baseline Copy */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Baseline Copy</h2>
          <p className="text-xs text-muted-foreground">The current best-performing email. The system will try to beat this.</p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Baseline Subject Line</label>
            <input
              type="text"
              value={baselineSubject}
              onChange={(e) => setBaselineSubject(e.target.value)}
              placeholder="e.g., {first_name}, quick question"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Baseline Email Body</label>
            <textarea
              value={baselineBody}
              onChange={(e) => setBaselineBody(e.target.value)}
              rows={6}
              placeholder="Paste your current best-performing email body here..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            />
          </div>
        </section>

        {/* EmailBison Integration */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">EmailBison Campaign</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">EmailBison Campaign ID</label>
            <input
              type="text"
              value={emailbisonCampaignId}
              onChange={(e) => setEmailbisonCampaignId(e.target.value)}
              placeholder="e.g., camp_abc123"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">The campaign where variants will be pushed for A/B testing.</p>
          </div>
        </section>

        {/* Experiment Settings */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Experiment Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Test Duration (hours)</label>
              <input
                type="number"
                value={testDurationHours}
                onChange={(e) => setTestDurationHours(Number(e.target.value))}
                min={24}
                max={336}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Min Sample Size</label>
              <input
                type="number"
                value={minSampleSize}
                onChange={(e) => setMinSampleSize(Number(e.target.value))}
                min={50}
                max={5000}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Max Variants</label>
              <input
                type="number"
                value={maxVariants}
                onChange={(e) => setMaxVariants(Number(e.target.value))}
                min={1}
                max={5}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Success Metric</label>
              <select
                value={successMetric}
                onChange={(e) => setSuccessMetric(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="positive_reply_rate">Positive Reply Rate</option>
                <option value="reply_rate">Total Reply Rate</option>
                <option value="open_rate">Open Rate</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="autoApply"
                checked={autoApplyWinner}
                onChange={(e) => setAutoApplyWinner(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <label htmlFor="autoApply" className="text-sm text-foreground">
                Auto-apply winning variants
              </label>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Program'}
          </button>
          <Link
            href="/admin/autoresearch"
            className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
