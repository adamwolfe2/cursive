'use client'

import { Mail, Phone, Building2, MapPin, Calendar, User, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MobileCard,
  MobileCardHeader,
  MobileCardField,
  MobileCardDivider,
  MobileCardFooter,
  MobileCardMeta
} from '@/components/ui/mobile-card'
import type { LeadTableRow } from '@/types/crm.types'
import { formatDistanceToNow } from 'date-fns'

interface LeadMobileCardProps {
  lead: LeadTableRow
  selected?: boolean
  onSelect?: (checked: boolean) => void
  onView?: () => void
}

export function LeadMobileCard({ lead, selected, onSelect, onView }: LeadMobileCardProps) {
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'contacted': return 'bg-amber-100 text-amber-700'
      case 'qualified': return 'bg-green-100 text-green-700'
      case 'unqualified': return 'bg-gray-100 text-gray-700'
      case 'converted': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <MobileCard selected={selected}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {onSelect && (
          <div className="pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              aria-label={`Select ${fullName}`}
            />
          </div>
        )}

        {/* Header Content */}
        <div className="flex-1 min-w-0">
          <MobileCardHeader
            title={fullName}
            subtitle={lead.job_title || 'No title'}
            badge={
              <Badge className={getStatusColor(lead.status)}>
                {lead.status}
              </Badge>
            }
          />
        </div>
      </div>

      {/* Company Info */}
      {lead.company_name && (
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground font-medium truncate">{lead.company_name}</span>
          {lead.company_industry && (
            <span className="text-muted-foreground truncate">• {lead.company_industry}</span>
          )}
        </div>
      )}

      {/* Contact Details */}
      <div className="space-y-2">
        {lead.email && (
          <MobileCardField
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate">
                {lead.email}
              </a>
            }
          />
        )}
        {lead.phone && (
          <MobileCardField
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={
              <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                {lead.phone}
              </a>
            }
          />
        )}
      </div>

      {/* Location */}
      {(lead.city || lead.state) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {[lead.city, lead.state].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      <MobileCardDivider />

      {/* Scores & Metadata */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {lead.intent_score_calculated !== null && (
          <div>
            <div className="text-muted-foreground text-xs">Intent Score</div>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-foreground">
                {lead.intent_score_calculated}%
              </span>
            </div>
          </div>
        )}
        {lead.assigned_user && (
          <div>
            <div className="text-muted-foreground text-xs">Assigned</div>
            <div className="flex items-center gap-1 mt-0.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground truncate">
                {lead.assigned_user.full_name || lead.assigned_user.email}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <MobileCardFooter className="flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 min-w-[100px]"
          onClick={onView}
        >
          View Details
        </Button>
        {lead.email && (
          <Button
            size="sm"
            variant="default"
            className="flex-1 min-w-[100px]"
            asChild
          >
            <a href={`mailto:${lead.email}`}>
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Email
            </a>
          </Button>
        )}
      </MobileCardFooter>

      {/* Meta Info */}
      <MobileCardMeta>
        <div className="flex items-center justify-between">
          <span>
            Added {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </span>
          {lead.marketplace_price && (
            <span className="font-medium text-foreground">
              ${(lead.marketplace_price / 100).toFixed(2)}
            </span>
          )}
        </div>
        {lead.last_contacted_at && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              Last contacted {formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })}
            </span>
          </div>
        )}
      </MobileCardMeta>
    </MobileCard>
  )
}
