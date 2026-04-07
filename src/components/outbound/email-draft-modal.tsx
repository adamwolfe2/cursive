'use client'

/**
 * Email Draft Modal
 * -----------------
 * Right-side Sheet drawer that shows the AI-generated draft for a contact.
 * Loads the draft via /api/outbound/workflows/[id]/drafts (filtered by lead),
 * lets the user edit subject/body inline, and provides Approve / Regenerate /
 * Discard actions.
 *
 * Approve sends `campaign/email-approved` Inngest event via the existing
 * onEmailApproved → sendApprovedEmail pipeline.
 */

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormField, FormLabel, FormInput, FormTextarea } from '@/components/ui/form'
import { useToast } from '@/lib/hooks/use-toast'
import { Sparkles, Trash2, RefreshCw, Send, Edit3 } from 'lucide-react'
import type { OutboundDraft } from '@/types/outbound'

export interface EmailDraftModalProps {
  agentId: string
  leadId: string
  onClose: () => void
}

type ModalState =
  | { kind: 'loading' }
  | { kind: 'editable'; draft: OutboundDraft; subject: string; body: string }
  | { kind: 'saving'; draft: OutboundDraft }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }

export function EmailDraftModal({ agentId, leadId, onClose }: EmailDraftModalProps) {
  const [state, setState] = useState<ModalState>({ kind: 'loading' })
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // Initial fetch
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/outbound/workflows/${agentId}/drafts?lead_id=${leadId}`
        )
        if (!res.ok) throw new Error('Failed to load draft')
        const j = await res.json() as { data: OutboundDraft[] }
        if (cancelled) return
        const draft = j.data?.[0]
        if (!draft) {
          setState({ kind: 'empty' })
          return
        }
        setState({
          kind: 'editable',
          draft,
          subject: draft.subject,
          body: draft.body_text || stripHtml(draft.body_html),
        })
      } catch (err) {
        if (!cancelled) setState({ kind: 'error', message: (err as Error).message })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agentId, leadId])

  const refreshAndKeepOpen = async () => {
    try {
      const res = await fetch(
        `/api/outbound/workflows/${agentId}/drafts?lead_id=${leadId}`
      )
      const j = await res.json() as { data: OutboundDraft[] }
      const draft = j.data?.[0]
      if (!draft) {
        setState({ kind: 'empty' })
        return
      }
      setState({
        kind: 'editable',
        draft,
        subject: draft.subject,
        body: draft.body_text || stripHtml(draft.body_html),
      })
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message })
    }
  }

  const handleSaveEdit = async () => {
    if (state.kind !== 'editable') return
    setState({ kind: 'saving', draft: state.draft })
    try {
      const r = await fetch(`/api/outbound/drafts/${state.draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: state.subject, body_text: state.body }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Save failed')
      success('Draft updated')
      await refreshAndKeepOpen()
    } catch (err) {
      error((err as Error).message, { title: 'Save failed' })
      setState(s => (s.kind === 'saving' ? { kind: 'editable', draft: s.draft, subject: s.draft.subject, body: s.draft.body_text || stripHtml(s.draft.body_html) } : s))
    }
  }

  const handleRegenerate = async () => {
    if (state.kind !== 'editable') return
    setState({ kind: 'saving', draft: state.draft })
    try {
      const r = await fetch(`/api/outbound/drafts/${state.draft.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Regenerate failed')
      success('Regenerated')
      await refreshAndKeepOpen()
    } catch (err) {
      error((err as Error).message, { title: 'Regenerate failed' })
      await refreshAndKeepOpen()
    }
  }

  const handleApprove = async () => {
    if (state.kind !== 'editable') return
    // First save any edits, then approve
    setState({ kind: 'saving', draft: state.draft })
    try {
      // Save current edits inline
      await fetch(`/api/outbound/drafts/${state.draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: state.subject, body_text: state.body }),
      })

      const r = await fetch(`/api/outbound/drafts/${state.draft.id}/approve`, {
        method: 'POST',
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Approve failed')

      success('Email approved and queued for sending')
      // Invalidate stats + prospects so the counts move
      await queryClient.invalidateQueries({ queryKey: ['outbound', 'stats', agentId] })
      await queryClient.invalidateQueries({ queryKey: ['outbound', 'prospects', agentId] })
      onClose()
    } catch (err) {
      error((err as Error).message, { title: 'Approve failed' })
      await refreshAndKeepOpen()
    }
  }

  const handleReject = async () => {
    if (state.kind !== 'editable') return
    setState({ kind: 'saving', draft: state.draft })
    try {
      const r = await fetch(`/api/outbound/drafts/${state.draft.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'manual_discard' }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Reject failed')
      success('Draft discarded')
      await queryClient.invalidateQueries({ queryKey: ['outbound', 'stats', agentId] })
      await queryClient.invalidateQueries({ queryKey: ['outbound', 'prospects', agentId] })
      onClose()
    } catch (err) {
      error((err as Error).message, { title: 'Discard failed' })
      await refreshAndKeepOpen()
    }
  }

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {state.kind === 'loading' && (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading draft…</div>
        )}

        {state.kind === 'empty' && (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No draft yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drafts appear after enrichment + composition. Try refreshing in a few seconds.
            </p>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="py-12 text-center text-sm text-destructive">{state.message}</div>
        )}

        {(state.kind === 'editable' || state.kind === 'saving') && (
          <>
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center gap-2">
                  <span>
                    Draft for{' '}
                    {state.kind === 'editable' || state.kind === 'saving'
                      ? state.draft.lead_full_name || state.draft.recipient_name || state.draft.recipient_email
                      : ''}
                  </span>
                  <Badge variant="info" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </div>
              </SheetTitle>
              <SheetDescription>
                {state.kind === 'editable' || state.kind === 'saving'
                  ? `${state.draft.lead_job_title ?? ''}${state.draft.lead_job_title ? ' at ' : ''}${state.draft.lead_company_name ?? ''}`
                  : ''}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              <FormField>
                <FormLabel htmlFor="draft-subject">Subject</FormLabel>
                <FormInput
                  id="draft-subject"
                  type="text"
                  value={state.kind === 'editable' ? state.subject : ''}
                  disabled={state.kind === 'saving'}
                  onChange={e =>
                    state.kind === 'editable' &&
                    setState({ ...state, subject: e.target.value })
                  }
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="draft-body">Body</FormLabel>
                <FormTextarea
                  id="draft-body"
                  rows={14}
                  value={state.kind === 'editable' ? state.body : ''}
                  disabled={state.kind === 'saving'}
                  onChange={e =>
                    state.kind === 'editable' &&
                    setState({ ...state, body: e.target.value })
                  }
                />
              </FormField>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={state.kind === 'saving'}
                onClick={handleReject}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Discard
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={state.kind === 'saving'}
                onClick={handleRegenerate}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Regenerate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={state.kind === 'saving'}
                onClick={handleSaveEdit}
              >
                <Edit3 className="h-4 w-4 mr-1.5" />
                Save edits
              </Button>
              <Button
                type="button"
                size="sm"
                loading={state.kind === 'saving'}
                disabled={state.kind === 'saving'}
                onClick={handleApprove}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Approve &amp; send
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}
