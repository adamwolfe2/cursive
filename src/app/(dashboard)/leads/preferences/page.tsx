'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useToast } from '@/lib/hooks/use-toast'

const INDUSTRIES = [
  'HVAC',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Solar',
  'Real Estate',
  'Insurance',
  'Landscaping',
  'Pest Control',
  'Cleaning Services',
  'Auto Services',
  'Legal Services',
  'Financial Services',
  'Healthcare',
]

const REGIONS = [
  'Northeast',
  'Southeast',
  'Midwest',
  'Southwest',
  'West Coast',
  'All Regions',
]

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees',
]

const INTENT_SIGNALS = [
  'Actively searching',
  'Comparing options',
  'Ready to buy',
  'Researching',
  'Urgently needs service',
]

export default function LeadPreferencesPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingPreference, setEditingPreference] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_industries: [] as string[],
    target_regions: [] as string[],
    target_company_sizes: [] as string[],
    target_intent_signals: [] as string[],
    max_leads_per_day: 10,
    max_cost_per_lead: '',
    monthly_budget: '',
  })

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['lead-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/leads/preferences')
      if (!response.ok) throw new Error('Failed to fetch preferences')
      const data = await response.json()
      return data.data || []
    },
  })

  // Save preference mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingPreference
        ? `/api/leads/preferences/${editingPreference.id}`
        : '/api/leads/preferences'
      const method = editingPreference ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save preference')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-preferences'] })
      toast.success(editingPreference ? 'Preference updated!' : 'Preference created!')
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete preference mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leads/preferences/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete preference')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-preferences'] })
      toast.success('Preference deleted!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_industries: [],
      target_regions: [],
      target_company_sizes: [],
      target_intent_signals: [],
      max_leads_per_day: 10,
      max_cost_per_lead: '',
      monthly_budget: '',
    })
    setEditingPreference(null)
    setShowForm(false)
  }

  const handleEdit = (preference: any) => {
    setEditingPreference(preference)
    setFormData({
      name: preference.name,
      description: preference.description || '',
      target_industries: preference.target_industries || [],
      target_regions: preference.target_regions || [],
      target_company_sizes: preference.target_company_sizes || [],
      target_intent_signals: preference.target_intent_signals || [],
      max_leads_per_day: preference.max_leads_per_day || 10,
      max_cost_per_lead: preference.max_cost_per_lead?.toString() || '',
      monthly_budget: preference.monthly_budget?.toString() || '',
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Please enter a preference name')
      return
    }
    saveMutation.mutate(formData)
  }

  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item]
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-96 bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lead Preferences</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Configure what types of leads you want to receive
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="h-10 px-4 text-[13px] font-medium bg-gradient-to-r from-primary to-indigo-600 text-white rounded-lg hover:from-primary/90 hover:to-indigo-700"
        >
          New Preference
        </button>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-primary/80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary">
              Smart Lead Matching
            </h3>
            <p className="mt-2 text-sm text-primary/90">
              Set your preferences below to receive leads that match your business criteria.
              Leads are automatically routed based on your industry, service areas, and budget.
            </p>
          </div>
        </div>
      </div>

      {/* Preferences List */}
      {!showForm && (
        <div className="space-y-4">
          {preferences?.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-900 mb-1">No preferences yet</h3>
              <p className="text-[13px] text-zinc-500 mb-4">
                Create a preference to start receiving matched leads
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="h-9 px-4 text-[13px] font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Create Your First Preference
              </button>
            </div>
          ) : (
            preferences.map((pref: any) => (
              <div
                key={pref.id}
                className="rounded-lg border border-zinc-200 bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-medium text-zinc-900">{pref.name}</h3>
                      {pref.is_active && (
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    {pref.description && (
                      <p className="text-[13px] text-zinc-500 mt-1">{pref.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(pref)}
                      className="px-3 py-1.5 text-[12px] font-medium text-zinc-700 bg-zinc-100 rounded hover:bg-zinc-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this preference?')) {
                          deleteMutation.mutate(pref.id)
                        }
                      }}
                      className="px-3 py-1.5 text-[12px] font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {pref.target_industries?.length > 0 && (
                    <div>
                      <span className="text-[11px] font-medium text-zinc-500 uppercase">Industries</span>
                      <p className="text-[13px] text-zinc-900 mt-1">
                        {pref.target_industries.slice(0, 3).join(', ')}
                        {pref.target_industries.length > 3 && ` +${pref.target_industries.length - 3}`}
                      </p>
                    </div>
                  )}
                  {pref.target_regions?.length > 0 && (
                    <div>
                      <span className="text-[11px] font-medium text-zinc-500 uppercase">Regions</span>
                      <p className="text-[13px] text-zinc-900 mt-1">
                        {pref.target_regions.join(', ')}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 uppercase">Daily Limit</span>
                    <p className="text-[13px] text-zinc-900 mt-1">{pref.max_leads_per_day} leads</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 uppercase">Received</span>
                    <p className="text-[13px] text-zinc-900 mt-1">{pref.total_leads_received || 0} leads</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Preference Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-[15px] font-medium text-zinc-900 mb-6">
            {editingPreference ? 'Edit Preference' : 'New Lead Preference'}
          </h2>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Preference Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., HVAC Leads in Texas"
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Industries */}
            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                Target Industries
              </label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      target_industries: toggleArrayItem(formData.target_industries, industry),
                    })}
                    className={`px-3 py-1.5 text-[12px] rounded-full border transition-colors ${
                      formData.target_industries.includes(industry)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-zinc-300 text-zinc-600 hover:border-primary/30'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            {/* Regions */}
            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                Target Regions
              </label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      target_regions: toggleArrayItem(formData.target_regions, region),
                    })}
                    className={`px-3 py-1.5 text-[12px] rounded-full border transition-colors ${
                      formData.target_regions.includes(region)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-zinc-300 text-zinc-600 hover:border-primary/30'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Intent Signals */}
            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                Intent Signals
              </label>
              <div className="flex flex-wrap gap-2">
                {INTENT_SIGNALS.map((signal) => (
                  <button
                    key={signal}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      target_intent_signals: toggleArrayItem(formData.target_intent_signals, signal),
                    })}
                    className={`px-3 py-1.5 text-[12px] rounded-full border transition-colors ${
                      formData.target_intent_signals.includes(signal)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-zinc-300 text-zinc-600 hover:border-primary/30'
                    }`}
                  >
                    {signal}
                  </button>
                ))}
              </div>
            </div>

            {/* Limits */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Max Leads Per Day
                </label>
                <input
                  type="number"
                  value={formData.max_leads_per_day}
                  onChange={(e) => setFormData({ ...formData, max_leads_per_day: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="100"
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Max Cost Per Lead ($)
                </label>
                <input
                  type="number"
                  value={formData.max_cost_per_lead}
                  onChange={(e) => setFormData({ ...formData, max_cost_per_lead: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Monthly Budget ($)
                </label>
                <input
                  type="number"
                  value={formData.monthly_budget}
                  onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  className="w-full h-10 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="h-10 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="h-10 px-4 text-[13px] font-medium bg-gradient-to-r from-primary to-indigo-600 text-white rounded-lg hover:from-primary/90 hover:to-indigo-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : editingPreference ? 'Update Preference' : 'Create Preference'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
