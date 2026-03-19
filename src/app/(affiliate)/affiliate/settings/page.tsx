'use client'

/**
 * /affiliate/settings — Account settings for affiliates
 */

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { format } from 'date-fns'

function SettingsContent() {
  const searchParams = useSearchParams()
  const stripeConnected = searchParams.get('stripe') === 'connected'
  const { toast } = useToast()

  const { data: affiliate, isLoading, refetch } = useQuery<any>({
    queryKey: ['affiliate', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/affiliate/settings')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  useEffect(() => {
    if (stripeConnected) {
      toast({ type: 'success', message: 'Stripe account connected successfully' })
      refetch()
    }
  }, [stripeConnected, toast, refetch])

  if (isLoading) {
    return <div className="p-12 text-center text-zinc-400">Loading...</div>
  }

  if (!affiliate) return null

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
      </div>

      {/* Stripe Connect */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
        <h2 className="text-[14px] font-semibold text-zinc-900 mb-4">Payout Account</h2>
        {affiliate.stripe_onboarding_complete ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-[13px] font-medium text-emerald-800">Stripe account connected</div>
              <p className="text-[12px] text-emerald-700 mt-0.5">
                Payouts process automatically on the 1st of each month.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[13px] font-medium text-amber-800">Stripe account not connected</div>
                <p className="text-[12px] text-amber-700 mt-0.5">
                  Your earnings are tracked but held until you connect a Stripe account.
                </p>
              </div>
            </div>
            <Link
              href="/api/affiliate/stripe-connect"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-[13px] font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink size={13} />
              Connect Stripe Account
            </Link>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
        <h2 className="text-[14px] font-semibold text-zinc-900 mb-4">Account Info</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Name', value: `${affiliate.first_name} ${affiliate.last_name}` },
            { label: 'Email', value: affiliate.email },
            { label: 'Partner Code', value: affiliate.partner_code },
            { label: 'Member Since', value: format(new Date(affiliate.created_at), 'MMMM d, yyyy') },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-[11px] text-zinc-400 mb-0.5">{f.label}</div>
              <div className="text-[13px] text-zinc-800 font-medium font-mono">{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner terms */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-[14px] font-semibold text-zinc-900 mb-3">Partner Agreement</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] text-zinc-700">Cursive Partner Program Terms — Version 1.0</div>
            {affiliate.agreement_accepted_at && (
              <div className="text-[12px] text-zinc-400 mt-0.5">
                Accepted {format(new Date(affiliate.agreement_accepted_at), 'MMMM d, yyyy')}
              </div>
            )}
          </div>
          <Link
            href="/affiliates/terms"
            target="_blank"
            className="text-[12px] text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
          >
            View <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AffiliateSettingsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-zinc-400">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
