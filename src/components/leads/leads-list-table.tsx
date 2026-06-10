'use client'

import { formatDistanceToNow } from 'date-fns'
import { Mail, ArrowRight, MapPin } from 'lucide-react'
import type { Lead } from './lead-card'

/**
 * Clean CRM-style list view of leads for managed/funnel buyers. Replaces the
 * card grid with a scannable table: name + title, company, email, location,
 * added. No marketplace badges, blue accents only. The whole row opens the
 * lead; the email is a one-tap mailto.
 *
 * Mobile (≤370px): no min-width, tighter cell padding, and columns drop
 * progressively (Company/View < sm, Added < md, Location < lg) so a phone
 * shows a clean Name + Email with no horizontal scroll.
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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-3 font-medium sm:px-5">Name</th>
            <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Company</th>
            <th className="px-3 py-3 font-medium sm:px-5">Email</th>
            <th className="hidden px-3 py-3 font-medium lg:table-cell lg:px-5">Location</th>
            <th className="hidden px-3 py-3 font-medium md:table-cell md:px-5">Added</th>
            <th className="hidden px-3 py-3 sm:table-cell sm:px-5" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => {
            const name =
              [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown visitor'
            const location = [lead.city, lead.state].filter(Boolean).join(', ')
            return (
              <tr
                key={lead.id}
                onClick={() => onView(lead.id)}
                className="group cursor-pointer transition-colors hover:bg-muted/40"
              >
                <td className="px-3 py-3 align-top sm:px-5">
                  <div className="max-w-[150px] truncate font-medium text-foreground sm:max-w-none">
                    {name}
                  </div>
                  {lead.job_title && (
                    <div className="mt-0.5 max-w-[150px] truncate text-xs text-muted-foreground sm:max-w-[240px]">
                      {lead.job_title}
                    </div>
                  )}
                </td>
                <td className="hidden px-3 py-3 align-top text-muted-foreground sm:table-cell sm:px-5">
                  {lead.company_name || '—'}
                </td>
                <td className="px-3 py-3 align-top sm:px-5">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex max-w-[160px] items-center gap-1.5 font-medium text-primary hover:underline sm:max-w-[220px]"
                      title={lead.email}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-3 py-3 align-top text-muted-foreground lg:table-cell lg:px-5">
                  {location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                      {location}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-3 align-top text-xs text-muted-foreground md:table-cell md:px-5">
                  {lead.delivered_at
                    ? formatDistanceToNow(new Date(lead.delivered_at), { addSuffix: true })
                    : '—'}
                </td>
                <td className="hidden px-3 py-3 text-right align-top sm:table-cell sm:px-5">
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
