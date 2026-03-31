'use client'

import { useState, useCallback } from 'react'
import { Copy, Loader2, Mail, RefreshCw, Eye } from 'lucide-react'

interface PortalLinkSectionProps {
  clientId: string
  initialPortalInviteSentAt: string | null
  primaryContactEmail: string
}

const PREVIEW_EMAIL = 'adamwolfe102@gmail.com'

export default function PortalLinkSection({
  clientId,
  initialPortalInviteSentAt,
  primaryContactEmail,
}: PortalLinkSectionProps) {
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [sendError, setSendError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [portalInviteSentAt, setPortalInviteSentAt] = useState(initialPortalInviteSentAt)

  const alreadySent = !!portalInviteSentAt

  const callSendInvite = useCallback(async (testEmail?: string) => {
    const res = await fetch('/api/admin/portal/send-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, ...(testEmail ? { testEmail } : {}) }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to send portal invite')
    return data
  }, [clientId])

  const handleSend = useCallback(async () => {
    setSendStatus('sending')
    setSendError(null)
    try {
      const data = await callSendInvite()
      setPortalUrl(data.portalUrl ?? null)
      setPortalInviteSentAt(new Date().toISOString())
      setSendStatus('sent')
    } catch (err) {
      setSendStatus('error')
      setSendError(err instanceof Error ? err.message : 'Network error — please try again')
    }
  }, [callSendInvite])

  const handlePreview = useCallback(async () => {
    setPreviewStatus('sending')
    setSendError(null)
    try {
      const data = await callSendInvite(PREVIEW_EMAIL)
      setPortalUrl(data.portalUrl ?? null)
      setPreviewStatus('sent')
    } catch (err) {
      setPreviewStatus('error')
      setSendError(err instanceof Error ? err.message : 'Network error — please try again')
    }
  }, [callSendInvite])

  const handleCopy = useCallback(async () => {
    if (!portalUrl) return
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      // Clipboard not available
    }
  }, [portalUrl])

  const sentDate = portalInviteSentAt
    ? new Date(portalInviteSentAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const isBusy = sendStatus === 'sending' || previewStatus === 'sending'

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Client Portal</h3>
          {alreadySent && sentDate && sendStatus !== 'sent' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Portal sent on {sentDate}
            </p>
          )}
          {sendStatus === 'sent' && (
            <p className="text-xs text-green-600 mt-0.5">
              Portal link sent to {primaryContactEmail}
            </p>
          )}
          {previewStatus === 'sent' && sendStatus !== 'sent' && (
            <p className="text-xs text-blue-600 mt-0.5">
              Preview sent to {PREVIEW_EMAIL}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Preview button — sends to Adam's email, doesn't mark as sent */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={isBusy}
            title={`Send a preview to ${PREVIEW_EMAIL}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
          >
            {previewStatus === 'sending' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            Preview
          </button>

          {/* Real send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
          >
            {sendStatus === 'sending' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : alreadySent ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Resend Portal
              </>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5" />
                Send Portal Email
              </>
            )}
          </button>
        </div>
      </div>

      {(sendStatus === 'error' || previewStatus === 'error') && sendError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {sendError}
        </div>
      )}

      {portalUrl && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={portalUrl}
            className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-mono text-gray-600 outline-none min-w-0"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap shrink-0"
          >
            <Copy className="h-3.5 w-3.5" />
            {copySuccess ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  )
}
