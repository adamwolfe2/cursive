'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'

interface Lead {
  id: string
  company_name: string
  company_industry: string
  company_location: { state: string; country: string }
  email: string
  first_name: string
  last_name: string
  job_title: string
  created_at: string
  workspace_id: string
}

interface Purchase {
  id: string
  lead_id: string
  price_paid: number
  purchased_at: string
}

export default function MarketplacePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showCancelMessage, setShowCancelMessage] = useState(false)

  const supabase = createClient()

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('delivery_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setLeads(data)
  }

  const fetchPurchases = async () => {
    const { data } = await supabase
      .from('lead_purchases')
      .select('*')
      .order('purchased_at', { ascending: false })
    if (data) setPurchases(data)
  }

  useEffect(() => {
    fetchLeads()
    fetchPurchases()
    const interval = setInterval(() => {
      fetchLeads()
      fetchPurchases()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Handle Stripe redirect URLs
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const canceled = urlParams.get('canceled')

    if (success === 'true') {
      setShowSuccessMessage(true)
      // Remove URL params
      window.history.replaceState({}, '', '/marketplace')
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }

    if (canceled === 'true') {
      setShowCancelMessage(true)
      // Remove URL params
      window.history.replaceState({}, '', '/marketplace')
      // Hide message after 5 seconds
      setTimeout(() => setShowCancelMessage(false), 5000)
    }
  }, [])

  const openPurchaseModal = (lead: Lead) => {
    setSelectedLead(lead)
    setShowPurchaseModal(true)
  }

  const purchaseLead = async () => {
    if (!selectedLead || !buyerEmail) {
      alert('Please enter your email')
      return
    }

    setIsPurchasing(true)

    try {
      // Create Stripe Checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          buyerEmail,
          buyerName: '', // Optional: can be collected from buyer profile
          companyName: 'Sample Company' // Optional: can be collected from buyer profile
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error: any) {
      alert(`Purchase failed: ${error.message}`)
      setIsPurchasing(false)
    }
  }

  const isPurchased = (leadId: string) => {
    return purchases.some(p => p.lead_id === leadId)
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-[13px] font-medium text-emerald-900">Purchase Successful!</h3>
                <p className="text-[13px] text-emerald-700 mt-1">
                  Your payment has been processed. Lead details have been sent to your email.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="ml-auto text-emerald-600 hover:text-emerald-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Cancel Message */}
          {showCancelMessage && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-[13px] font-medium text-amber-900">Payment Cancelled</h3>
                <p className="text-[13px] text-amber-700 mt-1">
                  Your payment was cancelled. You can try again anytime.
                </p>
              </div>
              <button
                onClick={() => setShowCancelMessage(false)}
                className="ml-auto text-amber-600 hover:text-amber-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-semibold text-zinc-900">Lead Marketplace</h1>
            <div className="flex gap-3">
              <Link
                href="/marketplace/profile"
                className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 inline-flex items-center"
              >
                Buyer Profile
              </Link>
              <Link
                href="/marketplace/history"
                className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 inline-flex items-center"
              >
                Purchase History
              </Link>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-200">
              <h2 className="text-[15px] font-semibold text-zinc-900">Available Leads ({leads.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Company</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Industry</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Location</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Contact</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Price</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 text-[13px] text-zinc-900">{lead.company_name}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-600">{lead.company_industry || 'N/A'}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-600">
                        {lead.company_location?.state || 'N/A'}, {lead.company_location?.country || 'US'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-zinc-900">
                        {lead.first_name || 'Unknown'} {lead.last_name || ''}
                        <br />
                        <span className="text-[12px] text-zinc-500">{lead.job_title || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-zinc-900">$50.00</td>
                      <td className="px-4 py-3">
                        {isPurchased(lead.id) ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-medium">
                            Purchased
                          </span>
                        ) : (
                          <button
                            onClick={() => openPurchaseModal(lead)}
                            className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150"
                          >
                            Purchase
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Purchase Modal */}
        {showPurchaseModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-6 max-w-md w-full mx-4">
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Purchase Lead</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-[13px] text-zinc-600">Company:</span>
                  <span className="text-[13px] text-zinc-900 font-medium">{selectedLead.company_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[13px] text-zinc-600">Industry:</span>
                  <span className="text-[13px] text-zinc-900">{selectedLead.company_industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[13px] text-zinc-600">Price:</span>
                  <span className="text-[13px] text-zinc-900 font-semibold">$50.00</span>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[13px] font-medium text-zinc-900 mb-2">Your Email</label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full h-9 border border-zinc-300 rounded-lg px-3 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  placeholder="buyer@company.com"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={purchaseLead}
                  disabled={isPurchasing || !buyerEmail}
                  className="flex-1 h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPurchasing ? 'Redirecting to Checkout...' : 'Confirm Purchase'}
                </button>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false)
                    setSelectedLead(null)
                    setBuyerEmail('')
                    setIsPurchasing(false)
                  }}
                  disabled={isPurchasing}
                  className="flex-1 h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
