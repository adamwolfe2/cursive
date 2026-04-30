import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Search, LayoutGrid, Database, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageContainer, PageHeader } from '@/components/layout/page-container'

export const metadata: Metadata = {
  title: 'Find Leads | Cursive',
}

async function getSegmentCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('al_segment_catalog')
      .select('*', { count: 'exact', head: true })

    return count ?? 0
  } catch {
    return 0
  }
}

interface FindLeadsCard {
  title: string
  description: string
  href: string
  cta: string
  icon: LucideIcon
  showCount?: boolean
}

const CARDS: FindLeadsCard[] = [
  {
    title: 'Search People',
    description: 'Search by name, company, or domain across 280M+ contacts',
    href: '/people-search',
    cta: 'Search',
    icon: Search,
  },
  {
    title: 'Browse Segments',
    description: 'Browse pre-built audience segments by industry',
    href: '/segment-builder',
    cta: 'Browse',
    icon: LayoutGrid,
    showCount: true,
  },
  {
    title: 'Lead Database',
    description: 'Filter the full database by industry, location, and more',
    href: '/lead-database',
    cta: 'Explore',
    icon: Database,
  },
]

export default async function FindLeadsPage() {
  const segmentCount = await getSegmentCount()

  return (
    <PageContainer>
      <PageHeader
        title="Find Leads"
        description="Discover your next customers with powerful search, curated segments, and advanced filters."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col border border-border rounded-xl p-6 bg-background hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <card.icon className="h-6 w-6 text-primary" />
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-2">
              {card.title}
            </h2>

            <p className="text-sm text-muted-foreground mb-4 flex-1">
              {card.description}
            </p>

            {card.showCount && segmentCount > 0 && (
              <p className="text-xs font-medium text-primary mb-4">
                {segmentCount.toLocaleString()} segments available
              </p>
            )}

            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:underline">
              {card.cta}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
