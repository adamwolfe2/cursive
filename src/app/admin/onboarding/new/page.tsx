import { createAdminClient } from '@/lib/supabase/server'
import type { OnboardingTemplate } from '@/types/onboarding-templates'
import InternalIntakeForm from './InternalIntakeForm'
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
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/onboarding"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Client Intake</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste raw context from calls, transcripts, or briefs. AI will parse it into a structured client profile.
        </p>
      </div>

      <InternalIntakeForm templates={(templates ?? []) as OnboardingTemplate[]} />
    </div>
  )
}
