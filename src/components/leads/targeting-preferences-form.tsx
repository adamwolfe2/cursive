'use client'

/**
 * Targeting Preferences Form Component
 *
 * Form for users to configure their lead targeting preferences.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/design-system'
import type { Database } from '@/types/database.types'

type UserTargeting = Database['public']['Tables']['user_targeting']['Row']

interface TargetingPreferencesFormProps {
  userId: string
  workspaceId: string
  initialData: UserTargeting | null
  industryOptions: { value: string; label: string }[]
  stateOptions: { value: string; label: string }[]
}

export function TargetingPreferencesForm({
  userId,
  workspaceId,
  initialData,
  industryOptions,
  stateOptions,
}: TargetingPreferencesFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [industries, setIndustries] = useState<string[]>(
    initialData?.target_industries || []
  )
  const [states, setStates] = useState<string[]>(
    initialData?.target_states || []
  )
  const [cities, setCities] = useState<string>(
    (initialData?.target_cities || []).join(', ')
  )
  const [zips, setZips] = useState<string>(
    (initialData?.target_zips || []).join(', ')
  )
  const [dailyCap, setDailyCap] = useState<number>(
    initialData?.daily_lead_cap || 5
  )
  const [weeklyCap, setWeeklyCap] = useState<number>(
    initialData?.weekly_lead_cap || 25
  )
  const [monthlyCap, setMonthlyCap] = useState<number>(
    initialData?.monthly_lead_cap || 100
  )
  const [emailNotifications, setEmailNotifications] = useState<boolean>(
    initialData?.email_notifications ?? true
  )
  const [isActive, setIsActive] = useState<boolean>(
    initialData?.is_active ?? true
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      // Parse cities and zips from comma-separated strings
      const parsedCities = cities
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
      const parsedZips = zips
        .split(',')
        .map((z) => z.trim())
        .filter(Boolean)

      const data = {
        user_id: userId,
        workspace_id: workspaceId,
        target_industries: industries,
        target_sic_codes: [] as string[],
        target_states: states,
        target_cities: parsedCities,
        target_zips: parsedZips,
        daily_lead_cap: dailyCap,
        weekly_lead_cap: weeklyCap,
        monthly_lead_cap: monthlyCap,
        email_notifications: emailNotifications,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }

      if (initialData?.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('user_targeting')
          .update(data as never)
          .eq('id', initialData.id)

        if (updateError) throw updateError
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('user_targeting')
          .insert(data as never)

        if (insertError) throw insertError
      }

      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error('Failed to save preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  function toggleIndustry(value: string) {
    setIndustries((prev) =>
      prev.includes(value)
        ? prev.filter((i) => i !== value)
        : [...prev, value]
    )
  }

  function toggleState(value: string) {
    setStates((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Active toggle */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900">Lead Routing Status</h3>
            <p className="mt-1 text-sm text-zinc-500">
              When active, leads matching your preferences will be automatically
              assigned to you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2',
              isActive ? 'bg-violet-600' : 'bg-zinc-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                isActive ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </div>

      {/* Industry targeting */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h3 className="font-semibold text-zinc-900 mb-1">Industry Targeting</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Select the industries you want to receive leads from.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {industryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleIndustry(option.value)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg border transition-colors text-left',
                industries.includes(option.value)
                  ? 'bg-violet-50 border-violet-200 text-violet-700'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {industries.length > 0 && (
          <p className="mt-3 text-sm text-zinc-500">
            Selected: {industries.join(', ')}
          </p>
        )}
      </div>

      {/* Geographic targeting */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h3 className="font-semibold text-zinc-900 mb-1">Geographic Targeting</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Select the states where you want to receive leads from.
        </p>

        {/* States */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            States
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto border border-zinc-200 rounded-lg p-3">
            {stateOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleState(option.value)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded border transition-colors',
                  states.includes(option.value)
                    ? 'bg-violet-50 border-violet-200 text-violet-700'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                )}
              >
                {option.value}
              </button>
            ))}
          </div>
          {states.length > 0 && (
            <p className="mt-2 text-sm text-zinc-500">
              Selected: {states.join(', ')}
            </p>
          )}
        </div>

        {/* Cities */}
        <div className="mb-6">
          <label
            htmlFor="cities"
            className="block text-sm font-medium text-zinc-700 mb-2"
          >
            Cities (optional)
          </label>
          <input
            type="text"
            id="cities"
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            placeholder="e.g., Austin, Dallas, Houston"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Comma-separated list of cities for more specific targeting
          </p>
        </div>

        {/* ZIP codes */}
        <div>
          <label
            htmlFor="zips"
            className="block text-sm font-medium text-zinc-700 mb-2"
          >
            ZIP Codes (optional)
          </label>
          <input
            type="text"
            id="zips"
            value={zips}
            onChange={(e) => setZips(e.target.value)}
            placeholder="e.g., 78701, 78702, 78703"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Comma-separated list of ZIP codes for hyperlocal targeting
          </p>
        </div>
      </div>

      {/* Lead caps */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h3 className="font-semibold text-zinc-900 mb-1">Lead Caps</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Limit the number of leads you receive to avoid overwhelm.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="dailyCap"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Daily Cap
            </label>
            <input
              type="number"
              id="dailyCap"
              value={dailyCap}
              onChange={(e) => setDailyCap(parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="weeklyCap"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Weekly Cap
            </label>
            <input
              type="number"
              id="weeklyCap"
              value={weeklyCap}
              onChange={(e) => setWeeklyCap(parseInt(e.target.value) || 0)}
              min={0}
              max={500}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="monthlyCap"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Monthly Cap
            </label>
            <input
              type="number"
              id="monthlyCap"
              value={monthlyCap}
              onChange={(e) => setMonthlyCap(parseInt(e.target.value) || 0)}
              min={0}
              max={2000}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900">Email Notifications</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Receive an email whenever a new lead is assigned to you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2',
              emailNotifications ? 'bg-violet-600' : 'bg-zinc-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                emailNotifications ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">
            Preferences saved successfully!
          </p>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push('/my-leads')}
          className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}
