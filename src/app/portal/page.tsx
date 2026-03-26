import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortalDashboard } from './PortalDashboard'

export default async function PortalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/portal')
  }

  // Look up the user's email from auth, then find their onboarding record
  const userEmail = user.email

  if (!userEmail) {
    return <NoOnboardingFound />
  }

  // Use admin client to query onboarding_clients (bypasses RLS since
  // onboarding_clients is an admin-managed table without user-facing RLS)
  const adminSupabase = createAdminClient()

  const { data: client } = await adminSupabase
    .from('onboarding_clients')
    .select(
      'company_name, status, packages_selected, setup_fee, recurring_fee, enrichment_status, copy_generation_status, copy_approval_status, start_timeline, created_at, onboarding_complete, confirmation_email_sent'
    )
    .eq('primary_contact_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!client) {
    return <NoOnboardingFound />
  }

  return <PortalDashboard client={client} />
}

function NoOnboardingFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-6">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        No active onboarding found
      </h1>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        We couldn&apos;t find an onboarding record associated with your account.
        If you believe this is an error, please reach out to our team.
      </p>
      <a
        href="https://meetcursive.com"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Visit meetcursive.com
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </a>
    </div>
  )
}
