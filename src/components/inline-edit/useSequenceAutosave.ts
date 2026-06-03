'use client'

// Debounced autosave hook for inline sequence edits.
//
// Two callers:
//   - Admin SequenceReview (endpoint: /api/admin/onboarding/[id]/sequences)
//   - Client ClientPortal  (endpoint: /api/portal/[token]/sequences)
//
// Both hit the same shared service; this hook just batches keystrokes,
// fires the PATCH with the current expected_updated_at, and surfaces a
// status + last-saved-at to the UI.
//
// Why not react-query: only one mutation per field + we need to chain the
// returned updated_at into the next call. A purpose-built hook is ~80 LOC
// vs ~150 of react-query glue.

import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus =
  | 'idle'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'error'
  | 'locked'
  | 'conflict'

export interface SaveResponse {
  ok: boolean
  updated_at?: string
  warnings?: unknown
  error?: string
  status?: string
  current_updated_at?: string
  current_draft_sequences?: unknown
}

export interface UseSequenceAutosaveOptions {
  /** PATCH endpoint that accepts the shared sequence-edit body shape. */
  endpoint: string
  sequenceIndex: number
  emailStep: number
  field: 'subject_line' | 'body'
  initialValue: string
  /** The client's current updated_at the editor last saw. Updated on success. */
  expectedUpdatedAt: string
  onUpdatedAt?: (next: string) => void
  /** Called with the conflict's current draft state so the parent can refresh. */
  onConflict?: (payload: {
    updated_at: string
    draft_sequences: unknown
  }) => void
  /** Disable saves entirely (post-deploy lock, processing, etc.). */
  disabled?: boolean
  /** Debounce ms between last keystroke and PATCH fire. */
  debounceMs?: number
}

export function useSequenceAutosave(opts: UseSequenceAutosaveOptions) {
  const {
    endpoint,
    sequenceIndex,
    emailStep,
    field,
    initialValue,
    expectedUpdatedAt,
    onUpdatedAt,
    onConflict,
    disabled = false,
    debounceMs = 1500,
  } = opts

  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  // Keep mutable refs of the latest values so the debounced fn always uses
  // current state without re-creating itself per render (would otherwise
  // reset the timer on every keystroke).
  const valueRef = useRef(value)
  const expectedRef = useRef(expectedUpdatedAt)
  const lastSavedValueRef = useRef(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)

  // Track external updates to initialValue (e.g. after regenerate copy
  // replaces the email body) so we don't autosave a stale buffer back.
  useEffect(() => {
    setValue(initialValue)
    valueRef.current = initialValue
    lastSavedValueRef.current = initialValue
    setStatus('idle')
    setErrorMessage(null)
  }, [initialValue])

  useEffect(() => {
    expectedRef.current = expectedUpdatedAt
  }, [expectedUpdatedAt])

  const fire = useCallback(async () => {
    if (disabled) return
    if (inFlightRef.current) return
    const next = valueRef.current
    if (next === lastSavedValueRef.current) {
      setStatus('idle')
      return
    }

    inFlightRef.current = true
    setStatus('saving')
    setErrorMessage(null)

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence_index: sequenceIndex,
          email_step: emailStep,
          field,
          value: next,
          expected_updated_at: expectedRef.current,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as SaveResponse

      if (res.ok && json.ok) {
        lastSavedValueRef.current = next
        if (json.updated_at) {
          expectedRef.current = json.updated_at
          onUpdatedAt?.(json.updated_at)
        }
        setLastSavedAt(Date.now())
        setStatus('saved')
        return
      }

      if (res.status === 423) {
        setStatus('locked')
        setErrorMessage(json.error || 'Editing is locked for this campaign.')
        return
      }

      if (res.status === 409) {
        setStatus('conflict')
        setErrorMessage(
          json.error ||
            'This copy was updated elsewhere. Reload to pick up the latest version.'
        )
        if (json.current_updated_at && json.current_draft_sequences) {
          onConflict?.({
            updated_at: json.current_updated_at,
            draft_sequences: json.current_draft_sequences,
          })
        }
        return
      }

      setStatus('error')
      setErrorMessage(json.error || `Save failed (HTTP ${res.status}).`)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Network error.')
    } finally {
      inFlightRef.current = false
    }
  }, [
    disabled,
    endpoint,
    sequenceIndex,
    emailStep,
    field,
    onUpdatedAt,
    onConflict,
  ])

  const onChange = useCallback(
    (next: string) => {
      valueRef.current = next
      setValue(next)
      if (disabled) return
      if (next === lastSavedValueRef.current) {
        setStatus('idle')
        return
      }
      setStatus('pending')
      setErrorMessage(null)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        void fire()
      }, debounceMs)
    },
    [disabled, debounceMs, fire]
  )

  // Flush on unmount so a quick edit + tab close doesn't lose the buffer.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
        void fire()
      }
    }
    // We intentionally only run the cleanup once (deps = []); fire is
    // stable via useCallback with up-to-date refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    value,
    status,
    errorMessage,
    lastSavedAt,
    onChange,
    /** Force-flush the pending debounce. */
    flush: fire,
  }
}
