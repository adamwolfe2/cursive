'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'
import { useToast } from '@/lib/hooks/use-toast'
import { useUser } from '@/hooks/use-user'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UpsellBanner } from '@/components/marketplace/UpsellBanner'

interface PurchasedLead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  job_title: string | null
  company_name: string
  company_domain: string | null
  company_industry: string | null
  company_size: string | null
  city: string | null
  state: string | null
  country: string | null
  linkedin_url: string | null
  intent_score_calculated: number | null
  verification_status: string | null
  // Purchase metadata
  purchase_id: string
  purchased_at: string
  price_paid: number
  purchase_total: number
}

export default function MyLeadsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: userLoading } = useUser()
  const [leads, setLeads] = useState<PurchasedLead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<PurchasedLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [creditsBalance, setCreditsBalance] = useState(0)
  const [totalSpend, setTotalSpend] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [selectedState, setSelectedState] = useState<string>('all')
  const [selectedPurchase, setSelectedPurchase] = useState<string>('all')

  // Derived filter options
  const [industries, setIndustries] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [purchases, setPurchases] = useState<{ id: string; date: string }[]>([])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/marketplace/my-leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
        setFilteredLeads(data.leads || [])

        // Extract unique filter values
        const uniqueIndustries = [...new Set(data.leads.map((l: PurchasedLead) => l.company_industry).filter(Boolean))]
        const uniqueStates = [...new Set(data.leads.map((l: PurchasedLead) => l.state).filter(Boolean))]
        // Deduplicate purchases by id
        const purchaseMap = new Map<string, string>()
        data.leads.forEach((l: PurchasedLead) => {
          if (!purchaseMap.has(l.purchase_id)) {
            purchaseMap.set(l.purchase_id, l.purchased_at)
          }
        })
        const uniquePurchases = Array.from(purchaseMap.entries()).map(([id, date]) => ({ id, date }))

        setIndustries(uniqueIndustries.sort())
        setStates(uniqueStates.sort())
        setPurchases(uniquePurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      } else if (response.status === 401) {
        router.push('/login')
        return
      } else {
        toast({
          title: 'Failed to load leads',
          message: 'Could not fetch your purchased leads',
          type: 'error',
        })
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
      toast({
        title: 'Error',
        message: 'An error occurred while loading leads',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, router])

  const fetchUpsellData = useCallback(async () => {
    try {
      const [creditsRes, statsRes] = await Promise.all([
        fetch('/api/marketplace/credits'),
        fetch('/api/marketplace/stats'),
      ])
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json()
        setCreditsBalance(creditsData.balance || 0)
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setTotalSpend(statsData.totalSpent || 0)
      }
    } catch (error) {
      console.error('Failed to fetch upsell data:', error)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchLeads()
    fetchUpsellData()
  }, [fetchLeads, fetchUpsellData, user])

  // Apply filters
  useEffect(() => {
    let filtered = leads

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.first_name?.toLowerCase().includes(query) ||
          lead.last_name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.company_name.toLowerCase().includes(query) ||
          lead.job_title?.toLowerCase().includes(query)
      )
    }

    if (selectedIndustry !== 'all') {
      filtered = filtered.filter((lead) => lead.company_industry === selectedIndustry)
    }

    if (selectedState !== 'all') {
      filtered = filtered.filter((lead) => lead.state === selectedState)
    }

    if (selectedPurchase !== 'all') {
      filtered = filtered.filter((lead) => lead.purchase_id === selectedPurchase)
    }

    setFilteredLeads(filtered)
  }, [searchQuery, selectedIndustry, selectedState, selectedPurchase, leads])

  const downloadLeads = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Job Title',
      'Company',
      'Domain',
      'Industry',
      'Company Size',
      'City',
      'State',
      'Country',
      'LinkedIn',
      'Intent Score',
      'Verification',
      'Purchased At',
      'Price Paid',
    ]

    const rows = filteredLeads.map((lead) => [
      lead.first_name || '',
      lead.last_name || '',
      lead.email || '',
      lead.phone || '',
      lead.job_title || '',
      lead.company_name,
      lead.company_domain || '',
      lead.company_industry || '',
      lead.company_size || '',
      lead.city || '',
      lead.state || '',
      lead.country || '',
      lead.linkedin_url || '',
      lead.intent_score_calculated?.toString() || '',
      lead.verification_status || '',
      new Date(lead.purchased_at).toLocaleString(),
      lead.price_paid.toFixed(2),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `my-purchased-leads-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedIndustry('all')
    setSelectedState('all')
    setSelectedPurchase('all')
  }

  // Show loading while checking auth
  if (userLoading || !user) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="animate-pulse text-[13px] text-zinc-500">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">My Purchased Leads</h1>
              <p className="text-[13px] text-zinc-500 mt-1">
                All leads you've purchased from the marketplace
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/marketplace/history"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'gap-2'
                )}
              >
                View by Purchase
              </Link>
              <Link
                href="/marketplace"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'bg-zinc-900 hover:bg-zinc-800 gap-2'
                )}
              >
                Browse Marketplace
              </Link>
            </div>
          </div>

          {/* Upsell Banner */}
          <UpsellBanner creditsBalance={creditsBalance} totalSpend={totalSpend} />

          {/* Stats & Actions */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-[13px] text-zinc-500 mb-1">Total Leads</div>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse" />
                  ) : (
                    <div className="text-2xl font-semibold text-zinc-900">{leads.length}</div>
                  )}
                </div>
                <div>
                  <div className="text-[13px] text-zinc-500 mb-1">Filtered Results</div>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse" />
                  ) : (
                    <div className="text-2xl font-semibold text-zinc-900">{filteredLeads.length}</div>
                  )}
                </div>
              </div>
              <button
                onClick={downloadLeads}
                disabled={filteredLeads.length === 0}
                className="h-10 px-4 text-[13px] font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''} to CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Name, email, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">Industry</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                >
                  <option value="all">All Industries</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                >
                  <option value="all">All States</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">Purchase</label>
                <select
                  value={selectedPurchase}
                  onChange={(e) => setSelectedPurchase(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                >
                  <option value="all">All Purchases</option>
                  {purchases.map((purchase) => (
                    <option key={purchase.id} value={purchase.id}>
                      {new Date(purchase.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(searchQuery || selectedIndustry !== 'all' || selectedState !== 'all' || selectedPurchase !== 'all') && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] text-zinc-600">
                  Showing {filteredLeads.length} of {leads.length} leads
                </span>
                <button
                  onClick={resetFilters}
                  className="text-[13px] text-zinc-600 hover:text-zinc-900 underline"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* Leads Table */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-zinc-100 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 text-zinc-300 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-[13px] text-zinc-500 mb-2">
                  {leads.length === 0 ? 'No purchased leads yet' : 'No leads match your filters'}
                </p>
                {leads.length === 0 ? (
                  <Link href="/marketplace" className="text-[13px] text-zinc-900 hover:underline">
                    Browse available leads
                  </Link>
                ) : (
                  <button onClick={resetFilters} className="text-[13px] text-zinc-900 hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Title</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Company</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Industry</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Phone</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Location</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Intent</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700">Purchased</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-zinc-900 font-medium">
                          {lead.first_name} {lead.last_name}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{lead.job_title || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="text-zinc-900">{lead.company_name}</div>
                          {lead.company_size && (
                            <div className="text-[11px] text-zinc-500">{lead.company_size} employees</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{lead.company_industry || '-'}</td>
                        <td className="px-4 py-3">
                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.state || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {lead.intent_score_calculated ? (
                            <span
                              className={`px-2 py-1 text-[11px] font-medium rounded ${
                                lead.intent_score_calculated >= 80
                                  ? 'bg-blue-100 text-blue-700'
                                  : lead.intent_score_calculated >= 60
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {lead.intent_score_calculated}
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-zinc-600">
                            {new Date(lead.purchased_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-zinc-500">${lead.price_paid.toFixed(2)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
