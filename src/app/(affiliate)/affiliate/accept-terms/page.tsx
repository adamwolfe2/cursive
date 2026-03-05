'use client'

/**
 * /affiliate/accept-terms — Agreement acceptance gate
 * Shown before portal if agreementAcceptedAt is null
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, CheckCircle2 } from 'lucide-react'

export default function AcceptTermsPage() {
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleAccept() {
    if (!agreed) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/affiliate/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: 'v1.0' }),
      })
      if (!res.ok) throw new Error('Failed to accept terms')
      router.push('/affiliate/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
            <FileText size={18} className="text-zinc-600" />
          </div>
          <div>
            <h1 className="text-[16px] font-semibold text-zinc-900">One more step</h1>
            <p className="text-[12px] text-zinc-500">Review and accept the partner agreement</p>
          </div>
        </div>

        <p className="text-[14px] text-zinc-600 leading-relaxed mb-6">
          Before you access your affiliate dashboard, please review and accept the Cursive Partner Program
          Agreement. This covers commissions, payouts, FTC disclosure requirements, and prohibited conduct.
        </p>

        <div className="bg-zinc-50 rounded-lg p-4 mb-6">
          <Link
            href="/affiliates/terms"
            target="_blank"
            className="flex items-center gap-2 text-[13px] text-zinc-700 hover:text-zinc-900 font-medium"
          >
            <FileText size={14} />
            Read the Partner Program Agreement
            <span className="text-zinc-400 text-[11px] ml-auto">opens in new tab</span>
          </Link>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-zinc-900 cursor-pointer"
          />
          <span className="text-[13px] text-zinc-700 leading-relaxed">
            I have read and agree to the Cursive Partner Program Terms (Version 1.0, effective March 4, 2026)
          </span>
        </label>

        {error && (
          <p className="mb-4 text-[12px] text-red-600">{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={!agreed || submitting}
          className="w-full h-11 bg-zinc-900 text-white text-[14px] font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            'Saving...'
          ) : (
            <>
              <CheckCircle2 size={15} />
              Continue to Dashboard
            </>
          )}
        </button>
      </div>
    </div>
  )
}
