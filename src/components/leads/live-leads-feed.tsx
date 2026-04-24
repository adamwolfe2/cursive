'use client'

/**
 * Live AudienceLab Leads Feed
 *
 * Subscribes to the leads table via Supabase Realtime and renders the last 10
 * leads sourced from AudienceLab (pixel fires + 6-hour segment puller).
 * New arrivals pulse briefly and fire a toast.
 */

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Activity, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRealtimeLeads } from '@/hooks/use-realtime-leads'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'

const MAX_FEED_LEADS = 10
const AL_SOURCES = new Set(['audiencelab', 'audiencelab_pull'])
const PULSE_DURATION_MS = 2000

interface FeedLead {
  id: string
  first_name: string | null
  last_name: string | null
  company: string | null
  job_title: string | null
  city: string | null
  state: string | null
  source: string | null
  intent_category: string | null
  created_at: string
}

interface LiveLeadsFeedProps {
  workspaceId: string
}

export function LiveLeadsFeed({ workspaceId }: LiveLeadsFeedProps) {
  const [recentLeads, setRecentLeads] = useState<FeedLead[]>([])
  const [pulsedIds, setPulsedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Seed feed with last 10 AL leads on mount
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('leads')
      .select('id, first_name, last_name, company, job_title, city, state, source, intent_category, created_at')
      .eq('workspace_id', workspaceId)
      .in('source', Array.from(AL_SOURCES))
      .order('created_at', { ascending: false })
      .limit(MAX_FEED_LEADS)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          safeError('[LiveLeadsFeed] initial fetch failed:', error)
          setIsLoading(false)
          return
        }
        setRecentLeads((data ?? []) as FeedLead[])
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const handleInsert = useCallback((lead: any) => {
    if (!lead?.source || !AL_SOURCES.has(lead.source)) return
    const feedLead: FeedLead = {
      id: lead.id,
      first_name: lead.first_name ?? null,
      last_name: lead.last_name ?? null,
      company: lead.company ?? null,
      job_title: lead.job_title ?? null,
      city: lead.city ?? null,
      state: lead.state ?? null,
      source: lead.source ?? null,
      intent_category: lead.intent_category ?? null,
      created_at: lead.created_at ?? new Date().toISOString(),
    }
    setRecentLeads((prev) => {
      // Deduplicate by id in case a seed fetch and realtime fire race
      const withoutDup = prev.filter((l) => l.id !== feedLead.id)
      return [feedLead, ...withoutDup].slice(0, MAX_FEED_LEADS)
    })
    setPulsedIds((prev) => {
      const next = new Set(prev)
      next.add(feedLead.id)
      return next
    })
    // Clear pulse state after animation window
    setTimeout(() => {
      setPulsedIds((prev) => {
        const next = new Set(prev)
        next.delete(feedLead.id)
        return next
      })
    }, PULSE_DURATION_MS)

    const displayName = [feedLead.first_name, feedLead.last_name].filter(Boolean).join(' ') || 'New visitor'
    const description = feedLead.company
      ? `${displayName} from ${feedLead.company}`
      : displayName
    toast.success('New visitor lead', {
      description,
      duration: 4000,
    })
  }, [])

  const handleUpdate = useCallback((lead: any) => {
    if (!lead?.id) return
    setRecentLeads((prev) =>
      prev.map((existing) =>
        existing.id === lead.id
          ? {
              ...existing,
              first_name: lead.first_name ?? existing.first_name,
              last_name: lead.last_name ?? existing.last_name,
              company: lead.company ?? existing.company,
              job_title: lead.job_title ?? existing.job_title,
              city: lead.city ?? existing.city,
              state: lead.state ?? existing.state,
              intent_category: lead.intent_category ?? existing.intent_category,
            }
          : existing
      )
    )
  }, [])

  useRealtimeLeads({
    workspaceId,
    enabled: Boolean(workspaceId),
    showToasts: false, // we handle our own toast so we can filter to AL-only
    onInsert: handleInsert,
    onUpdate: handleUpdate,
  })

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-emerald-500" />
          Live Visitor Leads
          <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : recentLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Waiting for your next pixel fire…
            </p>
            <p className="text-xs text-muted-foreground/80">
              New leads appear here in real time.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentLeads.map((lead) => {
              const isPulsing = pulsedIds.has(lead.id)
              const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Anonymous visitor'
              const location = [lead.city, lead.state].filter(Boolean).join(', ')
              const timestamp = formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
              return (
                <li
                  key={lead.id}
                  className={`px-5 py-3 transition-colors ${
                    isPulsing ? 'bg-amber-50 dark:bg-amber-950/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {lead.job_title ? `${lead.job_title}` : ''}
                        {lead.job_title && lead.company ? ' · ' : ''}
                        {lead.company || ''}
                      </p>
                      {(location || lead.intent_category) && (
                        <p className="truncate text-xs text-muted-foreground/80">
                          {location}
                          {location && lead.intent_category ? ' · ' : ''}
                          {lead.intent_category ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                              {lead.intent_category}
                            </span>
                          ) : null}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {timestamp}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
