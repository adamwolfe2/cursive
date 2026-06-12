'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Eraser, Loader2, ShieldCheck } from 'lucide-react'
import { AGREEMENT_SECTIONS, AGREEMENT_VERSION } from '@/lib/affiliate/agreement'

export function SignatureClient() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)

  const [name, setName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    drawing.current = true
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const move = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#0b1220'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    hasDrawn.current = true
  }, [])

  const end = useCallback(() => {
    drawing.current = false
  }, [])

  const clear = useCallback(() => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height)
    hasDrawn.current = false
  }, [])

  const submit = useCallback(async () => {
    setError(null)
    if (name.trim().length < 2) return setError('Enter your full legal name.')
    if (!hasDrawn.current) return setError('Please draw your signature.')
    if (!agreed) return setError('You must confirm you agree to the terms.')

    const dataUrl = canvasRef.current?.toDataURL('image/png') || ''
    setSubmitting(true)
    try {
      const res = await fetch('/api/affiliate/sign-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName: name.trim(), signatureSvg: dataUrl, agreed: true }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Could not record signature.')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }, [name, agreed, router])

  return (
    <div className="space-y-6">
      {/* Agreement body */}
      <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">
          Cursive Outbound Distribution Partner Agreement
        </h2>
        <p className="mb-4 text-xs text-gray-400">Version {AGREEMENT_VERSION}</p>
        <div className="space-y-4">
          {AGREEMENT_SECTIONS.map((s) => (
            <div key={s.id}>
              <h3 className="text-sm font-semibold text-gray-900">{s.heading}</h3>
              {s.body.map((p, i) => (
                <p key={i} className="mt-1 text-sm leading-relaxed text-gray-600">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Signing controls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="signer" className="mb-1 block text-sm font-medium text-gray-700">
              Full legal name
            </label>
            <input
              id="signer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Smith"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Signature</span>
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
              >
                <Eraser className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={460}
              height={130}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className="w-full cursor-crosshair touch-none rounded-lg border border-dashed border-gray-300 bg-gray-50"
            />
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span>
            I have read and agree to the Cursive Outbound Distribution Partner Agreement. I understand
            this electronic signature is legally binding.
          </span>
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {submitting ? 'Recording…' : 'Sign & activate payouts'}
        </button>
      </div>
    </div>
  )
}
