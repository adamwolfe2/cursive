'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function PartnerOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [companyName, setCompanyName] = useState('')
  const [fullName, setFullName] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const nameParts = fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || firstName

      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'partner',
          firstName,
          lastName,
          email: user.email ?? '',
          companyName: companyName || `${fullName}'s Workspace`,
          partnerType: 'data_provider',
          primaryVerticals: 'general',
          databaseSize: 'unknown',
          linkedin: 'N/A',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete onboarding')
      }

      // Redirect to partner dashboard
      router.push('/partner/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="https://meetcursive.com" className="hover:opacity-80 transition-opacity">
            <Image
              src="/cursive-logo.png"
              alt="Cursive"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </Link>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            Join as a Partner
          </h1>
          <p className="text-zinc-600">
            Upload leads and earn 70% commission on sales
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-zinc-200/60 p-8 shadow-lg"
        >
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 mb-2">
                Your full name *
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full h-11 px-4 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="John Smith"
              />
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700 mb-2">
                Company name <span className="text-zinc-400">(optional)</span>
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-11 px-4 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Acme Lead Gen"
              />
            </div>

            {/* Info box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800 leading-relaxed">
                <strong>Next steps:</strong> After completing setup, you&apos;ll be able to upload leads immediately and start earning 70% commission on every sale.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !fullName}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {loading ? 'Creating account...' : 'Complete setup'}
            </button>
          </div>
        </motion.form>

        {/* Footer */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          Questions about partnership?{' '}
          <a href="mailto:hello@meetcursive.com" className="text-emerald-600 hover:underline">
            hello@meetcursive.com
          </a>
        </p>

        {/* Back link */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.push('/role-selection')}
            className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            ← Back to role selection
          </button>
        </div>
      </div>
    </div>
  )
}
