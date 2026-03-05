'use client'

/**
 * Cal.com Inline Booking Components
 *
 * CalInlineEmbed  — renders the Cal.com embed directly in the page
 * CalBookingModal — wraps the embed in a Dialog
 * BookDemoButton  — a button that opens the CalBookingModal
 *
 * Usage:
 *   <BookDemoButton />
 *   <BookDemoButton className="..." label="Schedule a Call" />
 *   <CalInlineEmbed />                // full-page inline embed
 *   <CalBookingModal open={open} onOpenChange={setOpen} />
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { getStoredRefCode } from '@/components/affiliate/affiliate-ref-capture'

// ─── Cal.com config ───────────────────────────────────────────────────────────
const CAL_NAMESPACE = '30min'
const CAL_LINK = 'gotdarrenhill/30min'
const CAL_EMBED_URL = 'https://app.cal.com/embed/embed.js'
const CAL_ELEMENT_ID = 'cal-inline-embed'

// ─── CalInlineEmbed ──────────────────────────────────────────────────────────

interface CalInlineEmbedProps {
  /** Height of the embed container. Defaults to 700px */
  height?: number | string
  className?: string
  /** Optional ref code for server-rendered paths where it can be passed directly */
  refCode?: string
}

export function CalInlineEmbed({ height = 700, className, refCode: refCodeProp }: CalInlineEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const initialised = useRef(false)

  useEffect(() => {
    if (initialised.current || !containerRef.current) return
    initialised.current = true

    // Resolve ref code: prop takes priority, then localStorage/sessionStorage/cookie
    const resolvedRef = refCodeProp || getStoredRefCode()

    // Build calLink — append ref as metadata param so Cal passes it through the webhook
    const calLink = resolvedRef
      ? `${CAL_LINK}?metadata[ref]=${encodeURIComponent(resolvedRef)}`
      : CAL_LINK

    // The Cal.com embed mutates window.Cal; guard against duplicate loads
    const initCal = () => {
      const win = window as any

      // Bootstrap the Cal namespace if it hasn't loaded yet
      if (!win.Cal) {
        win.Cal = function (...args: any[]) {
          const cal = win.Cal
          if (!cal.loaded) {
            cal.ns = {}
            cal.q = cal.q || []
            const script = document.createElement('script')
            script.src = CAL_EMBED_URL
            document.head.appendChild(script)
            cal.loaded = true
          }
          if (args[0] === 'init') {
            const api = function (...a: any[]) { api.q.push(a) } as any
            const namespace = args[1]
            api.q = api.q || []
            if (typeof namespace === 'string') {
              cal.ns[namespace] = cal.ns[namespace] || api
              cal.ns[namespace].q = cal.ns[namespace].q || []
              cal.ns[namespace].q.push(args)
              cal.q.push(['initNamespace', namespace])
            } else {
              cal.q.push(args)
            }
            return api
          }
          cal.q.push(args)
        }
        win.Cal.q = win.Cal.q || []
        win.Cal.ns = win.Cal.ns || {}

        // Load the embed script
        const script = document.createElement('script')
        script.src = CAL_EMBED_URL
        script.async = true
        document.head.appendChild(script)
      }

      const Cal = win.Cal

      Cal('init', CAL_NAMESPACE, { origin: 'https://app.cal.com' })

      Cal.ns[CAL_NAMESPACE]?.('inline', {
        elementOrSelector: `#${CAL_ELEMENT_ID}`,
        config: {
          layout: 'month_view',
          useSlotsViewOnSmallScreen: 'true',
          theme: 'light',
        },
        calLink,
      })

      Cal.ns[CAL_NAMESPACE]?.('ui', {
        theme: 'light',
        hideEventTypeDetails: false,
        layout: 'month_view',
      })
    }

    initCal()
  }, [refCodeProp])

  return (
    <div
      ref={containerRef}
      id={CAL_ELEMENT_ID}
      style={{ width: '100%', height, overflow: 'scroll' }}
      className={className}
    />
  )
}

// ─── CalBookingModal ─────────────────────────────────────────────────────────

interface CalBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CalBookingModal({ open, onOpenChange }: CalBookingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogTitle className="px-6 pt-5 pb-0 text-lg font-semibold">
          Book a Demo
        </DialogTitle>
        {open && (
          <div className="px-4 pb-4 pt-2">
            <CalInlineEmbed height={620} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── BookDemoButton ──────────────────────────────────────────────────────────

interface BookDemoButtonProps {
  label?: string
  className?: string
  /** Render as an anchor instead of a button (for SSR/accessibility contexts) */
  variant?: 'button' | 'anchor'
}

export function BookDemoButton({
  label = 'Book a Demo',
  className,
  variant = 'button',
}: BookDemoButtonProps) {
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(true)
  }, [])

  return (
    <>
      {variant === 'anchor' ? (
        <a href="#book-demo" onClick={handleOpen} className={className}>
          {label}
        </a>
      ) : (
        <button type="button" onClick={handleOpen} className={className}>
          {label}
        </button>
      )}
      <CalBookingModal open={open} onOpenChange={setOpen} />
    </>
  )
}
