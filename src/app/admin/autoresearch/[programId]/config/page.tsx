import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import type { AutoresearchProgram } from '@/types/autoresearch'
import ProgramConfigForm from '@/components/admin/autoresearch/ProgramConfigForm'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ programId: string }>
}

export default async function ProgramConfigPage({ params }: PageProps) {
  const { programId } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('autoresearch_programs')
    .select('*')
    .eq('id', programId)
    .single()

  if (error || !data) {
    notFound()
  }

  const program = data as AutoresearchProgram

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <div className="mb-6">
        <Link
          href={`/admin/autoresearch/${programId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Program
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Configure: {program.name}</h1>
      </div>

      <ProgramConfigForm program={program} />
    </div>
  )
}
