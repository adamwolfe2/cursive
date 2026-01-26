'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'
import { buyerProfileSchema, type BuyerProfileFormData } from '@/lib/validation/schemas'
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormError,
} from '@/components/ui/form'

export default function BuyerProfilePage() {
  const router = useRouter()
  const [serviceStates, setServiceStates] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BuyerProfileFormData>({
    resolver: zodResolver(buyerProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      industry_vertical: 'Healthcare',
      service_states: [],
    },
  })

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
    const newStates = serviceStates.includes(state)
      ? serviceStates.filter(s => s !== state)
      : [...serviceStates, state]

    setServiceStates(newStates)
    setValue('service_states', newStates, { shouldValidate: true })
  }

  const onSubmit = async (data: BuyerProfileFormData) => {
    setSaving(true)
    setError('')

    const { error: saveError } = await supabase
      .from('buyers')
      .upsert({
        email: data.email,
        company_name: data.company_name,
        industry_vertical: data.industry_vertical,
        service_states: data.service_states,
        workspace_id: 'default'
      }, { onConflict: 'email' })

    setSaving(false)

    if (saveError) {
      setError(`Failed to save profile: ${saveError.message}`)
      return
    }

    router.push('/marketplace')
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <h1 className="text-xl font-semibold text-zinc-900 mb-8">Buyer Profile Setup</h1>

          <FormError message={error || undefined} className="mb-6" />

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-6">
              <div className="space-y-6">
                <FormField error={errors.email}>
                  <FormLabel htmlFor="email" required>
                    Email
                  </FormLabel>
                  <FormInput
                    id="email"
                    type="email"
                    placeholder="buyer@company.com"
                    disabled={saving}
                    error={errors.email}
                    {...register('email')}
                  />
                </FormField>

                <FormField error={errors.company_name}>
                  <FormLabel htmlFor="company_name" required>
                    Company Name
                  </FormLabel>
                  <FormInput
                    id="company_name"
                    type="text"
                    placeholder="Your Company LLC"
                    disabled={saving}
                    error={errors.company_name}
                    {...register('company_name')}
                  />
                </FormField>

                <FormField error={errors.industry_vertical}>
                  <FormLabel htmlFor="industry_vertical" required>
                    Industry Vertical
                  </FormLabel>
                  <FormSelect
                    id="industry_vertical"
                    disabled={saving}
                    error={errors.industry_vertical}
                    {...register('industry_vertical')}
                  >
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField error={errors.service_states}>
                  <FormLabel
                    htmlFor="service_states"
                    required
                    hint="Select states where you want to receive leads"
                  >
                    Service States
                  </FormLabel>
                  <div className="grid grid-cols-8 gap-2">
                    {states.map(state => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => toggleState(state)}
                        disabled={saving}
                        className={`h-9 px-2 rounded-lg text-[13px] font-medium transition-all duration-150 disabled:opacity-50 ${
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
                </FormField>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving || Object.keys(errors).length > 0}
                    className="flex-1 h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/marketplace')}
                    disabled={saving}
                    className="flex-1 h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
