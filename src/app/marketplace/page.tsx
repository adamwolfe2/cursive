'use client'

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

  const openPurchaseModal = (lead: Lead) => {
    setSelectedLead(lead)
    setShowPurchaseModal(true)
  }

  const purchaseLead = async () => {
    if (!selectedLead || !buyerEmail) {
      alert('Please enter your email')
      return
    }

    // Check if buyer exists, create if not
    let { data: buyer } = await supabase
      .from('buyers')
      .select('*')
      .eq('email', buyerEmail)
      .single()

    if (!buyer) {
      const { data: newBuyer } = await supabase
        .from('buyers')
        .insert({
          email: buyerEmail,
          company_name: 'Sample Company',
          workspace_id: selectedLead.workspace_id
        })
        .select()
        .single()
      buyer = newBuyer
    }

    if (!buyer) {
      alert('Failed to create buyer profile')
      return
    }

    // Create purchase
    const { error } = await supabase
      .from('lead_purchases')
      .insert({
        lead_id: selectedLead.id,
        buyer_id: buyer.id,
        price_paid: 50.00
      })

    if (error) {
      alert(`Purchase failed: ${error.message}`)
      return
    }

    // Update lead delivery status
    await supabase
      .from('leads')
      .update({ delivery_status: 'delivered' })
      .eq('id', selectedLead.id)

    alert('Purchase successful! Lead data emailed to you.')
    setShowPurchaseModal(false)
    setSelectedLead(null)
    setBuyerEmail('')
    fetchLeads()
    fetchPurchases()
  }

  const isPurchased = (leadId: string) => {
    return purchases.some(p => p.lead_id === leadId)
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
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
                  className="flex-1 h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150"
                >
                  Confirm Purchase
                </button>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false)
                    setSelectedLead(null)
                    setBuyerEmail('')
                  }}
                  className="flex-1 h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150"
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
