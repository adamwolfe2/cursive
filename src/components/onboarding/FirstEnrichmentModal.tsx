'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { X, Sparkles, Building2, Briefcase, MapPin, Share2 } from 'lucide-react'

interface FirstEnrichmentLead {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  company_name: string | null
  job_title: string | null
  city: string | null
  state: string | null
  intent_score_calculated: number | null
}

interface FirstEnrichmentModalProps {
  lead: FirstEnrichmentLead
  workspaceId: string
}

function intentLabel(score: number | null) {
  if (!score) return null
  if (score >= 70) return { label: 'Hot', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  if (score >= 40) return { label: 'Warm', className: 'bg-amber-100 text-amber-800 border-amber-200' }
  return { label: 'Cold', className: 'bg-slate-100 text-slate-700 border-slate-200' }
}

export function FirstEnrichmentModal({ lead, workspaceId }: FirstEnrichmentModalProps) {
  const [open, setOpen] = useState(true)
  const [dismissing, setDismissing] = useState(false)

  const dismiss = useCallback(async () => {
    if (dismissing) return
    setDismissing(true)

    // Mark as seen in DB — fire and forget
    fetch('/api/workspace/mark-first-enrichment-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    }).catch(() => {})

    setOpen(false)
  }, [dismissing, workspaceId])

  if (!open) return null

  const displayName =
    lead.full_name ||
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
    'Your first lead'

  const location = [lead.city, lead.state].filter(Boolean).join(', ')
  const intent = intentLabel(lead.intent_score_calculated)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-enrichment-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-6 pb-5">
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-yellow-300" aria-hidden="true" />
            <span className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              First lead identified
            </span>
          </div>

          <h2 id="first-enrichment-title" className="text-xl font-bold text-white leading-tight">
            Your first lead is here!
          </h2>
          <p className="mt-1 text-sm text-white/75">
            Cursive is now identifying visitors in real time, 24/7.
          </p>
        </div>

        {/* Lead card preview */}
        <div className="px-6 py-5">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">{displayName}</p>

                {lead.job_title && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 truncate">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {lead.job_title}
                  </p>
                )}

                {lead.company_name && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-700 font-medium truncate">
                    <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {lead.company_name}
                  </p>
                )}

                {location && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-400 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {location}
                  </p>
                )}
              </div>

              {intent && (
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${intent.className}`}
                >
                  {intent.label}
                </span>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            This is just the beginning. Every visitor who lands on your site is now a potential lead — identified automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Link
            href={`/leads`}
            onClick={dismiss}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            View Lead
          </Link>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Cursive just identified my first lead!',
                  url: 'https://leads.meetcursive.com',
                }).catch(() => {})
              } else {
                navigator.clipboard?.writeText('https://leads.meetcursive.com').catch(() => {})
              }
              dismiss()
            }}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
