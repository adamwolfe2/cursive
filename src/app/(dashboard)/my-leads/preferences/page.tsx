/**
 * Targeting Preferences Page
 *
 * Allows users to configure their lead targeting preferences:
 * - Industry/SIC codes
 * - Geographic locations (states, cities, zips)
 * - Lead caps (daily, weekly, monthly)
 * - Notification settings
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TargetingPreferencesForm } from '@/components/leads/targeting-preferences-form'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type UserTargeting = Database['public']['Tables']['user_targeting']['Row']

export const metadata = {
  title: 'Targeting Preferences | Cursive',
  description: 'Configure your lead targeting preferences',
}

// Common industry options
const INDUSTRY_OPTIONS = [
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Roofing', label: 'Roofing' },
  { value: 'Solar', label: 'Solar' },
  { value: 'Landscaping', label: 'Landscaping' },
  { value: 'Pest Control', label: 'Pest Control' },
  { value: 'Home Security', label: 'Home Security' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Legal Services', label: 'Legal Services' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Home Improvement', label: 'Home Improvement' },
  { value: 'Auto Services', label: 'Auto Services' },
]

// US States
const STATE_OPTIONS = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

export default async function TargetingPreferencesPage() {
  const supabase = await createClient()

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, workspace_id, full_name, email')
    .eq('auth_user_id', session.user.id)
    .single()

  if (userError || !userData) {
    redirect('/welcome')
  }

  const user = userData as Pick<User, 'id' | 'workspace_id' | 'full_name' | 'email'>

  // Get existing targeting preferences
  const { data: targetingData } = await supabase
    .from('user_targeting')
    .select('*')
    .eq('user_id', user.id)
    .eq('workspace_id', user.workspace_id)
    .single()

  const targeting = targetingData as UserTargeting | null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/my-leads" className="hover:text-zinc-700">
              My Leads
            </Link>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span>Preferences</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Targeting Preferences
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Configure which leads get matched to you based on industry and location
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-primary">
            <p className="font-medium">How lead matching works</p>
            <p className="mt-1">
              When a new lead comes in, we check if it matches your targeting
              preferences. If the lead&apos;s industry AND location match your
              settings, it will be automatically assigned to you and you&apos;ll
              receive an email notification.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <TargetingPreferencesForm
        userId={user.id}
        workspaceId={user.workspace_id}
        initialData={targeting}
        industryOptions={INDUSTRY_OPTIONS}
        stateOptions={STATE_OPTIONS}
      />
    </div>
  )
}
