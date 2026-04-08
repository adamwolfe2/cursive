'use client'

import { useState } from 'react'
import {
  Users, Zap, Clock, ArrowRight, MapPin,
  Mail, Phone, Linkedin, ExternalLink, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/design-system'
import { formatDistanceToNow } from 'date-fns'
import type { VisitorLead } from './visitor-types'
import { getInitials, getAvatarColor, getIntentBg, getIntentColor } from './visitor-types'

// ─── Copy Button ─────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="ml-1 text-gray-400 hover:text-primary transition-colors"
      title="Copy"
    >
      {copied ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

// ─── Visitor Card ──────────────────────────────────────────

interface VisitorCardProps {
  lead: VisitorLead
  onEnrich: (lead: VisitorLead) => void
  onView: (id: string) => void
}

export function VisitorCard({ lead, onEnrich, onView }: VisitorCardProps) {
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown Visitor'
  const initials = getInitials(lead)
  const isEnriched = lead.enrichment_status === 'enriched'
  const hasEmail = !!lead.email
  const hasPhone = !!lead.phone
  const hasLinkedIn = !!lead.linkedin_url

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', getAvatarColor(lead.id))}>
          {initials || <Users className="h-4 w-4" />}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <button
                onClick={() => onView(lead.id)}
                className="font-semibold text-gray-900 hover:text-primary transition-colors text-left truncate block"
              >
                {name}
              </button>
              {(lead.job_title || lead.company_name) && (
                <p className="text-sm text-gray-500 truncate">
                  {[lead.job_title, lead.company_name].filter(Boolean).join(' · ')}
                </p>
              )}
              {(lead.city || lead.state) && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {[lead.city, lead.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Intent score — typeof check, not !== null, so undefined
                values don't render an empty zero-value badge. */}
            {typeof lead.intent_score_calculated === 'number' && (
              <div className={cn('shrink-0 rounded-lg border px-2.5 py-1 text-center', getIntentBg(lead.intent_score_calculated))}>
                <div className={cn('text-sm font-bold', getIntentColor(lead.intent_score_calculated))}>
                  {lead.intent_score_calculated}
                </div>
                <div className="text-[10px] text-gray-400 leading-none">score</div>
              </div>
            )}
          </div>

          {/* Contact details (enriched) or data pills (not enriched) */}
          {isEnriched ? (
            <div className="mt-3 space-y-1">
              {hasEmail && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="truncate flex-1">{lead.email}</span>
                  <CopyBtn value={lead.email!} />
                </div>
              )}
              {hasPhone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="flex-1">{lead.phone}</span>
                  <CopyBtn value={lead.phone!} />
                </div>
              )}
              {hasLinkedIn && (
                <a
                  href={lead.linkedin_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="h-3 w-3 shrink-0" />
                  LinkedIn Profile
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                </a>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 mt-0.5">
                <Zap className="h-2.5 w-2.5" /> Enriched
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hasEmail && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
                  <Mail className="h-3 w-3" /> Email
                </span>
              )}
              {hasPhone && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
                  <Phone className="h-3 w-3" /> Phone
                </span>
              )}
              {hasLinkedIn && (
                <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1">
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </span>
              )}
            </div>
          )}

          {/* Footer: timestamp + actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
            </span>

            <div className="flex items-center gap-2">
              {!isEnriched && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => onEnrich(lead)}
                >
                  <Zap className="h-3 w-3" />
                  Enrich
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onView(lead.id)}
              >
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
