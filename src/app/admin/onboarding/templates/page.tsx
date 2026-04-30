import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import type { OnboardingTemplate } from '@/types/onboarding-templates'
import { ArrowLeft } from 'lucide-react'
import TemplateList from './TemplateList'

export default async function TemplateManagementPage() {
  const supabase = createAdminClient()

  const { data: templates, error } = await supabase
    .from('onboarding_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to load templates: ${error.message}`)
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/onboarding"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Templates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pre-built ICP scaffolds that pre-fill 60-80% of the intake form for common client types.
        </p>
      </div>

      <TemplateList templates={(templates ?? []) as OnboardingTemplate[]} />
    </div>
  )
}
