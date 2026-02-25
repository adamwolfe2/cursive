interface LeadData {
  email?: string | null
  phone?: string | null
  linkedin_url?: string | null
  company_name?: string | null
  company_website?: string | null
  enrichment_status?: string | null
}

export function DataQualityBadge({ lead }: { lead: LeadData }) {
  const fields = [
    { key: 'email', value: lead.email, label: 'Email', weight: 3 },
    { key: 'phone', value: lead.phone, label: 'Phone', weight: 2 },
    { key: 'linkedin_url', value: lead.linkedin_url, label: 'LinkedIn', weight: 2 },
    { key: 'company_name', value: lead.company_name, label: 'Company', weight: 2 },
    { key: 'company_website', value: lead.company_website, label: 'Website', weight: 1 },
  ]

  const totalWeight = fields.reduce((s, f) => s + f.weight, 0)
  const filledWeight = fields
    .filter((f) => f.value && f.value.trim() !== '')
    .reduce((s, f) => s + f.weight, 0)

  const score = Math.round((filledWeight / totalWeight) * 100)

  const isEnriched = lead.enrichment_status === 'enriched'

  const config =
    score >= 80
      ? { label: 'Complete', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' }
      : score >= 50
      ? { label: 'Partial', cls: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400' }
      : { label: 'Minimal', cls: 'text-zinc-600 bg-zinc-50 border-zinc-200', dot: 'bg-zinc-400' }

  const missingFields = fields
    .filter((f) => !f.value || f.value.trim() === '')
    .map((f) => f.label)

  return (
    <div className="group relative inline-flex items-center gap-1">
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-1.5 py-0.5 rounded border ${config.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
        {isEnriched && <span className="opacity-60">· enriched</span>}
      </span>
      {missingFields.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1.5 z-50 hidden group-hover:block bg-popover border border-border rounded-lg shadow-md p-2.5 text-xs min-w-[140px]">
          <p className="font-medium text-foreground mb-1">Missing data:</p>
          {missingFields.map((f) => (
            <p key={f} className="text-muted-foreground">· {f}</p>
          ))}
        </div>
      )}
    </div>
  )
}
