'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'

interface MarketplacePurchase {
  id: string
  total_leads: number
  total_price: number
  payment_method: string
  credits_used: number
  status: string
  created_at: string
  completed_at: string | null
}

interface PurchasedLead {
  id: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  company_name: string
  company_industry: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
}

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<MarketplacePurchase[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalLeads, setTotalLeads] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null)
  const [purchaseLeads, setPurchaseLeads] = useState<Record<string, PurchasedLead[]>>({})
  const [loadingLeads, setLoadingLeads] = useState<string | null>(null)

  const fetchPurchases = useCallback(async () => {
    try {
      const response = await fetch('/api/marketplace/history')
      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchases || [])
        setTotalSpent(data.totalSpent || 0)
        setTotalLeads(data.totalLeads || 0)
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  const fetchPurchaseLeads = async (purchaseId: string) => {
    if (purchaseLeads[purchaseId]) {
      // Already loaded
      setExpandedPurchase(expandedPurchase === purchaseId ? null : purchaseId)
      return
    }

    setLoadingLeads(purchaseId)
    try {
      const response = await fetch(`/api/marketplace/purchase?purchaseId=${purchaseId}`)
      if (response.ok) {
        const data = await response.json()
        setPurchaseLeads((prev) => ({
          ...prev,
          [purchaseId]: data.leads || [],
        }))
        setExpandedPurchase(purchaseId)
      }
    } catch (error) {
      console.error('Failed to fetch purchase leads:', error)
    } finally {
      setLoadingLeads(null)
    }
  }

  const downloadLeads = (leads: PurchasedLead[]) => {
    const headers = ['First Name', 'Last Name', 'Job Title', 'Company', 'Industry', 'Email', 'Phone', 'City', 'State']
    const rows = leads.map((lead) => [
      lead.first_name || '',
      lead.last_name || '',
      lead.job_title || '',
      lead.company_name,
      lead.company_industry || '',
      lead.email || '',
      lead.phone || '',
      lead.city || '',
      lead.state || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Purchase History</h1>
              <p className="text-[13px] text-zinc-500 mt-1">View and download your purchased leads</p>
            </div>
            <Link
              href="/marketplace"
              className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Marketplace
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className="text-[13px] text-zinc-500 mb-1">Total Purchases</div>
              {isLoading ? (
                <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-semibold text-zinc-900">{purchases.length}</div>
              )}
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className="text-[13px] text-zinc-500 mb-1">Total Leads</div>
              {isLoading ? (
                <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-semibold text-zinc-900">{totalLeads}</div>
              )}
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className="text-[13px] text-zinc-500 mb-1">Total Spent</div>
              {isLoading ? (
                <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-semibold text-zinc-900">${totalSpent.toFixed(2)}</div>
              )}
            </div>
          </div>

          {/* Purchases List */}
          <div className="bg-white border border-zinc-200 rounded-lg">
            <div className="px-6 py-4 border-b border-zinc-200">
              <h2 className="text-[15px] font-semibold text-zinc-900">All Purchases</h2>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-zinc-100 rounded animate-pulse" />
                ))}
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-zinc-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-[13px] text-zinc-500 mb-2">No purchases yet</p>
                <Link href="/marketplace" className="text-[13px] text-zinc-900 hover:underline">
                  Browse available leads
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => fetchPurchaseLeads(purchase.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-zinc-900">
                            {purchase.total_leads} lead{purchase.total_leads !== 1 ? 's' : ''}
                          </p>
                          <p className="text-[12px] text-zinc-500">
                            {new Date(purchase.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[14px] font-semibold text-zinc-900">${purchase.total_price.toFixed(2)}</p>
                          <p className="text-[12px] text-zinc-500">
                            {purchase.payment_method === 'credits' ? 'Paid with credits' : 'Paid with card'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-[11px] font-medium rounded ${
                            purchase.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : purchase.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {purchase.status}
                        </span>
                        {loadingLeads === purchase.id ? (
                          <svg className="animate-spin h-5 w-5 text-zinc-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg
                            className={`w-5 h-5 text-zinc-400 transition-transform ${expandedPurchase === purchase.id ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Expanded Lead Details */}
                    {expandedPurchase === purchase.id && purchaseLeads[purchase.id] && (
                      <div className="mt-4 pt-4 border-t border-zinc-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] font-medium text-zinc-700">Lead Details</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadLeads(purchaseLeads[purchase.id])
                            }}
                            className="h-8 px-3 text-[12px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download CSV
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[12px]">
                            <thead className="bg-zinc-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-zinc-600">Name</th>
                                <th className="px-3 py-2 text-left font-medium text-zinc-600">Title</th>
                                <th className="px-3 py-2 text-left font-medium text-zinc-600">Company</th>
                                <th className="px-3 py-2 text-left font-medium text-zinc-600">Email</th>
                                <th className="px-3 py-2 text-left font-medium text-zinc-600">Phone</th>
                                <th className="px-3 py-2 text-left font-medium text-zinc-600">Location</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {purchaseLeads[purchase.id].map((lead) => (
                                <tr key={lead.id} className="hover:bg-zinc-50">
                                  <td className="px-3 py-2 text-zinc-900">
                                    {lead.first_name} {lead.last_name}
                                  </td>
                                  <td className="px-3 py-2 text-zinc-600">{lead.job_title || '-'}</td>
                                  <td className="px-3 py-2 text-zinc-900">{lead.company_name}</td>
                                  <td className="px-3 py-2 text-zinc-600">
                                    {lead.email ? (
                                      <a href={`mailto:${lead.email}`} className="hover:underline text-blue-600">
                                        {lead.email}
                                      </a>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-zinc-600">
                                    {lead.phone ? (
                                      <a href={`tel:${lead.phone}`} className="hover:underline text-blue-600">
                                        {lead.phone}
                                      </a>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-zinc-600">
                                    {lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.state || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
