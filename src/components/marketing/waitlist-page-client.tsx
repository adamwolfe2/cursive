'use client'

import Image from 'next/image'
import { useState } from 'react'
import { WaitlistForm } from '@/components/marketing/waitlist-form'
import { useRouter } from 'next/navigation'

export function WaitlistPageClient() {
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminError('')
    setIsLoggingIn(true)

    try {
      const response = await fetch('/api/admin/bypass-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        setAdminError(data.error || 'Invalid password')
        return
      }

      // Redirect to login page
      router.push('/login')
    } catch {
      setAdminError('Network error. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <Image
              src="/cursive-logo.png"
              alt="Cursive"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-lg font-semibold text-zinc-900">Cursive</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-6 py-12">
        <div className="max-w-sm mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center text-sm text-blue-600 font-medium">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
              Coming Soon
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-semibold text-zinc-900 text-center mb-3">
            Free High-Intent Leads for Your Industry
          </h1>

          {/* Subheadline */}
          <p className="text-sm text-zinc-600 text-center mb-8">
            We deliver verified buyers actively searching for solutions in your vertical. No cost, no contracts.
          </p>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <WaitlistForm source="waitlist-page" />
          </div>

          {/* Footer */}
          <p className="text-xs text-zinc-400 text-center mt-6">
            Questions? hello@meetcursive.com
          </p>

          {/* Admin Login Link */}
          <div className="text-center mt-4">
            <button
              onClick={() => setShowAdminLogin(true)}
              className="text-xs text-zinc-300 hover:text-zinc-400 transition-colors"
            >
              Admin Login
            </button>
          </div>
        </div>
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Admin Login</h2>
              <button
                onClick={() => {
                  setShowAdminLogin(false)
                  setAdminPassword('')
                  setAdminError('')
                }}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              {adminError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {adminError}
                </div>
              )}

              <div>
                <label htmlFor="admin_password" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Password
                </label>
                <input
                  id="admin_password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn || !adminPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoggingIn ? 'Verifying...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
