import { createAdminClient } from '@/lib/supabase/server'
import type { OnboardingTemplate } from '@/types/onboarding-templates'
import OnboardingWizard from '@/components/admin/onboarding/wizard/OnboardingWizard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewClientIntakePage() {
  const supabase = createAdminClient()

  const { data: templates } = await supabase
    .from('onboarding_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/onboarding"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Client Onboarding</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure the deal, paste call notes, review fields, send invoice and contract, then create the client.
        </p>
      </div>

      <OnboardingWizard templates={(templates ?? []) as OnboardingTemplate[]} />
    </div>
  )
}
