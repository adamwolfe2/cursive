'use client'

// Inline editor for a single sequence email (subject + body).
//
// Used inside both Preview tabs (admin SequenceReview, client ClientPortal)
// as an alternative tab. Edits are raw text (no rendered preview) so the
// user can see and modify spintax {a|b|c} and EmailBison merge tags
// ({FIRST_NAME}, {COMPANY}, etc.) directly.
//
// Autosave is debounced via useSequenceAutosave. The save status row at
// the bottom of the editor surfaces:
//   - "Saving..." while in flight
//   - "Saved Ns ago" after a successful save
//   - "Edit locked: …" if the campaign is deployed / regen is running
//   - "Conflict: …" if another writer beat us (with Reload action)
//   - Error message + retry for any other failure
//
// Lock policy: when `locked` is true the textareas are read-only and a
// banner explains why. When `regenerating` is true editing is paused
// (would be clobbered when the rewrite lands) but the textareas stay
// visible so the user knows what they had.

import { useEffect, useMemo, useState } from 'react'
import { useSequenceAutosave } from './useSequenceAutosave'

export type LockReason =
  | { kind: 'none' }
  | { kind: 'deployed' }
  | { kind: 'regenerating' }

interface InlineEmailEditorProps {
  endpoint: string
  sequenceIndex: number
  emailStep: number
  /** Source of truth for the current persisted values (parent owns reload). */
  initialSubject: string
  initialBody: string
  /** Editor's last-seen client updated_at; bumped on every save. */
  expectedUpdatedAt: string
  onUpdatedAt: (next: string) => void
  onConflict?: (payload: {
    updated_at: string
    draft_sequences: unknown
  }) => void
  lockReason: LockReason
}

export default function InlineEmailEditor({
  endpoint,
  sequenceIndex,
  emailStep,
  initialSubject,
  initialBody,
  expectedUpdatedAt,
  onUpdatedAt,
  onConflict,
  lockReason,
}: InlineEmailEditorProps) {
  const disabled = lockReason.kind !== 'none'

  const subject = useSequenceAutosave({
    endpoint,
    sequenceIndex,
    emailStep,
    field: 'subject_line',
    initialValue: initialSubject,
    expectedUpdatedAt,
    onUpdatedAt,
    onConflict,
    disabled,
  })

  const body = useSequenceAutosave({
    endpoint,
    sequenceIndex,
    emailStep,
    field: 'body',
    initialValue: initialBody,
    expectedUpdatedAt,
    onUpdatedAt,
    onConflict,
    disabled,
  })

  // Combined status — the worst of the two fields drives the banner.
  const combinedStatus = pickWorseStatus(subject.status, body.status)
  const combinedError = subject.errorMessage || body.errorMessage
  const lastSavedAt = Math.max(subject.lastSavedAt ?? 0, body.lastSavedAt ?? 0)

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {disabled && <LockBanner reason={lockReason} />}

      <div className="space-y-3 p-4">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Subject (raw — merge tags + spintax visible)
          </label>
          <input
            type="text"
            value={subject.value}
            onChange={(e) => subject.onChange(e.target.value)}
            disabled={disabled}
            spellCheck={false}
            className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="e.g. the meta ads situation at {COMPANY}"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Body (raw — merge tags + spintax visible)
          </label>
          <textarea
            value={body.value}
            onChange={(e) => body.onChange(e.target.value)}
            disabled={disabled}
            spellCheck={false}
            rows={12}
            className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm leading-relaxed text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder={
              'Hi {FIRST_NAME},\n\nYour opener line referencing {COMPANY}...\n\n...'
            }
          />
        </div>

        <StatusRow
          status={combinedStatus}
          errorMessage={combinedError}
          lastSavedAt={lastSavedAt}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function LockBanner({ reason }: { reason: LockReason }) {
  if (reason.kind === 'deployed') {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        <span className="font-semibold">Edit locked.</span> Campaigns have
        already been pushed to EmailBison. To change the live copy, edit it
        directly inside EmailBison — changes here won&apos;t propagate to
        scheduled or sent emails.
      </div>
    )
  }
  if (reason.kind === 'regenerating') {
    return (
      <div className="border-b border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
        <span className="font-semibold">Editing paused.</span> A copy
        regeneration is in progress and would overwrite your edits when it
        completes. Try again in a moment.
      </div>
    )
  }
  return null
}

function StatusRow({
  status,
  errorMessage,
  lastSavedAt,
  disabled,
}: {
  status: ReturnType<typeof pickWorseStatus>
  errorMessage: string | null
  lastSavedAt: number
  disabled: boolean
}) {
  const tick = useTick(15_000)
  const since = useMemo(() => {
    if (!lastSavedAt) return null
    return formatRelative(Date.now() - lastSavedAt)
    // tick deps re-evaluates the relative time every 15s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSavedAt, tick])

  if (disabled) {
    return (
      <p className="text-[11px] text-gray-400">
        Editing disabled — see banner above.
      </p>
    )
  }
  if (status === 'saving') {
    return (
      <p className="inline-flex items-center gap-1.5 text-[11px] text-blue-700">
        <Spinner /> Saving…
      </p>
    )
  }
  if (status === 'pending') {
    return <p className="text-[11px] text-gray-400">Unsaved changes…</p>
  }
  if (status === 'saved') {
    return (
      <p className="text-[11px] text-emerald-700">
        Saved{since ? ` ${since}` : ''}.
      </p>
    )
  }
  if (status === 'conflict') {
    return (
      <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
        {errorMessage ||
          'This copy was updated elsewhere — reload to pick up the latest.'}
      </p>
    )
  }
  if (status === 'locked') {
    return (
      <p className="text-[11px] text-amber-800">
        {errorMessage || 'Editing locked.'}
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
        {errorMessage ||
          'Save failed. Your edits are still in the field — try editing again to retry.'}
      </p>
    )
  }
  return (
    <p className="text-[11px] text-gray-400">
      Edits autosave 1.5s after you stop typing.
    </p>
  )
}

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

// "saved 12s ago" formatter — short and unobtrusive.
function formatRelative(ms: number): string {
  if (ms < 5_000) return 'just now'
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`
  return `${Math.round(ms / 3_600_000)}h ago`
}

// Tiny tick hook to refresh "saved Ns ago" labels without a global timer.
function useTick(intervalMs: number) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setN((v) => v + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return n
}

const STATUS_RANK: Record<string, number> = {
  error: 5,
  conflict: 4,
  locked: 3,
  saving: 2,
  pending: 1,
  saved: 0,
  idle: 0,
}

function pickWorseStatus(
  a: ReturnType<typeof useSequenceAutosave>['status'],
  b: ReturnType<typeof useSequenceAutosave>['status']
): ReturnType<typeof useSequenceAutosave>['status'] {
  return (STATUS_RANK[a] ?? 0) >= (STATUS_RANK[b] ?? 0) ? a : b
}
