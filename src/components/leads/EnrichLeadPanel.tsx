'use client'

/**
 * EnrichLeadPanel
 *
 * Slide-in panel that shows missing lead fields, lets users confirm
 * enrichment, animates the data reveal, and upsells when credits run out.
 */

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Zap, X, CheckCircle2, Circle, Loader2,
  Mail, Phone, Building2, Globe, Briefcase,
  MapPin, Linkedin, CreditCard, ArrowRight, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/design-system'

interface LeadFields {
  email?: string | null
  phone?: string | null
  company_name?: string | null
  company_domain?: string | null
  job_title?: string | null
  city?: string | null
  state?: string | null
  linkedin_url?: string | null
}

interface EnrichResult {
  success: boolean
  fields_added: string[]
  before: LeadFields
  after: LeadFields
  credits_used: number
  credits_remaining: number
  message?: string
}

interface EnrichLeadPanelProps {
  leadId: string
  lead: LeadFields & { full_name?: string | null }
  creditsRemaining: number
  open: boolean
  onClose: () => void
  onEnriched?: (result: EnrichResult) => void
}

const FIELD_META: Record<string, { label: string; icon: React.ReactNode }> = {
  email:          { label: 'Email address',    icon: <Mail className="h-4 w-4" /> },
  phone:          { label: 'Phone number',     icon: <Phone className="h-4 w-4" /> },
  company_name:   { label: 'Company name',     icon: <Building2 className="h-4 w-4" /> },
  company_domain: { label: 'Company website',  icon: <Globe className="h-4 w-4" /> },
  job_title:      { label: 'Job title',        icon: <Briefcase className="h-4 w-4" /> },
  city:           { label: 'City',             icon: <MapPin className="h-4 w-4" /> },
  state:          { label: 'State',            icon: <MapPin className="h-4 w-4" /> },
  linkedin_url:   { label: 'LinkedIn profile', icon: <Linkedin className="h-4 w-4" /> },
}

type Phase = 'idle' | 'scanning' | 'revealing' | 'done' | 'empty' | 'no_credits'

export function EnrichLeadPanel({
  leadId,
  lead,
  creditsRemaining,
  open,
  onClose,
  onEnriched,
}: EnrichLeadPanelProps) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<EnrichResult | null>(null)
  const [revealedFields, setRevealedFields] = useState<string[]>([])

  // Reset when panel opens
  useEffect(() => {
    if (open) {
      setPhase(creditsRemaining < 1 ? 'no_credits' : 'idle')
      setResult(null)
      setRevealedFields([])
    }
  }, [open, creditsRemaining])

  const missingFields = Object.keys(FIELD_META).filter(
    (k) => !lead[k as keyof LeadFields]
  )

  const enrichMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/enrich`, { method: 'POST' })
      if (res.status === 402) {
        const data = await res.json()
        throw Object.assign(new Error('no_credits'), { data })
      }
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Enrichment failed')
      }
      return res.json() as Promise<EnrichResult>
    },
    onMutate: () => {
      setPhase('scanning')
      setRevealedFields([])
    },
    onSuccess: async (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })

      if (!data.fields_added.length) {
        setPhase('empty')
        return
      }

      // Animate field reveal one by one
      setPhase('revealing')
      for (let i = 0; i < data.fields_added.length; i++) {
        await new Promise((r) => setTimeout(r, 250 + i * 180))
        setRevealedFields((prev) => [...prev, data.fields_added[i]])
      }
      setPhase('done')
      onEnriched?.(data)
    },
    onError: (err: any) => {
      if (err.message === 'no_credits') {
        setPhase('no_credits')
      } else {
        setPhase('idle')
      }
    },
  })

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md shadow-2xl',
          'bg-background border-l border-border',
          'flex flex-col',
          'animate-in slide-in-from-right duration-300'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Enrich Lead</h2>
              <p className="text-xs text-muted-foreground">
                {lead.full_name || 'This lead'} · 1 credit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* No credits state */}
          {phase === 'no_credits' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Out of credits</p>
                <p className="text-sm text-amber-700 mt-1">
                  Upgrade to Pro for 1,000 enrichments per day.
                </p>
              </div>
              <Button asChild className="w-full">
                <a href="/settings/billing">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          )}

          {/* Idle: show what's missing + confirm */}
          {phase === 'idle' && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Fields to fill in
                </p>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll search Audience Labs&apos; database to find any missing information.
                </p>
              </div>

              <div className="space-y-2">
                {Object.keys(FIELD_META).map((key) => {
                  const meta = FIELD_META[key]
                  const hasValue = !!lead[key as keyof LeadFields]
                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border',
                        hasValue
                          ? 'border-border/50 bg-muted/30 opacity-50'
                          : 'border-primary/20 bg-primary/5'
                      )}
                    >
                      <span className={cn(hasValue ? 'text-muted-foreground' : 'text-primary')}>
                        {meta.icon}
                      </span>
                      <span className={cn(
                        'text-sm flex-1',
                        hasValue ? 'text-muted-foreground line-through' : 'text-foreground font-medium'
                      )}>
                        {meta.label}
                      </span>
                      {hasValue ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-primary/40" />
                      )}
                    </div>
                  )
                })}
              </div>

              {missingFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This lead already has all key fields populated.
                </p>
              )}
            </>
          )}

          {/* Scanning animation */}
          {phase === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-foreground">Scanning database…</p>
                <p className="text-sm text-muted-foreground">
                  Searching 280M+ profiles
                </p>
              </div>
              {/* Shimmer rows */}
              <div className="w-full space-y-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-11 rounded-lg bg-muted animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            </div>
          )}

          {/* Revealing fields */}
          {(phase === 'revealing' || phase === 'done') && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {phase === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                <p className="font-semibold text-foreground">
                  {phase === 'done'
                    ? `${result.fields_added.length} field${result.fields_added.length !== 1 ? 's' : ''} filled in`
                    : 'Filling in fields…'
                  }
                </p>
              </div>

              <div className="space-y-2">
                {Object.keys(FIELD_META).map((key) => {
                  const meta = FIELD_META[key]
                  const wasEmpty = !result.before[key as keyof LeadFields]
                  const newValue = result.after[key as keyof LeadFields]
                  const justAdded = result.fields_added.includes(key)
                  const isRevealed = revealedFields.includes(key)
                  const hadBefore = !!result.before[key as keyof LeadFields]

                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-all duration-500',
                        hadBefore
                          ? 'border-border/50 bg-muted/30 opacity-50'
                          : justAdded && isRevealed
                            ? 'border-green-200 bg-green-50 scale-[1.01]'
                            : justAdded && !isRevealed
                              ? 'border-primary/20 bg-primary/5 animate-pulse'
                              : 'border-border/50 bg-muted/30 opacity-40'
                      )}
                    >
                      <span className={cn(
                        'mt-0.5',
                        hadBefore ? 'text-muted-foreground'
                          : justAdded && isRevealed ? 'text-green-600'
                          : 'text-muted-foreground'
                      )}>
                        {meta.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{meta.label}</p>
                        {(hadBefore || (justAdded && isRevealed)) && newValue ? (
                          <p className={cn(
                            'text-sm font-medium truncate',
                            justAdded && isRevealed ? 'text-green-700' : 'text-foreground'
                          )}>
                            {newValue}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not found</p>
                        )}
                      </div>
                      {hadBefore ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : justAdded && isRevealed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 animate-in zoom-in duration-300" />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No new data found */}
          {phase === 'empty' && (
            <div className="text-center py-10 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Circle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No new data found</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                This lead wasn&apos;t found in the Audience Labs database. 1 credit was used.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border space-y-3">
          {/* Credit info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Credits remaining after this call</span>
            <span className={cn(
              'font-semibold',
              creditsRemaining <= 1 ? 'text-amber-600' : 'text-foreground'
            )}>
              {Math.max(0, creditsRemaining - (phase === 'done' || phase === 'empty' ? 1 : 0))} / {creditsRemaining} left
            </span>
          </div>

          {/* Action button */}
          {phase === 'idle' && (
            <Button
              className="w-full h-11 text-base font-medium gap-2"
              onClick={() => enrichMutation.mutate()}
              disabled={missingFields.length === 0 || creditsRemaining < 1}
            >
              <Zap className="h-4 w-4" />
              Enrich for 1 Credit
            </Button>
          )}

          {phase === 'scanning' && (
            <Button className="w-full h-11" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning…
            </Button>
          )}

          {(phase === 'done' || phase === 'empty' || phase === 'revealing') && (
            <Button variant="outline" className="w-full h-11" onClick={onClose}>
              {phase === 'done' ? 'Done — view updated lead' : 'Close'}
            </Button>
          )}

          {creditsRemaining <= 3 && phase === 'idle' && creditsRemaining > 0 && (
            <p className="text-xs text-center text-amber-600">
              Running low.{' '}
              <a href="/settings/billing" className="underline hover:text-amber-700">
                Buy more credits
              </a>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
