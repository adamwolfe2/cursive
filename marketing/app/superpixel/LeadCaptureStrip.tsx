'use client'
import { useState } from 'react'

export function LeadCaptureStrip() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim() || undefined,
          source: 'superpixel_email_capture',
          timestamp: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-[#007AFF]/8 border border-[#007AFF]/20 rounded-2xl px-8 py-10 text-center max-w-2xl mx-auto">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">You're in — check your inbox.</h3>
        <p className="text-gray-500 text-sm">
          We'll send you 10 sample leads from your industry + a breakdown of what the Super Pixel would find on your site.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl px-8 py-10 max-w-2xl mx-auto text-center">
      <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-3">Not ready to book a call?</p>
      <h3 className="text-2xl font-semibold text-white mb-2">
        Get 10 free sample leads from your industry first.
      </h3>
      <p className="text-gray-400 text-sm mb-7 max-w-md mx-auto">
        Drop your email and we'll send you real, verified leads matching your ICP — so you can see exactly what the Super Pixel delivers before you commit to anything.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
        <input
          type="text"
          placeholder="First name (optional)"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          className="flex-none w-full sm:w-36 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#007AFF] transition-colors"
        />
        <input
          type="email"
          required
          placeholder="Work email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#007AFF] transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex-none px-6 py-3 bg-[#007AFF] hover:bg-[#0066DD] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors whitespace-nowrap"
        >
          {loading ? 'Sending...' : 'Send My Leads →'}
        </button>
      </form>
      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      <p className="text-gray-600 text-xs mt-4">No credit card. No spam. Just leads.</p>
    </div>
  )
}
