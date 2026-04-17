'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalInlineEmbed } from '@/components/ui/cal-inline-booking'
import type { SampleStreamPerson } from '@/lib/copilot/types'
import type { UnmaskedSamplePerson } from './SampleLeadList'

const CAL_NAMESPACE = '30min'

interface CalBookingInlineProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sampleViewId: string | null
  token: string | null
  prefillEmail?: string
  prefillName?: string
  onBooked: (data: {
    revealedCount: number
    reveals: UnmaskedSamplePerson[]
    stillMasked: SampleStreamPerson[]
    exportAllowed: boolean
  }) => void
}

/**
 * Cal.com inline booking in a Dialog. After the
 * `bookingSuccessful` event fires, we ping `/api/public/copilot/reveal`
 * with `trigger: 'call_booked'` to promote the lead to tier 2.
 *
 * If there's no sampleViewId (user books outside a sample context) we
 * skip the reveal call — the Cal.com webhook on the backend still fires
 * regardless, this is just the inline UX nicety.
 */
export function CalBookingInline({
  open,
  onOpenChange,
  sampleViewId,
  token,
  prefillEmail,
  prefillName,
  onBooked,
}: CalBookingInlineProps) {
  const [status, setStatus] = useState<'idle' | 'revealing' | 'done' | 'error'>(
    'idle'
  )
  const [error, setError] = useState<string | null>(null)
  const revealOnceRef = useRef(false)

  // Reset when the modal closes
  useEffect(() => {
    if (!open) {
      setStatus('idle')
      setError(null)
      revealOnceRef.current = false
    }
  }, [open])

  // Call reveal endpoint to promote tier 2
  const promoteAfterBooking = useCallback(async () => {
    if (!sampleViewId || !token) {
      // Nothing to promote — just close.
      setStatus('done')
      return
    }
    if (revealOnceRef.current) return
    revealOnceRef.current = true

    setStatus('revealing')
    setError(null)

    try {
      const res = await fetch('/api/public/copilot/reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sample_view_id: sampleViewId,
          trigger: 'call_booked',
        }),
      })

      if (!res.ok) {
        let message = `Unlock failed (${res.status}).`
        try {
          const body = await res.json()
          if (body?.message) message = body.message
        } catch {
          /* noop */
        }
        setError(message)
        setStatus('error')
        return
      }

      const data = await res.json()
      if (!data?.success) {
        setError('Something went wrong finalizing the unlock.')
        setStatus('error')
        return
      }

      onBooked({
        revealedCount: Number(data.revealed_count ?? 0),
        reveals: Array.isArray(data.reveals) ? data.reveals : [],
        stillMasked: Array.isArray(data.still_masked) ? data.still_masked : [],
        exportAllowed: Boolean(data.export_allowed),
      })
      setStatus('done')
    } catch {
      setError('Network error finalizing the unlock.')
      setStatus('error')
    }
  }, [sampleViewId, token, onBooked])

  // Wire up Cal.com booking-confirmed listener
  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined') return

    let tries = 0
    let interval: ReturnType<typeof setInterval> | null = null

    const handler = () => {
      void promoteAfterBooking()
    }

    const attach = () => {
      const w = window as unknown as {
        Cal?: {
          ns?: Record<string, ((...args: unknown[]) => unknown) | undefined>
        }
      }
      const ns = w.Cal?.ns?.[CAL_NAMESPACE]
      if (typeof ns !== 'function') return false

      // Cal exposes several booking events; bookingSuccessful is the most
      // reliable "user completed the booking" signal.
      ns('on', {
        action: 'bookingSuccessful',
        callback: handler,
      })
      return true
    }

    // The embed script mounts Cal.ns[CAL_NAMESPACE] asynchronously.
    // Poll briefly until the namespace is ready.
    if (!attach()) {
      interval = setInterval(() => {
        tries += 1
        if (attach() || tries >= 20) {
          if (interval) clearInterval(interval)
        }
      }, 250)
    }

    return () => {
      if (interval) clearInterval(interval)
      // No public off() helper — the handler simply no-ops once the modal
      // remounts the embed. `revealOnceRef` guards against double-firing.
    }
  }, [open, promoteAfterBooking])

  // Build a URL with Cal prefill params appended via the calLink query string.
  // Cal's embed supports ?name=&email= prefill natively.
  const prefillParams = new URLSearchParams()
  if (prefillEmail) prefillParams.set('email', prefillEmail)
  if (prefillName) prefillParams.set('name', prefillName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogTitle className="px-6 pt-5 pb-0 text-lg font-semibold">
          Book a 15-min call
        </DialogTitle>

        {status === 'revealing' && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] text-blue-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Finalizing your unlock…
          </div>
        )}

        {status === 'error' && error && (
          <div className="mx-6 mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error} Your call is still booked — just refresh to see the unlocked leads.</span>
          </div>
        )}

        {open && (
          <div className="px-4 pb-4 pt-2">
            <CalInlineEmbed height={620} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
