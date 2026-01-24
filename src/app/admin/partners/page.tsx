'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface Partner {
  id: string
  name: string
  email: string
  company_name: string | null
  api_key: string
  payout_rate: number
  is_active: boolean
  total_leads_uploaded: number
  total_earnings: number
  created_at: string
}

export default function AdminPartnersPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    company_name: '',
    payout_rate: 5.00,
  })
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch partners
  const { data: partners, isLoading } = useQuery({
    queryKey: ['admin', 'partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Partner[]
    },
  })

  // Create partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: async (partnerData: typeof newPartner) => {
      const { data, error } = await supabase
        .from('partners')
        .insert(partnerData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] })
      setShowCreateModal(false)
      setNewPartner({ name: '', email: '', company_name: '', payout_rate: 5.00 })
    },
  })

  // Toggle partner status
  const togglePartnerStatus = async (partnerId: string, currentStatus: boolean) => {
    await supabase
      .from('partners')
      .update({ is_active: !currentStatus })
      .eq('id', partnerId)
    queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] })
  }

  // Regenerate API key
  const regenerateApiKey = async (partnerId: string) => {
    const newKey = 'pk_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
    await supabase
      .from('partners')
      .update({ api_key: newKey })
      .eq('id', partnerId)
    queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] })
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-zinc-900">Partner Management</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Manage lead upload partners and their API access
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="h-9 px-4 text-[13px] font-medium bg-violet-600 text-white hover:bg-violet-700 rounded-lg transition-all"
        >
          + Add Partner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Total Partners</div>
          <div className="text-2xl font-medium text-zinc-900 mt-1">
            {partners?.length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Active Partners</div>
          <div className="text-2xl font-medium text-emerald-600 mt-1">
            {partners?.filter(p => p.is_active).length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Total Leads Uploaded</div>
          <div className="text-2xl font-medium text-violet-600 mt-1">
            {partners?.reduce((acc, p) => acc + p.total_leads_uploaded, 0) || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Total Payouts</div>
          <div className="text-2xl font-medium text-zinc-900 mt-1">
            ${partners?.reduce((acc, p) => acc + Number(p.total_earnings), 0).toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[15px] font-medium text-zinc-900">All Partners</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Partner</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">API Key</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Payout Rate</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Leads</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Earnings</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Status</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners?.map((partner) => (
                  <tr key={partner.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-[13px] font-medium text-zinc-900">{partner.name}</div>
                      <div className="text-[12px] text-zinc-500">{partner.email}</div>
                      {partner.company_name && (
                        <div className="text-[11px] text-zinc-400">{partner.company_name}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] text-zinc-600 bg-zinc-100 px-2 py-1 rounded">
                          {partner.api_key.slice(0, 12)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(partner.api_key)}
                          className="text-[11px] text-violet-600 hover:text-violet-700"
                        >
                          Copy
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-zinc-900">
                      ${Number(partner.payout_rate).toFixed(2)}/lead
                    </td>
                    <td className="px-5 py-3 text-[13px] text-zinc-600">
                      {partner.total_leads_uploaded}
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-emerald-600">
                      ${Number(partner.total_earnings).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                        partner.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {partner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePartnerStatus(partner.id, partner.is_active)}
                          className="text-[12px] text-zinc-600 hover:text-zinc-700 font-medium"
                        >
                          {partner.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => regenerateApiKey(partner.id)}
                          className="text-[12px] text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Regen Key
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && partners?.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            No partners yet. Click &quot;Add Partner&quot; to create one.
          </div>
        )}
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-[15px] font-medium text-zinc-900 mb-4">Add New Partner</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                createPartnerMutation.mutate(newPartner)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-violet-500"
                  placeholder="Partner name"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-violet-500"
                  placeholder="partner@example.com"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1">Company (optional)</label>
                <input
                  type="text"
                  value={newPartner.company_name}
                  onChange={(e) => setNewPartner({ ...newPartner, company_name: e.target.value })}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-violet-500"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1">Payout Rate ($/lead)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newPartner.payout_rate}
                  onChange={(e) => setNewPartner({ ...newPartner, payout_rate: parseFloat(e.target.value) })}
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-10 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPartnerMutation.isPending}
                  className="flex-1 h-10 text-[13px] font-medium bg-violet-600 text-white hover:bg-violet-700 rounded-lg disabled:opacity-50"
                >
                  {createPartnerMutation.isPending ? 'Creating...' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
