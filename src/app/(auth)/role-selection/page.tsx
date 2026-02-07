'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Building2, Upload, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function RoleSelectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function selectRole(role: 'business' | 'partner') {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // Store role selection in session storage for onboarding
      sessionStorage.setItem('selected_role', role)

      // Route to appropriate onboarding
      if (role === 'business') {
        router.push('/onboarding')
      } else {
        router.push('/onboarding/partner')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
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
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">
            Welcome to Cursive
          </h1>
          <p className="text-lg text-zinc-600">
            Choose your account type to get started
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Business Card */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectRole('business')}
            disabled={loading}
            className="group relative overflow-hidden bg-white rounded-2xl border-2 border-zinc-200/60 p-8 text-left shadow-sm hover:shadow-xl hover:border-primary/60 transition-all duration-300 disabled:opacity-50"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/5 transition-all duration-300" />

            <div className="relative">
              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/90 text-white shadow-lg mb-6 group-hover:shadow-primary/20 transition-shadow">
                <Building2 className="h-7 w-7" />
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-zinc-900 mb-3">
                I'm a Business
              </h2>
              <p className="text-zinc-600 mb-6 leading-relaxed">
                Looking to buy qualified leads for my business. Get access to the marketplace and CRM.
              </p>

              {/* Features list */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Browse and purchase verified leads</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Full CRM access</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Requires subscription ($29/mo+)</span>
                </li>
              </ul>

              {/* CTA */}
              <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                <span>Get started</span>
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </motion.button>

          {/* Partner Card */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectRole('partner')}
            disabled={loading}
            className="group relative overflow-hidden bg-white rounded-2xl border-2 border-zinc-200/60 p-8 text-left shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 disabled:opacity-50"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-100/0 group-hover:from-emerald-50/50 group-hover:to-emerald-100/30 transition-all duration-300" />

            <div className="relative">
              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg mb-6 group-hover:shadow-emerald-200 transition-shadow">
                <Upload className="h-7 w-7" />
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-zinc-900 mb-3">
                I'm a Partner
              </h2>
              <p className="text-zinc-600 mb-6 leading-relaxed">
                I want to upload and sell leads. Earn 70% commission on every lead sold.
              </p>

              {/* Features list */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>Upload leads via CSV or API</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>70% commission per sale</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>100% free to join and upload</span>
                </li>
              </ul>

              {/* CTA */}
              <div className="flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                <span>Start earning</span>
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-600 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-zinc-500 mt-8">
          Questions?{' '}
          <a href="mailto:hey@meetcursive.com" className="text-primary hover:underline">
            hey@meetcursive.com
          </a>
        </p>
      </div>
    </div>
  )
}
