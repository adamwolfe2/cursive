'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Building2, Upload } from 'lucide-react'

type UserRole = 'business' | 'partner' | null

export default function WelcomeForm({ isMarketplace }: { isMarketplace: boolean }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Role selection
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)

  // Business fields
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')

  // Partner fields
  const [companyName, setCompanyName] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (selectedRole === 'business') {
        if (!businessName || !industry) {
          throw new Error('Please fill in all fields')
        }
      } else if (selectedRole === 'partner') {
        if (!companyName) {
          throw new Error('Please enter your company name')
        }
      }

      // Call API route (uses admin client server-side, bypasses RLS)
      const payload = selectedRole === 'business'
        ? { role: 'business', businessName, industry }
        : { role: 'partner', companyName }

      const res = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      // Handle 409 (user already has workspace) by redirecting to dashboard
      if (res.status === 409 && data.workspace_id) {
        const redirectTo = isMarketplace ? '/marketplace' : '/dashboard'
        router.push(redirectTo)
        router.refresh()
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      // Free credits are now granted synchronously in the onboarding API route

      // Redirect based on signup source
      const redirectTo = isMarketplace ? '/marketplace' : '/dashboard'
      router.push(redirectTo)
      router.refresh()

    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image src="/cursive-logo.png" alt="Cursive" width={90} height={90} priority />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Cursive</h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's get you set up in less than a minute
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!selectedRole ? (
          // Step 1: Role Selection
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-gray-700">
              What brings you here?
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setSelectedRole('business')}
                className="group relative overflow-hidden bg-white rounded-xl border-2 border-gray-200 p-6 text-left shadow-sm hover:shadow-lg hover:border-primary/80 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  I'm a Business
                </h3>
                <p className="text-sm text-gray-600">
                  Looking to buy leads and grow my business
                </p>
              </button>

              <button
                onClick={() => setSelectedRole('partner')}
                className="group relative overflow-hidden bg-white rounded-xl border-2 border-gray-200 p-6 text-left shadow-sm hover:shadow-lg hover:border-emerald-400 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  I'm a Partner
                </h3>
                <p className="text-sm text-gray-600">
                  I want to upload and sell leads
                </p>
              </button>
            </div>
          </div>
        ) : (
          // Step 2: Role-specific form
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
              {selectedRole === 'business' ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Business Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm"
                        placeholder="Acme Roofing Co."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry
                      </label>
                      <select
                        required
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm"
                      >
                        <option value="">Select industry</option>
                        <option value="HVAC">HVAC</option>
                        <option value="Roofing">Roofing</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Solar">Solar</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Home Services">Home Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Partner Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-emerald-600 sm:text-sm"
                      placeholder="Your Company LLC"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                disabled={submitting}
                className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Creating account...' : 'Get Started'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
