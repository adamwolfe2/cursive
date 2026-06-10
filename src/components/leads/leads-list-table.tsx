'use client'

import { formatDistanceToNow } from 'date-fns'
import { Mail, ArrowRight, MapPin } from 'lucide-react'
import type { Lead } from './lead-card'

/**
 * Clean CRM-style list view of leads for managed/funnel buyers. Replaces the
 * card grid with a scannable table: name + title, company, email, location,
 * added. No marketplace badges, blue accents only. The whole row opens the
 * lead; the email is a one-tap mailto.
 */
export function LeadsListTable({
  leads,
  onView,
}: {
  leads: Lead[]
  onView: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Company</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="hidden px-5 py-3 font-medium lg:table-cell">
              Location
            </th>
            <th className="hidden px-5 py-3 font-medium md:table-cell">
              Added
            </th>
            <th className="px-5 py-3" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => {
            const name =
              [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
              'Unknown visitor'
            const location = [lead.city, lead.state].filter(Boolean).join(', ')
            return (
              <tr
                key={lead.id}
                onClick={() => onView(lead.id)}
                className="group cursor-pointer transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-3 align-top">
                  <div className="font-medium text-foreground">{name}</div>
                  {lead.job_title && (
                    <div className="mt-0.5 max-w-[240px] truncate text-xs text-muted-foreground">
                      {lead.job_title}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 align-top text-muted-foreground">
                  {lead.company_name || '—'}
                </td>
                <td className="px-5 py-3 align-top">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex max-w-[220px] items-center gap-1.5 font-medium text-primary hover:underline"
                      title={lead.email}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-5 py-3 align-top text-muted-foreground lg:table-cell">
                  {location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                      {location}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="hidden whitespace-nowrap px-5 py-3 align-top text-xs text-muted-foreground md:table-cell">
                  {lead.delivered_at
                    ? formatDistanceToNow(new Date(lead.delivered_at), {
                        addSuffix: true,
                      })
                    : '—'}
                </td>
                <td className="px-5 py-3 text-right align-top">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
