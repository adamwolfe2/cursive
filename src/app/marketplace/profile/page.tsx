'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'

export default function BuyerProfilePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industryVertical, setIndustryVertical] = useState('Healthcare')
  const [serviceStates, setServiceStates] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]

  const industries = [
    'Healthcare',
    'Home Services',
    'Door-to-Door Sales',
    'HVAC',
    'Solar',
    'Roofing',
    'Legal Services',
    'Other'
  ]

  const toggleState = (state: string) => {
    if (serviceStates.includes(state)) {
      setServiceStates(serviceStates.filter(s => s !== state))
    } else {
      setServiceStates([...serviceStates, state])
    }
  }

  const saveProfile = async () => {
    if (!email || !companyName) {
      alert('Please fill in required fields')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('buyers')
      .upsert({
        email,
        company_name: companyName,
        industry_vertical: industryVertical,
        service_states: serviceStates,
        workspace_id: 'default'
      }, { onConflict: 'email' })

    setSaving(false)

    if (error) {
      alert(`Failed to save profile: ${error.message}`)
      return
    }

    alert('Profile saved successfully!')
    router.push('/marketplace')
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <h1 className="text-xl font-semibold text-zinc-900 mb-8">Buyer Profile Setup</h1>

          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-[13px] font-medium text-zinc-900 mb-2">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 border border-zinc-300 rounded-lg px-3 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  placeholder="buyer@company.com"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-900 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-9 border border-zinc-300 rounded-lg px-3 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  placeholder="Your Company LLC"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-900 mb-2">Industry Vertical</label>
                <select
                  value={industryVertical}
                  onChange={(e) => setIndustryVertical(e.target.value)}
                  className="w-full h-9 border border-zinc-300 rounded-lg px-3 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                >
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-zinc-900 mb-2">Service States</label>
                <p className="text-[12px] text-zinc-500 mb-3">Select states where you want to receive leads</p>
                <div className="grid grid-cols-8 gap-2">
                  {states.map(state => (
                    <button
                      key={state}
                      onClick={() => toggleState(state)}
                      className={`h-9 px-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        serviceStates.includes(state)
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] text-zinc-500 mt-3">
                  Selected: {serviceStates.length > 0 ? serviceStates.join(', ') : 'None'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  onClick={() => router.push('/marketplace')}
                  className="flex-1 h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
