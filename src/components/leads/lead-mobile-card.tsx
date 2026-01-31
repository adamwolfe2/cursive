/**
 * Lead Mobile Card Component
 * Responsive card view for leads table on mobile devices
 */

'use client'

import { Building2, Mail, Phone, MapPin, Briefcase, Target, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Lead } from '@/types/database.types'

interface LeadMobileCardProps {
  lead: Lead
  onClick?: (lead: Lead) => void
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  unqualified: 'bg-gray-100 text-gray-800',
  nurture: 'bg-purple-100 text-purple-800',
}

export function LeadMobileCard({ lead, onClick }: LeadMobileCardProps) {
  const statusColor = statusColors[lead.status || 'new'] || statusColors.new

  return (
    <div
      onClick={() => onClick?.(lead)}
      className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow min-h-[44px]"
      role="button"
      tabIndex={0}
    >
      {/* Header: Name, Title, Status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base text-zinc-900">
            {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
          </h3>
          {lead.job_title && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-600 mt-1">
              <Briefcase className="h-3.5 w-3.5" />
              <span>{lead.job_title}</span>
            </div>
          )}
        </div>
        <Badge className={`${statusColor} text-xs px-2 py-1 rounded-full ml-2`}>
          {lead.status || 'new'}
        </Badge>
      </div>

      {/* Company */}
      {lead.company_name && (
        <div className="flex items-center gap-2 text-sm text-zinc-700 mb-2">
          <Building2 className="h-4 w-4 text-zinc-500" />
          <span className="font-medium">{lead.company_name}</span>
          {lead.company_size && (
            <span className="text-xs text-zinc-500">({lead.company_size})</span>
          )}
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-1.5 mb-3">
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-blue-600 min-h-[44px] -my-2 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-4 w-4" />
            <span className="truncate">{lead.email}</span>
          </a>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-blue-600 min-h-[44px] -my-2 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-4 w-4" />
            <span>{lead.phone}</span>
          </a>
        )}
      </div>

      {/* Location */}
      {(lead.city || lead.state) && (
        <div className="flex items-center gap-2 text-sm text-zinc-600 mb-2">
          <MapPin className="h-4 w-4 text-zinc-500" />
          <span>
            {[lead.city, lead.state].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      {/* Intent Topic & Score */}
      {lead.intent_topic && (
        <div className="flex items-center gap-2 text-sm mb-3">
          <Target className="h-4 w-4 text-zinc-500" />
          <Badge variant="outline" className="text-xs">
            {lead.intent_topic}
          </Badge>
          {lead.intent_score && (
            <Badge variant="secondary" className="text-xs">
              Score: {lead.intent_score}
            </Badge>
          )}
        </div>
      )}

      {/* Footer: Created Date */}
      {lead.created_at && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Added {new Date(lead.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      )}
    </div>
  )
}

interface LeadMobileCardListProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

export function LeadMobileCardList({ leads, onLeadClick }: LeadMobileCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4">
      {leads.map((lead) => (
        <LeadMobileCard key={lead.id} lead={lead} onClick={onLeadClick} />
      ))}
    </div>
  )
}
