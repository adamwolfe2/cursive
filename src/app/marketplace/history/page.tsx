'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'

interface PurchaseWithLead {
  id: string
  lead_id: string
  price_paid: number
  purchased_at: string
  lead: {
    company_name: string
    company_industry: string
    company_location: { state: string; country: string }
    email: string
    first_name: string
    last_name: string
    job_title: string
  }
}

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<PurchaseWithLead[]>([])
  const [totalSpent, setTotalSpent] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    const { data } = await supabase
      .from('lead_purchases')
      .select(`
        *,
        lead:leads(
          company_name,
          company_industry,
          company_location,
          email,
          first_name,
          last_name,
          job_title
        )
      `)
      .order('purchased_at', { ascending: false })

    if (data) {
      setPurchases(data as any)
      const total = data.reduce((sum, p) => sum + Number(p.price_paid), 0)
      setTotalSpent(total)
    }
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-semibold text-zinc-900">Purchase History</h1>
            <Link
              href="/marketplace"
              className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 inline-flex items-center"
            >
              Back to Marketplace
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg shadow-sm p-6">
              <div className="text-[13px] text-zinc-600 mb-1">Total Purchases</div>
              <div className="text-2xl font-semibold text-zinc-900">{purchases.length}</div>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg shadow-sm p-6">
              <div className="text-[13px] text-zinc-600 mb-1">Total Spent</div>
              <div className="text-2xl font-semibold text-zinc-900">${totalSpent.toFixed(2)}</div>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg shadow-sm p-6">
              <div className="text-[13px] text-zinc-600 mb-1">Average Price</div>
              <div className="text-2xl font-semibold text-zinc-900">
                ${purchases.length > 0 ? (totalSpent / purchases.length).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-200">
              <h2 className="text-[15px] font-semibold text-zinc-900">All Purchases</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Date</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Company</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Industry</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Location</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Contact</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Email</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-600">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 text-[12px] text-zinc-600">
                        {new Date(purchase.purchased_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-zinc-900">{purchase.lead.company_name}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-600">{purchase.lead.company_industry || 'N/A'}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-600">
                        {purchase.lead.company_location?.state || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-zinc-900">
                        {purchase.lead.first_name || 'Unknown'} {purchase.lead.last_name || ''}
                        <br />
                        <span className="text-[12px] text-zinc-500">
                          {purchase.lead.job_title || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-zinc-600">{purchase.lead.email}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-zinc-900">
                        ${Number(purchase.price_paid).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {purchases.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                <p className="text-[13px] mb-2">No purchases yet</p>
                <Link
                  href="/marketplace"
                  className="text-[13px] text-zinc-900 hover:underline inline-block"
                >
                  Browse available leads
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
